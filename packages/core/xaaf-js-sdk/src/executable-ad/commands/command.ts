import * as Core from '@xaaf/common';
import {
    ErrorUtils,
    CommandEvent,
    CommandEventListener,
    CommandModel,
    ReportProvider,
    CommandTrigger,
    XipEvent,
    XipProvider
} from '@xaaf/common';
import { ConfigService, FeatureFlagsService, LoggerService, ReportService } from '../../services';
import { CommandEventCreator } from '../events/command-events/command-event-creator';
import { StateType } from '../../fsm/state';
import { TriggerType } from '../../fsm/trigger';
import { XaafAdContainer } from '../elements';

const MAX_REPORT_RETRIES = 1;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Command<T = any> {
    commandEventListener: CommandEventListener;
    protected _commandModel: CommandModel<T>;
    protected _httpService = Core.InjectionContainer.resolve<Core.HttpService>(Core.ContainerDef.httpService);
    protected _commandEventCreator: CommandEventCreator = new CommandEventCreator();
    protected _loggerService = LoggerService.getInstance();
    protected _featureFlagsService = FeatureFlagsService.getInstance();

    protected _notify = (commandEvent: CommandEvent): void => this.commandEventListener?.(commandEvent);
    protected _notifyHandled = (): void => this._notify(this._commandEventCreator.createHandledEvent(this));
    protected _notifyCompleted = (): void => this._notify(this._commandEventCreator.createCompletedEvent(this));
    protected _notifyError = (err: Core.XaafError): void =>
        this._notify(this._commandEventCreator.createErrorEvent(err));

    protected _notifyExecuteFailure = (error: Error, errorEndPoint: string): void =>
        this._notifyError(
            ErrorUtils.exAdError(
                Core.ErrorCode.CommandExecuteFailure,
                `${error.name}: ${error.message}`,
                Core.ErrorSubDomain.Xaaba,
                errorEndPoint
            )
        );

    abstract init(xaafAdContainer: XaafAdContainer): void;
    abstract execute(xaafAdContainer: XaafAdContainer, state: StateType, stateInstanceHistory: Set<TriggerType>): void;
    abstract stop(): void;

    pause(): void {
        // stub
    }

    resume(): void {
        // stub
    }

    getCommandTriggersData(): Map<TriggerType, Map<string, number>> {
        const commandTriggersDataMap = new Map<TriggerType, Map<string, number>>();
        if (this._commandModel !== null && this._commandModel.executionTriggers !== null) {
            this._commandModel.executionTriggers
                .filter((executionTrigger) => executionTrigger.data)
                .forEach((executionTrigger: CommandTrigger) => {
                    this._loggerService.info(
                        `[Command:getCommandTriggerData] executionTrigger.data => ${executionTrigger.data}`
                    );
                    commandTriggersDataMap.set(executionTrigger.trigger, executionTrigger.data);
                });
        }
        return commandTriggersDataMap;
    }

    // TODO - remove this getter after adLifeCycle params will be located under executableAd instead of command
    getCommandModel(): CommandModel {
        return this._commandModel;
    }

    handleAction(action: string, state: StateType, stateInstanceHistory: Set<TriggerType>): void {
        this._loggerService.info(`state: ${state}, stateInstanceHistory: ${JSON.stringify(stateInstanceHistory)}`);
        this._loggerService.info(`[Command:handleAction] ${this._commandModel.commandName} action ${action}`);
    }

    protected async _report(report: ReportProvider): Promise<void> {
        ConfigService.getInstance().playerStopTime = new Date();
        report.providers.forEach((provider: XipProvider) => {
            provider.events.forEach(async (event: XipEvent) => {
                await this._reportEvent(provider, event);
            });
        });
    }

    private _composeMeasurementUrl(event: XipEvent): string {
        let urlToSend: string = event.url;
        const configService = ConfigService.getInstance();

        (event.clientOutbound || []).forEach((_xipClientOutbounds) => {
            const _paramValue = configService.getMeasurementParams(_xipClientOutbounds.paramType);
            if (_paramValue) {
                const connector = urlToSend.indexOf('?') < 0 ? '?' : '&';
                urlToSend += `${connector}${_xipClientOutbounds.paramName}=${_paramValue}`;
            }
        });
        return urlToSend;
    }

    private async _reportEvent(provider: XipProvider, event: XipEvent, retryCount = 0): Promise<void> {
        try {
            const url: string = this._composeMeasurementUrl(event);
            await this._httpService.get(url);
        } catch (error) {
            await this._handleNrReportError(error, provider, event, retryCount);
        }
    }

    private async _handleNrReportError(
        err: Core.XaafError,
        provider: XipProvider,
        event: XipEvent,
        retryCount: number
    ): Promise<void> {
        const errorCode: Core.XaafErrorCode = err.errorCode || Core.ErrorCode.NA;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let httpErrorCode = Number.parseInt(err.httpErrorCode) || Number.parseInt((err as any).status);

        if (httpErrorCode === null && !(err instanceof Error)) {
            httpErrorCode = Number.parseInt(err.httpErrorCode);
        }

        const shouldRetry = this.getShouldRetry(errorCode, httpErrorCode, retryCount);

        if (this._featureFlagsService.measurementsImpressionsErrorReportEnabled) {
            const xaafError = ErrorUtils.httpError(
                errorCode,
                `Failed to report ${event.url}`,
                Core.ErrorSubDomain.Metrics,
                event.url
            );
            xaafError.httpErrorCode = httpErrorCode ? httpErrorCode.toString() : Core.ReportDefaultValue.NP;
            xaafError.isRecoverable = shouldRetry;

            if (xaafError.isRecoverable) {
                xaafError.recoveryActionTaken = Core.RecoveryAction.Retry;
                delete xaafError.didTryRecovery; // if isRecoverable = true , don't report didTryRecovery
            } else {
                delete xaafError.recoveryActionTaken; // if isRecoverable = false, don't report recoveryActionTaken
                MAX_REPORT_RETRIES === retryCount
                    ? (xaafError.didTryRecovery = Core.RecoveryAction.Retry)
                    : (xaafError.didTryRecovery = Core.RecoveryAction.None);
            }

            const reporter = ReportService.getInstance();
            const extraFields = {
                provider: provider.name
            };
            const reportObject = reporter.createErrorReport(xaafError, extraFields);
            reporter.reportNoAdLifeCycleEvent(Core.ReportType.Error, reportObject);
        }

        if (shouldRetry) {
            retryCount++;
            this._loggerService.info(
                `[Command]:[_handleNrReportError] retry report ${event.url},  retryCount: ${retryCount}`
            );
            await this._reportEvent(provider, event, retryCount);
        }
    }

    private getShouldRetry(errorCode: Core.XaafErrorCode, httpErrorCode: number, retryCount: number): boolean {
        return (
            (errorCode === Core.ErrorCode.ResourceTimeout || httpErrorCode >= 500) && retryCount < MAX_REPORT_RETRIES
        );
    }

    protected getCommandTriggerConditions(): Map<TriggerType, TriggerType[]> {
        const commandsConditionsMap = new Map<TriggerType, TriggerType[]>();
        this._commandModel.executionTriggers.forEach((executionTrigger: CommandTrigger) => {
            if (executionTrigger.conditions) {
                this._loggerService.info(
                    `[Command:getCommandTriggerConditions] executionTrigger.conditions => ${executionTrigger.conditions}`
                );
                commandsConditionsMap.set(executionTrigger.trigger, executionTrigger.conditions);
            }
        });
        return commandsConditionsMap;
    }

    protected condition(
        currentState: StateType,
        stateInstanceHistory: Set<TriggerType>,
        commandsConditionsMap: Map<TriggerType, TriggerType[]>
    ): boolean {
        if (commandsConditionsMap.has(currentState)) {
            let hasResultCondition = false;
            commandsConditionsMap.forEach((conditions, trigger) => {
                conditions.forEach((conditionState) => {
                    hasResultCondition = stateInstanceHistory.has(conditionState);
                });
                this._loggerService.info(`[Command:condition]: condition: ${conditions}, trigger: ${trigger}`);
            });
            this._loggerService.info(`[Command:condition]: resultCondition: ${hasResultCondition}`);
            return hasResultCondition;
        }
        return true;
    }
}
