import {
    XaafError,
    CommandModel,
    CommandReport,
    ErrorCode,
    ErrorUtils,
    ExecutableAdRequestDelegate
} from '@xaaf/common';
import { Command } from '../executable-ad/commands/command';
import { ReportService } from '../services';
const LOG_KEY = 'HostRequestCommand::';

export class HostRequestCommand extends Command {
    constructor(commandModel: CommandModel) {
        super();
        this._commandModel = commandModel;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init(): void {
        // This is intentional
    }

    execute(): void {
        this._loggerService.info(`[${LOG_KEY}execute] executing command`);
        this._notify(this._commandEventCreator.createHostRequestEvent(this));
    }

    stop(): void {
        this._loggerService.info(`[${LOG_KEY}onLoad] command stopped`);
    }

    async onLoad(): Promise<void> {
        this._loggerService.info(`[${LOG_KEY}onLoad] command loaded`);
        this.onCompleted();
        const report: CommandReport = this._commandModel.report;
        if (report) {
            await this._report(report);
        }
    }

    handleHostListener(delegate: ExecutableAdRequestDelegate): void {
        const payloadData = this._commandModel.data;
        if (payloadData) {
            const request: string = payloadData.type;
            const hostRequestArgs: Map<string, unknown> = payloadData.arguments;
            let timeoutMS: number;

            let isTimeoutError: boolean = false;
            if (payloadData.timeout_ms) {
                timeoutMS = setTimeout(() => {
                    isTimeoutError = true;
                    this.handleHostError(ErrorCode.RequestToHostTimedOut);
                }, payloadData.timeout_ms);
            }

            delegate(request, hostRequestArgs, (errorEvent: Error) => {
                if (timeoutMS) {
                    clearTimeout(timeoutMS);
                }
                if (isTimeoutError) {
                    return;
                }
                if (errorEvent) {
                    this.handleHostError(ErrorCode.RequestToHostFailed, errorEvent.message);
                } else {
                    this.onLoad();
                }
            });
        }
    }

    handleHostError(errorCode: ErrorCode, errorEventMessage?: string): void {
        const xaafError: XaafError = ErrorUtils.sdkError(errorCode, errorEventMessage, null, `${LOG_KEY}execute`);
        this._commandModel.data.mandatory ?? true ? this.onError(xaafError) : this._reportWarning(xaafError);
    }

    async onError(error: XaafError): Promise<void> {
        this._notifyError(error);
    }

    private _reportWarning(xaafError: XaafError): void {
        ReportService.getInstance().reportError(xaafError);
        this._notify(this._commandEventCreator.createWarningEvent(xaafError));
        this.onCompleted();
    }

    onCommandError(error: XaafError): void {
        try {
            this._loggerService.error(`[${LOG_KEY}onCommandError] ${error.message} ${error.errorCode}`);
            this._notifyError(error);
        } catch (error_) {
            this._loggerService.error(`[${LOG_KEY}onCommandError] ${error_}`);
        }
    }

    onCompleted(): void {
        this._notifyHandled();
    }
}
