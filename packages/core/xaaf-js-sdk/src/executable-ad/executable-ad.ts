/* eslint-disable @typescript-eslint/no-explicit-any */
import { serializeError } from 'serialize-error';
import {
    CommandFireAction,
    CommandFireTrigger,
    CommandModel,
    Xip,
    XipAdLifeCycle,
    AdEvent,
    AdEventCreator,
    AdEventListener,
    AdEventReason,
    ContainerDef,
    ErrorCode,
    ErrorResponse,
    ErrorSubDomain,
    ErrorUtils,
    HostParams,
    InjectionContainer,
    RecoveryAction,
    ReportType,
    XaafError,
    XaafErrorCode,
    CommandEvent,
    CommandEventType,
    ErrorCommandEvent,
    StopExperienceCommandEvent,
    ExecutableAdRequestDelegate,
    COMMAND_TRIGGER_HANDLER,
    ReportDefaultValue,
    InitAdParams,
    isShouldRetryError,
    ContentType,
    AdSessionMetricsParams,
    ExpType
} from '@xaaf/common';
import { FSM, State, StateType, FireTriggerMode, Trigger, TriggerType, FSMContext, FSMTrigger, FSMState } from '../fsm';
import { Command } from './commands';
import { XaafAdContainer, XaafElement, XaafAdExtensionElement } from './elements';
import { OpportunityInfo } from '../xaaf-js-sdk';

import {
    ConfigService,
    DateTimeService,
    FeatureFlagsService,
    LoggerService,
    LoginService,
    ReportService,
    TokenExpirationStatus,
    TokenService,
    ContentToggleListService,
    RestApiService
} from '../services';
import { AttributeNames } from './attributes/attributes';
import { UuidGenerator } from '../utils/uuid-generator';
import { ValidatorService } from '../services/validator-service/validator-service';
import { ArrayHelper } from '../utils/array-helper';
import {
    CommandsDataStructuresCreator,
    CommandFireType,
    CommandFireCollection
} from './structures/commands-data-structures-creator';
import { StateMachine } from '@xstate/fsm';

export enum CommandTriggeredBy {
    StateTrigger,
    FireTrigger
}

export type ExecutableAdID = string;

export class ExecutableAd {
    // state
    currentState: StateType = State.STATE_CREATED;
    executableAdEventListener: AdEventListener = null;
    executableAdHostHandlerListener: ExecutableAdRequestDelegate = null;
    protected _stoppingReason = AdEventReason.NA;
    private _hostStoppingReason: string = AdEventReason.NA;
    private _userInteracted: boolean = false;
    private _adPlayed: boolean = false;
    private _currentError: XaafError;
    private readonly _executableAdID: ExecutableAdID;

    // services
    protected get _loginService(): LoginService {
        // lazy
        return LoginService.getInstance();
    }

    private get _commandsDataStructuresCreator(): CommandsDataStructuresCreator {
        // lazy
        return InjectionContainer.resolve<CommandsDataStructuresCreator>(ContainerDef.commandsDataStructuresCreator);
    }

    protected readonly _tokenService = InjectionContainer.resolve<TokenService>(ContainerDef.tokenService);
    protected readonly _configService = InjectionContainer.resolve<ConfigService>(ContainerDef.configService);
    private readonly _validatorService = InjectionContainer.resolve<ValidatorService>(ContainerDef.validatorService);
    private readonly _dateTimeService = InjectionContainer.resolve<DateTimeService>(ContainerDef.dateTimeService);
    private readonly _reportService = ReportService.getInstance();
    protected readonly _loggerService = LoggerService.getInstance();
    private readonly _contentToggleList = ContentToggleListService.getInstance();
    private readonly _featureFlagsService = FeatureFlagsService.getInstance();

    protected readonly _adEventCreator: AdEventCreator = new AdEventCreator();
    protected readonly _fsm: FSM = new FSM();

    // containers
    protected _xaafAdContainer: XaafAdContainer;

    // xip data
    protected readonly _delayExecutionTimersSet = new Set();

    protected _commandsAwaitingHandledEvent = 0;
    protected readonly _commandsArray: Command[] = [];
    protected readonly _triggersToCommandsMap = new Map<string, Command[]>();
    private readonly _stateInstanceHistory: Set<TriggerType> = new Set();
    private readonly _commandIdToFireTriggerMap = new Map<number, Map<FireTriggerMode, CommandFireTrigger[]>>();
    private readonly _commandIdToFireActionMap = new Map<number, Map<FireTriggerMode, CommandFireAction[]>>();
    private readonly _commandIdToCommandMap = new Map<number, Command>();
    private readonly _adLifeCycleParamsForReporting = new Map<string, string>();
    private readonly _xipAttributes = new Map<AttributeNames, string>();

    getOpportunityType(opportunityInfo: OpportunityInfo): string {
        let opportunityType = 'NP';
        if (opportunityInfo?.arguments.get(HostParams.opportunityType)) {
            opportunityType = opportunityInfo?.arguments.get(HostParams.opportunityType);
        } else {
            if (opportunityInfo?.opportunity) {
                opportunityType = opportunityInfo.opportunity;
            }
        }
        return opportunityType;
    }

    constructor(protected opportunityInfo: OpportunityInfo) {
        this._loggerService.debug('[ExecutableAd::constructor] Constructing Ad');

        this._executableAdID = opportunityInfo?.arguments?.get(HostParams.hostRequestId) || UuidGenerator.generate();
        this._reportService.setupExeAdUUIDParam(this._executableAdID);
        this._reportService.setAdLifeCycleParameters(new Map<any, any>());

        const opportunityInfoMap: Record<string, string> = {};

        opportunityInfoMap.opportunityType = this.getOpportunityType(opportunityInfo);

        if (opportunityInfo?.arguments.get(HostParams.context)) {
            opportunityInfoMap.context = opportunityInfo.arguments.get(HostParams.context);
        }

        this._reportService.report(ReportType.HostAdCreate, opportunityInfoMap);
        // Todo | CR: consider moving start after subscribe
        this._fsm.start();
        // Todo | CR: report AdCreated should be last in the cto'r
        this._reportService.report(ReportType.AdCreated, opportunityInfoMap);
        this._fsm.subscribe((state: StateMachine.State<FSMContext, FSMTrigger, FSMState>) => {
            if (state.changed) {
                // Todo | CR: all change logic should be in _stateHandler
                const newState = state.value as StateType;
                this.currentState = newState;
                this._stateInstanceHistory.add(newState);
                this._stateHandler(newState);
            }
        });
        this._loggerService.debug('[ExecutableAd::constructor] Ad Construction completed');
    }

    async initAd(
        xaafAdContainer: XaafAdContainer,
        initAdInfoObject: Map<string, string> | Record<string, string>,
        hostContainer?: XaafAdExtensionElement
    ): Promise<void> {
        try {
            const initAdInfo: Map<string, string> = ArrayHelper.validateMapObject(initAdInfoObject);
            this._xaafAdContainer = xaafAdContainer;
            this._registerExecutableAdStorageService(initAdInfo);
            this._registerHostContainer(hostContainer);
            this._reportHostAdInit(initAdInfo);
            await this._delayEngagement(initAdInfo);

            if (this._isFailed) {
                this._stopAd(AdEventReason.NOT_LOGGED_IN);
                return;
            }

            if (!this._isLoggedIn) {
                this._stopAd(AdEventReason.NOT_LOGGED_IN);
                await this._loginService.silentLoginRequest(false);
                return;
            }

            if (!this._isContentValid(initAdInfo)) {
                this._stopAd(AdEventReason.AD_ACTION_BLACKLIST);
                return;
            }

            if (!this._isStateCreated) {
                this._failAd('ExecutableAd:initAd');
                return;
            }

            this._appendOpportunityInfo(initAdInfo);
            this._setupAdSessionMetricsParams();
            this._reportAdInit(initAdInfo);
            await this._handleReAuth(false);
            return await this._tryGetAndParseOpportunity();
        } catch (error) {
            this._loggerService.error(`[ExecutableAd::initAd] Failed Init Ad: ${JSON.stringify(error)}`);
            this._failAd('[ExecutableAd::initAd]', error);
        }
    }

    getAttribute(attributeName: AttributeNames): string | undefined {
        if (attributeName === AttributeNames.STATE) {
            return this.currentState;
        } else {
            return this._xipAttributes.get(attributeName);
        }
    }

    parseCommands(commandModels: CommandModel[]): Map<TriggerType, Command[]> {
        return this._commandsDataStructuresCreator.createExecutionTriggerToCommandMap(commandModels);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    startAd(_: XaafElement): void {
        this._reportService.report(ReportType.HostAdStart);
        this._loggerService.info('[ExecutableAd::startAd] Starting Ad');
        try {
            if (!this._loginService.isLoggedIn) {
                this._loggerService.warning('[ExecutableAd::startAd] Not logged in. Can not start Ad');
                throw new Error('Not logged in. Can not start Ad');
            }
            this._fsm.next(Trigger.STATE_STARTING);
        } catch (error) {
            this._loggerService.error(
                `[ExecutableAd::startAd] Failed starting Ad: ${JSON.stringify(serializeError(error))}`
            );
            this._failAd('[ExecutableAd::startAd]', error);
        }
    }

    stopAd(reason?: string, isUserInteracted = false): void {
        this._reportService.report(ReportType.HostAdStop);
        if (isUserInteracted && !!this.getAttribute(AttributeNames.ACTION)) {
            this._userInteracted = isUserInteracted;
            this._stopAd(AdEventReason.USER_INTERACTION, reason, State.STATE_INTERACTION);
        } else this._stopAd(AdEventReason.AD_STOPPED, reason);
    }

    pauseAd(): void {
        try {
            this._commandsArray?.forEach((command) => command.pause());
            this._fsm.next(Trigger.STATE_PAUSING);
        } catch (error) {
            this._failAd('[ExecutableAd::pauseAd]', error);
        }
    }

    resumeAd(): void {
        try {
            this._commandsArray?.forEach((command) => command.resume());
            this._fsm.next(Trigger.STATE_RESUMING);
        } catch (error) {
            this._failAd('[ExecutableAd::resumeAd]', error);
        }
    }

    executeTriggeredCommands(commands: Command[], state: StateType, commandTriggeredBy: CommandTriggeredBy): void {
        commands.forEach((command) => {
            const delayValue = this.getCommandTriggerDelayValue(command, state);
            if (delayValue > 0) {
                this._loggerService.info(
                    `[ExecutableAd::executeTriggeredCommands] call to setTimeout for command: ${
                        command.getCommandModel().commandName
                    }`
                );
                const delayExecutionTimer = setTimeout(
                    () => this.executeTriggeredCommand(command, state, commandTriggeredBy),
                    delayValue
                );
                this._delayExecutionTimersSet.add(delayExecutionTimer);
            } else {
                this.executeTriggeredCommand(command, state, commandTriggeredBy);
            }
        });
    }

    executeTriggeredCommand(command: Command, state: StateType, commandTriggeredBy: CommandTriggeredBy): void {
        this._loggerService.info(
            `[ExecutableAd::executeTriggeredCommand] execute command: ${command.getCommandModel().commandName}`
        );

        if (commandTriggeredBy === CommandTriggeredBy.StateTrigger) {
            this._loggerService.debug(
                '[ExecutableAd::executeTriggeredCommand] command is executed due to state trigger - adding to commands awaiting handled collection'
            );
            this._commandsAwaitingHandledEvent++;
        }

        const { id } = command.getCommandModel();
        const { Pre, Post } = FireTriggerMode;

        // Pre Fire Trigger
        this._handleCommandFireTriggers(id, Pre);
        this._handleCommandFireActions(id, Pre);

        command.execute(this._xaafAdContainer, state, this._stateInstanceHistory);

        // Post Fire Trigger
        this._handleCommandFireTriggers(id, Post);
        this._handleCommandFireActions(id, Post);
    }

    private _registerExecutableAdStorageService(initAdInfo: Map<string, string>): void {
        InjectionContainer.registerInstance(
            ContainerDef.executableAdStorageService,
            new Map<string, string>(initAdInfo)
        );
    }

    private _registerHostContainer(hostContainer: XaafAdExtensionElement | undefined): void {
        if (hostContainer) {
            InjectionContainer.registerInstance(ContainerDef.squeezeCommandService, hostContainer);
        }
    }

    private _reportHostAdInit(initAdInfo: Map<string, string>): void {
        this._reportService.report(ReportType.HostAdInit, {
            context: initAdInfo?.get(InitAdParams.context) || ReportDefaultValue.NP
        });
    }

    private _reportAdInit(initAdInfo: Map<string, string>): void {
        const hostAdInitParams = ArrayHelper.buildStringFromArgsMap(initAdInfo);
        this._reportService.report(ReportType.AdInit, { hostAdInitParams });
    }

    private _getEngagementTimeout(initAdInfo: Map<string, string>): number {
        const adStartDelayHint = Number.parseInt(initAdInfo?.get(InitAdParams.adStartDelayHint)) || 0;
        const { preAdStartXaabaEngageTime } = this._configService;
        return Math.max(adStartDelayHint - preAdStartXaabaEngageTime, 0);
    }

    private async _delayEngagement(initAdInfo: Map<string, string>): Promise<void> {
        if (this._featureFlagsService.adStartHintEnabled) {
            const engagementTimeout = this._getEngagementTimeout(initAdInfo);
            await this._dateTimeService.delay(engagementTimeout);
            if (this.currentState !== State.STATE_CREATED) {
                throw new Error('State changed before engagement started');
            }
        }
    }

    private _appendOpportunityInfo(initAdInfo: Map<string, string>): void {
        const { sdkArguments = [] } = ConfigService.getInstance();
        // opportunityInfo is received as an argument in the constructor
        this.opportunityInfo.arguments = new Map([...this.opportunityInfo.arguments, ...sdkArguments, ...initAdInfo]);
        if (!this.opportunityInfo.arguments.get('opportunityType') && this.opportunityInfo.opportunity) {
            this.opportunityInfo.arguments.set('opportunityType', this.opportunityInfo.opportunity);
        }
    }

    private get _isFailed(): boolean {
        return this._loginService.isFailed;
    }

    private get _isLoggedIn(): boolean {
        return this._loginService.isLoggedIn;
    }

    private get _isStateCreated(): boolean {
        /**
         * Note: this is a TEMPORARY fix only, to avoid performing initialization when it shouldn't be performed.
         * The actual solution should be moving all initialization code to be performed only after ExecutableAd's
         * state was changed to INITIATING (moving to INITIATING state is currently done after initialization code
         * completes, not before it starts).
         * Note: There's nothing more permanent than a temporary solution.
         */
        if (this.currentState === State.STATE_CREATED) {
            return true;
        } else {
            this._loggerService.warning(
                '[ExecutableAd::_isExecutableAdStateValid] Executable ad is not in STATE_CREATED'
            );
            return false;
        }
    }

    private async _tryGetAndParseOpportunity(): Promise<void> {
        try {
            return await this._getAndParseOpportunity();
        } catch (error) {
            this._loggerService.error(
                `[ExecutableAd::_tryGetAndParseOpportunity] Failed Init Ad: ${JSON.stringify(error)}`
            );

            if (this._isErrorResponse(error)) {
                return await this._handleError(error);
            } else {
                throw error;
            }
        }
    }

    private _isErrorResponse(val: any): val is ErrorResponse {
        return 'errorCode' in val && 'message' in val;
    }

    private async _handleError(errorResponse: ErrorResponse): Promise<void> {
        switch (errorResponse?.errorCode) {
            case ErrorCode.NoAd: // 204
                this._stopAd(AdEventReason.NO_AD);
                this._loggerService.info('[ExecutableAd::_handleError] getOpportunity returned 204: No Ad');
                break;
            case ErrorCode.General: // 9000: catch all for error cases which are not defined. - fallthrough
            case ErrorCode.ResourceTimeout: // 3000-3
                this._moveToError(
                    ErrorUtils.exAdError(
                        ErrorCode.ResourceTimeout,
                        errorResponse?.message,
                        ErrorSubDomain.Xaaba,
                        this._configService.opportunityUrl,
                        RecoveryAction.None,
                        false
                    )
                );
                break;
            case ErrorCode.NotFound: // 404
                const notFoundError = ErrorUtils.httpError(
                    ErrorCode.NotFound,
                    errorResponse.message,
                    ErrorSubDomain.Xaaba,
                    this._configService.opportunityUrl,
                    RecoveryAction.None
                );
                this._reportService.reportError(notFoundError);
                this._moveToError(notFoundError);
                break;
            case ErrorCode.SessionExpired: // 401-1 - Session has expired
                /**
                 * We report the error and start an error-driver re-authentication, then retry get opportunity
                 */
                this._reportService.reportError(
                    ErrorUtils.exAdError(
                        ErrorCode.SessionExpired,
                        'Session Expired',
                        ErrorSubDomain.Auth,
                        this._configService.opportunityUrl
                    )
                );
                await this._handleReAuth(true);
                return this._tryGetAndParseOpportunity(); // recursive
            case ErrorCode.AuthenticationError: // 401-9000 - Invalid credentials, Locked or Cancelled account
                const authenticationError = ErrorUtils.httpError(
                    ErrorCode.AuthenticationError,
                    'Authentication Error',
                    ErrorSubDomain.Auth,
                    this._configService.opportunityUrl
                );
                this._reportService.reportError(authenticationError);
                this._moveToError(authenticationError);
                break;
            default: {
                if (isShouldRetryError(errorResponse.errorCode)) {
                    this._reportService.reportError(
                        ErrorUtils.exAdError(
                            errorResponse.errorCode as ErrorCode,
                            errorResponse?.message,
                            ErrorSubDomain.Xaaba,
                            this._configService.opportunityUrl,
                            RecoveryAction.Retry,
                            true
                        ),
                        ReportType.AdError
                    );
                    return this._retryGetAndParseOpportunity();
                } else {
                    this._moveToError(
                        ErrorUtils.exAdError(
                            errorResponse.errorCode as ErrorCode,
                            errorResponse?.message,
                            ErrorSubDomain.Xaaba,
                            this._configService.opportunityUrl,
                            RecoveryAction.None,
                            false
                        )
                    );
                }
            }
        }
    }

    private async _retryGetAndParseOpportunity(): Promise<void> {
        try {
            return await this._getAndParseOpportunity();
        } catch (error) {
            this._moveToError(
                ErrorUtils.exAdError(
                    error.errorCode ?? ErrorCode.General,
                    error.message,
                    ErrorSubDomain.Xaaba,
                    this._configService.opportunityUrl,
                    RecoveryAction.None,
                    false
                )
            );
        }
    }

    private async _refreshAccessTokenIfNeeded(isErrorDriven: boolean): Promise<void> {
        const { VALID, ABOUT_TO_EXPIRE, EXPIRED } = TokenExpirationStatus;
        switch (this._tokenService.accessTokenTokenExpirationStatus()) {
            case VALID:
                this._loggerService.info('[ExecutableAd::_handleReAuth] Refresh token and Access token are valid');
                // no need to do anything, continue with getOpportunity
                break;
            case ABOUT_TO_EXPIRE:
                this._loggerService.info(
                    '[ExecutableAd::_handleReAuth] Refresh token is valid. Access token is about to expire. Executing refresh token and Getting and parsing opportunity in parallel'
                );
                // no await, refresh in background
                this._loginService.refreshToken(isErrorDriven);
                break;
            case EXPIRED:
                this._loggerService.info(
                    '[ExecutableAd::_handleReAuth] Refresh token is valid. Access token is expired. Executing refresh token'
                );
                try {
                    // await before continuing
                    await this._loginService.refreshToken(isErrorDriven);
                } catch (error) {
                    this._failAd(this._configService.refreshTokenUrl, error as ErrorResponse);
                    return;
                }
                break;
        }
    }

    private async _handleReAuth(isErrorDriven: boolean): Promise<void> {
        const { VALID, ABOUT_TO_EXPIRE, EXPIRED } = TokenExpirationStatus;
        switch (this._tokenService.refreshTokenTokenExpirationStatus()) {
            case VALID:
                await this._refreshAccessTokenIfNeeded(isErrorDriven);
                return;
            case ABOUT_TO_EXPIRE:
                this._loggerService.info(
                    '[ExecutableAd::_handleReAuth] Refresh token is about to expire. Executing login request in background'
                );
                await this._refreshAccessTokenIfNeeded(isErrorDriven);
                // no await, re-login in background
                // TODO: should we call refresh access token if we already cal silentLogin?
                this._loginService.silentLoginRequest(isErrorDriven);
                return;
            case EXPIRED:
                this._loggerService.info(
                    '[ExecutableAd::_handleReAuth] Refresh token is not valid. Executing login request'
                );
                if (this._tokenService.accessTokenTokenExpirationStatus() !== EXPIRED) {
                    // no await, access token has not yet expired, re-login in background
                    this._loginService.silentLoginRequest(isErrorDriven);
                    return;
                } else {
                    // await re-login before continuing
                    // no need to refresh access token since silentLogin will generate new one
                    await this._loginService.silentLoginRequest(isErrorDriven);
                    this._loggerService.info(
                        '[ExecutableAd::_handleReAuth] Got login response. Getting and parsing opportunity'
                    );
                    return;
                }
        }
    }

    private _isContentValid(initAdInfo: Map<string, string>): boolean {
        return this._contentToggleList.isContentValid(initAdInfo);
    }

    private async _getAndParseOpportunity(): Promise<void> {
        const {
            experienceId,
            experienceMediaType,
            exeAdUUID,
            abstractionId = '',
            itemType = '',
            action = '',
            contentType = '',
            commands
        }: NonNullable<Xip> = await RestApiService.getInstance().getOpportunity(
            this.opportunityInfo.arguments,
            this._executableAdID
        );

        this._xipAttributes.set(AttributeNames.EXPERIENCE_ID, experienceId);
        this._xipAttributes.set(AttributeNames.EXPERIENCE_MEDIA_TYPE, experienceMediaType);
        this._xipAttributes.set(AttributeNames.EXECUTABLE_AD_UUID, exeAdUUID);
        this._xipAttributes.set(AttributeNames.ABSTRACTION_ID, abstractionId);
        this._xipAttributes.set(AttributeNames.ITEM_TYPE, itemType);
        this._xipAttributes.set(AttributeNames.ACTION, action);
        this._xipAttributes.set(AttributeNames.CONTENT_TYPE, contentType);
        this._loggerService.info(
            `[xaaf:ExecutableAd::experienceId] ${experienceId} ,[xaaf:ExecutableAd::exeAdUUID] ${exeAdUUID} `);
        this._loggerService.info(
            '[xaaf:ExecutableAd::getAndParseOpportunity] ' + JSON.stringify(serializeError(commands)));
        this._createCommandsDataStructures(commands);

        this._fsm.next(Trigger.STATE_INITIATING);
    }

    private set triggersToCommandsMap(commandModels: CommandModel[]) {
        this.parseCommands(commandModels).forEach((v: Command[], k: TriggerType) =>
            this._triggersToCommandsMap.set(k, v)
        );
    }

    private set commandIdToFireTriggerMap(commandModels: CommandModel[]) {
        this._commandsDataStructuresCreator
            .createCommandIdToFireTriggerMap(commandModels)
            .forEach((v: Map<FireTriggerMode, CommandFireTrigger[]>, k: number) =>
                this._commandIdToFireTriggerMap.set(k, v)
            );
    }

    private set commandIdToFireActionMap(commandModels: CommandModel[]) {
        this._commandsDataStructuresCreator
            .createCommandIdToFireActionMap(commandModels)
            .forEach((v: Map<FireTriggerMode, CommandFireAction[]>, k: number) =>
                this._commandIdToFireActionMap.set(k, v)
            );
    }

    private set commandsArray(triggersToCommandsMap: Map<string, Command[]>) {
        this._flatten([...(triggersToCommandsMap?.values() || [])]).forEach((v: Command) =>
            this._commandsArray.push(v)
        );
    }

    private set commandIdToCommandMap(commandsArray: Command[]) {
        this._commandsDataStructuresCreator
            .createCommandIdToCommandMap(commandsArray)
            .forEach((v: Command, k: number) => this._commandIdToCommandMap.set(k, v));
    }

    private _createCommandsDataStructures(commandModels: CommandModel[]): void {
        if (!Array.isArray(commandModels)) {
            this._reportCommandInformationError();
            // TODO: should move to error?
            return;
        }

        this.triggersToCommandsMap = commandModels;
        this.commandIdToFireTriggerMap = commandModels;
        this.commandIdToFireActionMap = commandModels;
        this.commandsArray = this._triggersToCommandsMap;
        this.commandIdToCommandMap = this._commandsArray;

        this._commandsArray.forEach((command: Command) => {
            this._loggerService.verbose(
                '[ExecutableAd::_createCommandsDataStructures] will init ' + command['_commandModel'].commandName
            );
            command.init(this._xaafAdContainer);
            command.commandEventListener = (event: CommandEvent) => this._commandEventListener(event);
        });

        const commandTriggerHandler = (type: string): void => {
            const commands: Command[] = this._getCommandsForTrigger(type);
            this.executeTriggeredCommands(commands, this.currentState, CommandTriggeredBy.FireTrigger);
        };

        const context = InjectionContainer.resolve<Map<string, () => void>>(ContainerDef.executableAdStorageService);
        context.set(COMMAND_TRIGGER_HANDLER, commandTriggerHandler.bind(this));
    }

    private _commandEventListener(event: CommandEvent): void { // NOSONAR - function complexity
        switch (event.type) {
            case CommandEventType.Error: {
                this._loggerService.error('[ExecutableAd::_commandEventListener] Command Error');
                const errorEvent = event as ErrorCommandEvent;
                this._resetDelayExecutionTimers();
                this._moveToError(errorEvent.error);
                break;
            }
            case CommandEventType.Warning:
                const errorEventForWarning = event as ErrorCommandEvent;
                const warningEvent: AdEvent = this._adEventCreator.createWarningEvent(errorEventForWarning.error);
                this._notify(warningEvent);
                break;
            case CommandEventType.Handled:
                if (event.command) {
                    this._loggerService.info(
                        `[ExecutableAd::_commandEventListener] Command Handled: ${
                            event.command?.getCommandModel()?.commandName
                        }`
                    );
                    this._commandsAwaitingHandledEvent--;
                    if (this._commandsAwaitingHandledEvent === 0) {
                        this._moveToNextState(this.currentState);
                    } else {
                        this._loggerService.debug(
                            `[ExecutableAd::_commandEventListener] not moving to next state. Commands awaiting Handled event :${this._commandsAwaitingHandledEvent}`
                        );
                    }
                }
                break;
            case CommandEventType.Completed:
                if (event.command) {
                    this._loggerService.info('[ExecutableAd::_commandEventListener] Command Completed.');
                    this._handleCommandFireTriggers(event.command.getCommandModel().id, FireTriggerMode.Completed);
                    this._handleCommandFireActions(event.command.getCommandModel().id, FireTriggerMode.Completed);
                }
                break;
            case CommandEventType.Interactive:
                if (event.command) {
                    this._loggerService.info('[ExecutableAd::_commandEventListener] Command Interactive.');
                    this._handleCommandFireTriggers(event.command.getCommandModel().id, FireTriggerMode.Completed);
                    this._handleCommandFireActions(event.command.getCommandModel().id, FireTriggerMode.Completed);
                }
                break;
            case CommandEventType.StopExperience:
                this._loggerService.info(
                    `[ExecutableAd::_commandEventListener] Command Handled: ${
                        event.command?.getCommandModel()?.commandName
                    }`
                );
                this._handleStopExperienceEvent(event);
                break;
            case CommandEventType.HostRequest:
                this._loggerService.info(
                    `[ExecutableAd::_commandEventListener] Command Handled: ${
                        event.command?.getCommandModel()?.commandName
                    }`
                );
                if (!this.executableAdHostHandlerListener) {
                    event.command.handleHostError(ErrorCode.RequestToHostNotSupported);
                } else {
                    event.command.handleHostListener(this.executableAdHostHandlerListener);
                }
                break;
            default:
                this._loggerService.info(`[ExecutableAd::_commandEventListener] Command event: ${event.type}`);
        }
    }

    private _handleStopExperienceEvent(event: StopExperienceCommandEvent): void {
        this._resetDelayExecutionTimers();
        this._stopAd(AdEventReason.SELF_DISMISS, event.reason);
        if (event.isNotifyHost) {
            // send notification to host:self-dismiss
            this._notify(this._adEventCreator.createExperienceInfoEvent(event.reason));
        }
    }

    protected _stopAd(reason?: AdEventReason, hostStoppingReason?: string, nextState = Trigger.STATE_STOPPING): void {
        this._loggerService.info('[ExecutableAd::_stopAd] Stopping Ad');
        this._resetDelayExecutionTimers();
        this._stoppingReason = reason || AdEventReason.NA;
        this._hostStoppingReason = hostStoppingReason || AdEventReason.NA;

        try {
            this._fsm.next(nextState);
        } catch (error) {
            this._loggerService.info(`[ExecutableAd::_stopAd] Failed stopping Ad: ${error}`);
            this._failAd('[ExecutableAd::_stopAd]', error);
        }
    }

    protected _stopCommands(): void {
        this._commandsArray?.forEach((command) => command.stop());
    }

    private _stopFSM(): void {
        this._fsm.stop();
    }

    protected _stopAll(): void {
        this._commandsArray?.forEach((command) => command.stop());
        this._fsm.stop();
    }

    protected _failAd(
        endPoint: string,
        error?: Error,
        errorCode: XaafErrorCode = ErrorCode.General,
        errorSubDomain = ErrorSubDomain.Xaaba
    ): void {
        this._moveToError(
            ErrorUtils.exAdError(
                errorCode,
                `${error?.message || 'no error thrown'}`,
                errorSubDomain,
                endPoint,
                RecoveryAction.None,
                false,
            )
        );
    }

    protected _moveToError(xaafError: XaafError): void {
        this._currentError = xaafError;
        this._fsm.next(Trigger.STATE_ERROR);
    }

    protected _notify(adEvent: AdEvent): void {
        if (this._validatorService.isAFunction(this.executableAdEventListener)) {
            this.executableAdEventListener(adEvent);
        }
    }

    protected _isFunction(functionCandidate: unknown): boolean {
        return typeof functionCandidate === 'function';
    }

    private _handleCommandFireTriggers(commandId: number, fireTriggerMode: FireTriggerMode): void {
        this._handleCommandFire(
            commandId,
            this._commandIdToFireTriggerMap,
            fireTriggerMode,
            CommandFireType.Trigger,
            (fireCollection) => {
                this._handleFireTriggerCommands(fireCollection);
            }
        );
    }

    private _handleCommandFireActions(commandId: number, fireTriggerMode: FireTriggerMode): void {
        this._handleCommandFire(
            commandId,
            this._commandIdToFireActionMap,
            fireTriggerMode,
            CommandFireType.Action,
            (fireCollection) => {
                this._handleFireActionCommands(fireCollection as CommandFireAction[]);
            }
        );
    }

    private _handleCommandFire(
        commandId: number,
        commandFireIdToFireCollectionMap: Map<number, Map<FireTriggerMode, CommandFireCollection>>,
        fireTriggerMode: FireTriggerMode,
        fireType: CommandFireType,
        handleFireCommandCallback: (fireCollection: CommandFireCollection) => void
    ): void {
        const commandFireMap = commandFireIdToFireCollectionMap.get(commandId);
        const isEmpty = !commandFireMap || commandFireMap.size === 0;
        if (isEmpty) {
            this._loggerService.debug(
                `[ExecutableAd::_handleCommandFire] no fire ${fireType} for command with id ${commandId}`
            );
            return;
        }

        const commandFireCollection = commandFireMap.get(fireTriggerMode) || [];
        if (this._commandsDataStructuresCreator.isEmpty(commandFireCollection)) {
            this._loggerService.debug(
                `[ExecutableAd::_handleCommandFire] no ${fireTriggerMode} fire ${fireType} for command with id ${commandId}`
            );
            return;
        }

        handleFireCommandCallback(commandFireCollection);
    }

    private _handleFireTriggerCommands(commandSpecificFireTriggers: CommandFireTrigger[]): void {
        commandSpecificFireTriggers.forEach((commandFireTrigger: CommandFireTrigger) => {
            const commands: Command[] = this._getCommandsForTrigger(commandFireTrigger.name);
            this.executeTriggeredCommands(commands, this.currentState, CommandTriggeredBy.FireTrigger);
        });
    }

    private _handleFireActionCommands(commandFireActions: CommandFireAction[]): void {
        commandFireActions.forEach((commandFireAction: CommandFireAction) => {
            const command: Command = this._commandIdToCommandMap.get(commandFireAction.commandId);
            command.handleAction(commandFireAction.name, this.currentState, this._stateInstanceHistory);
        });
    }

    getCommandTriggerDelayValue(command: Command, state: StateType): number {
        let delayVal = 0;
        const triggersMap = command.getCommandTriggersData();
        if (triggersMap.size > 0) {
            const triggerData = triggersMap.get(state);
            if (triggerData !== null) {
                delayVal = triggerData['delay'];
                if (!Number.isInteger(delayVal)) {
                    delayVal = 0;
                }
            }
        }
        return delayVal;
    }

    protected _getDelayExecutionValueForState(commands: Command[], state: StateType): number {
        let delayVal = 0;
        const firstCommand = commands[0];
        const triggersMap = firstCommand.getCommandTriggersData();
        if (triggersMap.size > 0) {
            const triggerData = triggersMap.get(state);
            if (triggerData !== null) {
                delayVal = triggerData['delay'];
                if (delayVal === null || Number.isNaN(delayVal)) {
                    delayVal = 0;
                }
            }
        }
        return delayVal;
    }

    getSizeOfDelayExecutionTimerSet(): number {
        return this._delayExecutionTimersSet.size;
    }

    private _resetDelayExecutionTimers(): void {
        this._delayExecutionTimersSet.forEach((timer: number) => clearTimeout(timer));
        this._delayExecutionTimersSet.clear();
    }

    // Todo | CR: change to more descriptive name
    protected _stateHandler(state: StateType): void {
        this._handleCurrentState(state);
        const commands = this._getCommandsForTrigger(state);
        if (commands.length === 0) {
            this._moveToNextState(state);
        } else {
            this._commandsAwaitingHandledEvent = 0;
            // 'commands' is the array of commands for specified trigger(state).
            // Find if there is trigger data defined. if exist - check for "delay" parameter.
            // If delay parameter exist - start timer and all commands will be executed once timer will be fired.
            this.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
        }
    }

    protected _moveToNextState(currentState: StateType): void { //NOSONAR - (Optimized)
        switch (currentState) {
            case State.STATE_INITIATING: {
                this._fsm.next(Trigger.STATE_LOADED);
                break;
            }
            case State.STATE_LOADED: {
                this._notify(this._adEventCreator.createLoadedEvent());
                break;
            }
            case State.STATE_STARTING: {
                this._fsm.next(Trigger.STATE_STARTED);
                break;
            }
            case State.STATE_STARTED: {
                this._notify(this._adEventCreator.createStartedEvent());
                this._fsm.next(Trigger.STATE_PLAYING);
                break;
            }
            case State.STATE_PAUSING: {
                this._fsm.next(Trigger.STATE_PAUSED);
                break;
            }
            case State.STATE_PAUSED: {
                this._notify(this._adEventCreator.createPausedEvent());
                break;
            }
            case State.STATE_RESUMING: {
                this._fsm.next(Trigger.STATE_RESUMED);
                break;
            }
            case State.STATE_RESUMED: {
                this._notify(this._adEventCreator.createResumedEvent());
                break;
            }
            case State.STATE_INTERACTION: {
                this._fsm.next(Trigger.STATE_STOPPING);
                break;
            }
            case State.STATE_STOPPING: {
                this._stopCommands();
                this._fsm.next(Trigger.STATE_STOPPED);
                break;
            }
            case State.STATE_STOPPED: {
                this._notify(this._adEventCreator.createStoppedEvent(this._stoppingReason));
                this._stopFSM();
                break;
            }
            case State.STATE_ERROR: {
                const xaafError = this._currentError;

                // Notify
                // TODO - notify could throw, and we wouldn't stopAll
                const errorAdEvent = this._adEventCreator.createErrorEvent(xaafError);
                this._notify(errorAdEvent);

                // Cleanup
                this._currentError = null;
                this._stopAll();
                break;
            }
            case State.STATE_TERMINATED: {
                this._stopAll();
                break;
            }
            default: {
                // TODO: Handle unsupported state e.g. notify warning.
                break;
            }
        }
    }

    protected _handleCurrentState(currentState: StateType): void { //NOSONAR - (Optimized)
        switch (currentState) {
            case State.STATE_LOADED: {
                this._setAdLifeCycleParamsForReporting();
                this._reportService.report(ReportType.AdLoaded);
                break;
            }
            case State.STATE_STARTING: {
                this._reportService.report(ReportType.AdStarting);
                break;
            }
            case State.STATE_STARTED: {
                this._reportService.report(ReportType.AdStarted);
                break;
            }
            case State.STATE_PLAYING: {
                this._adPlayed = true;
                this._reportService.report(ReportType.AdPlaying);
                break;
            }
            case State.STATE_INTERACTION: {
                this._reportService.report(ReportType.AdInteraction);
                break;
            }
            case State.STATE_STOPPING: {
                this._reportService.report(ReportType.AdStopping, {
                    reason: this._stoppingReason || AdEventReason.NA,
                    hostStoppingReason: this._hostStoppingReason || AdEventReason.NA,
                    userInteracted: this._userInteracted,
                    interactiveAd: !!this.getAttribute(AttributeNames.ACTION)
                });
                break;
            }
            case State.STATE_STOPPED: {
                this._reportService.report(ReportType.AdStopped, {
                    reason: this._stoppingReason || AdEventReason.NA,
                    hostStoppingReason: this._hostStoppingReason || AdEventReason.NA
                });
                break;
            }
            case State.STATE_ERROR: {
                const xaafError = this._currentError;

                // Report
                const errorReport = xaafError
                    ? this._reportService.createErrorReport({
                          ...xaafError,
                          userInteracted: this._userInteracted && this._adPlayed,
                          interactiveAd: !!this.getAttribute(AttributeNames.ACTION) && this._adPlayed
                      })
                    : {};
                this._reportService.report(ReportType.AdError, errorReport);
                break;
            }
            default: {
                // TODO: Handle unsupported state e.g. notify warning.
                break;
            }
        }
    }

    protected _flatten<T>(arrayOfArrays: T[][]): T[] {
        return [].concat(...arrayOfArrays);
    }

    protected _getCommandsForTrigger(trigger: string): Command[] {
        if (!this._loginService.isXaafAvailable) {
            return [];
        }
        return this._triggersToCommandsMap?.get(trigger) || [];
    }

    private _reportCommandInformationError(): void {
        const xaafError = ErrorUtils.exAdError(
            ErrorCode.CommandInformationNotSufficient,
            'Commands are not a valid array',
            ErrorSubDomain.Xaaba,
            'ExecutableAd::_reportCommandInformationError'
        );
        this._reportService.reportError(xaafError);
    }

    // TODO - change this setter to find adLifeCycle params in
    // the main root of executableAd instead of finding it in the command itself
    // The change should happen when the XIP will be changed
    private _setAdLifeCycleParamsForReporting(): void {
        this._adLifeCycleParamsForReporting.set('expID', this.getAttribute(AttributeNames.EXPERIENCE_ID));

        const firstCommand = this._getFirstCommand();
        if (firstCommand) {
            const commandModel = firstCommand.getCommandModel();
            if (commandModel?.report?.adLifeCycle) {
                commandModel.report.adLifeCycle.forEach((val: XipAdLifeCycle) => {
                    this._adLifeCycleParamsForReporting.set(val?.paramType?.toString(), val?.paramName?.toString());
                });
            }
        }

        if (this._adLifeCycleParamsForReporting.size > 0) {
            this._reportService.setAdLifeCycleParameters(this._adLifeCycleParamsForReporting);
        }
    }

    private _getCommandsArray(): Command[] {
        return this._triggersToCommandsMap?.entries()?.next()?.value?.[1];
    }

    private _getFirstCommand(): Command {
        return this._getCommandsArray()?.[0];
    }

    private get _adInitRecord(): AdSessionMetricsParams {
        return {
            [InitAdParams.adStartDelayHint]: Number.parseInt(
                this.opportunityInfo.arguments.get(InitAdParams.adStartDelayHint)
            ),
            [InitAdParams.channelId]: this.opportunityInfo.arguments.get(InitAdParams.channelId),
            [InitAdParams.channelName]: this.opportunityInfo.arguments.get(InitAdParams.channelName),
            [InitAdParams.contentType]: this.opportunityInfo.arguments.get(InitAdParams.contentType) as ContentType,
            [InitAdParams.context]: this.opportunityInfo.arguments.get(InitAdParams.context),
            [InitAdParams.expType]: this.opportunityInfo.arguments.get(InitAdParams.expType) as ExpType,
            [InitAdParams.isDuringAd]:
                this.opportunityInfo.arguments.get(InitAdParams.isDuringAd)?.toLowerCase() === 'true',
            [InitAdParams.networkName]: this.opportunityInfo.arguments.get(InitAdParams.networkName),
            [InitAdParams.programName]: this.opportunityInfo.arguments.get(InitAdParams.programName),
            [InitAdParams.programmerName]: this.opportunityInfo.arguments.get(InitAdParams.programmerName)
        };
    }

    private _setupAdSessionMetricsParams(): void {
        this._reportService.setupAdSessionMetricsParams(this._adInitRecord);
    }
}
