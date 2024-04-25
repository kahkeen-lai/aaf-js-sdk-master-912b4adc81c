/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import { UuidGenerator } from '../../utils/uuid-generator';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import { ConfigService } from '../config-service/config-service';
import { LoggerService } from '../logger-service/logger-service';
import {
    HostParams,
    AdSessionMetricsParams,
    CommonSDKMetricsParams,
    ContainerDef,
    HttpResponse,
    HttpService,
    InjectionContainer,
    LifeCycleEvent,
    LoginProperties,
    NO_TIMEOUT,
    ReportDefaultValue,
    Reporter,
    ReportType,
    TimeSinceEvent,
    XaafError
} from '@xaaf/common';
import { ArrayHelper } from '../../utils/array-helper';
import { ExecutableAdID } from '../../executable-ad/executable-ad';

export const reportStorageKeyPrefix = 'report-';
export interface ReportServiceDelegate {
    init: (intervalInMilliseconds: number, bulkSize: number, bulkFFEnable: boolean) => void;
    isInitialized: () => boolean;
    putInReportQueue: (report: any) => Promise<boolean>;
}

export class ReportService implements Reporter {
    private _commonSDKMetricsParams: CommonSDKMetricsParams;
    private _adSessionMetricsParams: Partial<AdSessionMetricsParams>;
    private _logger: LoggerService;
    private _isInitialized = false;
    private _featureFlagsService = FeatureFlagsService.getInstance();
    private _lastEvent: LifeCycleEvent = { reportEvent: {}, eventTime: 0 };
    private _lastErrorEvent: LifeCycleEvent = { reportEvent: {}, eventTime: 0 };
    private _timeSinceParams = new Map<string, number>();
    private _sessionId: string;
    private _exeAdUUID: ExecutableAdID;
    private _adLifeCycleParameters: Record<string, unknown>;
    private static _lastSentTime: Date;
    get delegate(): ReportServiceDelegate {
        return InjectionContainer.resolve<ReportServiceDelegate>(ContainerDef.reportServiceDelegate);
    }

    constructor() {
        this._logger = LoggerService.getInstance();
    }

    static getInstance(): ReportService {
        return InjectionContainer.resolve<ReportService>(ContainerDef.reportService);
    }

    init(): void {
        if (!this._isInitialized) {
            this._logger = LoggerService.getInstance();
            this._logger.debug('[ReportService::init] Initializing', { sendOverNetwork: false });
            this._commonSDKMetricsParams = this._buildCommonSDKMetricsParams();
            this._sessionId = UuidGenerator.generate();
            ReportService._lastSentTime = new Date();
            this._isInitialized = true;
            if (!this.delegate) {
                this._logger.error('[ReportService::init] missing delegate to init', {
                    sendOverNetwork: false
                });
                return;
            }
            this.delegate.init(this._reportingBulkDelay(), this._reportingBulk(), this.isBulkFeatureFlagEnable());
            this._logger.debug('[ReportService::init] Initialization completed', { sendOverNetwork: false });
        } else {
            this._logger.debug('[ReportService::init] init called but already initialized', {
                sendOverNetwork: false
            });
        }
    }

    isBulkFeatureFlagEnable(): boolean {
        return this._featureFlagsService.reportInBulksEnabled;
    }

    private _reportingBulk(): number {
        if (this.isBulkFeatureFlagEnable()) {
            return ConfigService.getInstance().bulkConfiguration.reportingBulk;
        } else {
            return 1;
        }
    }

    private _reportingBulkDelay(): number {
        return ConfigService.getInstance().bulkConfiguration.reportingBulkDelay;
    }

    isInitialized(): boolean {
        return this._isInitialized;
    }

    async sendReports(reports: string[]): Promise<boolean> {
        this._logger.verbose('[ReportService::sendReports] sending reports', { sendOverNetwork: false });
        if (reports.length === 0) {
            this._logger.verbose('[ReportService::sendReports] nothing to send', { sendOverNetwork: false });
            return true;
        }
        const reqBody = `[${reports.join(',')}]`;
        let response;
        try {
            response = await this._sendRequest(reqBody);
        } catch (error) {
            this._logger.warning(`[ReportService::sendReports] Failed sending report to New Relic: ${error}`, {
                sendOverNetwork: false
            });

            return false;
        }
        let result = false;
        if (response) {
            result = response.status > 199 && response.status < 300;
            this._logger.verbose(
                `[ReportService::sendReports] sent ${reports.length} reports to New Relic with status ${response.status}`,
                {
                    sendOverNetwork: false
                }
            );
        }
        return result;
    }

    private async _sendReport(report: unknown): Promise<HttpResponse<any>> {
        const reqBody = typeof report === 'string' ? report : JSON.stringify(report);
        return this._sendRequest(reqBody);
    }

    private async _sendRequest(reqBody: string): Promise<any> {
        const configService = ConfigService.getInstance();
        if (configService.newrelicUrl) {
            const httpService: HttpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            return httpService.post(
                configService.newrelicUrl,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Insert-Key': configService.nrApiKey
                    },
                    timeout: NO_TIMEOUT
                },
                reqBody
            );
        } else {
            this._logger.warning('[ReportService::report] Failed sending a single report to New Relic, no url');
        }
    }

    private async _putInBulkQueue(report): Promise<void> {
        await this.delegate.putInReportQueue(report);
    }

    private _prepareReport(
        reportType: ReportType,
        properties: Record<string, string | number | boolean> = {}
    ): Record<string, unknown> {
        let report = this._prepareBasicReport(reportType, properties);
        report = this._prepareAdLifeCycleReport(reportType, report);
        return report;
    }

    private _prepareBasicReport(
        reportType: ReportType,
        properties: Record<string, string | number | boolean> = {}
    ): Record<string, unknown> {
        const exeAdUUIDParam = this._getExeAdUUID();
        const featureFlags = this._featureFlagsService.enabledFlags;

        const report = {
            ...this._commonSDKMetricsParams,
            ...ReportService._addAdditionalMetricsParams(),
            ...{ sessionId: this._sessionId },
            ...exeAdUUIDParam,
            ...properties,
            ...this._adLifeCycleParameters,
            ...this._adSessionMetricsParams,
            ...{
                name: reportType,
                featureFlags
            }
        };

        if (reportType === ReportType.Error || reportType === ReportType.Refresh || reportType === ReportType.Login) {
            if (report.context) {
                delete report.context;
            }
        }

        return report;
    }

    private _prepareAdLifeCycleReport(
        reportType: ReportType,
        report: Record<string, unknown>
    ): Record<string, unknown> {
        const timeSinceParameters = this._updateSinceTimeParams(reportType);
        const lastAdLifeCycleEventName = this._returnLastAdLifeCycleEventName(reportType);
        report = {
            ...report,
            ...timeSinceParameters,
            ...lastAdLifeCycleEventName
        };
        return report;
    }

    async report(reportType: ReportType, properties: Record<string, string | number | boolean> = {}): Promise<void> {
        const report = this._prepareReport(reportType, properties);
        this._resetAdSessionMetricsParamsIfTerminated(reportType);
        this._updateTimeSinceParamsForNextIteration(reportType);
        return this._handleSendReport(report);
    }

    async reportNoAdLifeCycleEvent(
        reportType: ReportType,
        properties: Record<string, string | number | boolean> = {}
    ): Promise<void> {
        const report = this._prepareBasicReport(reportType, properties);
        this._handleSendReport(report);
    }

    private async _handleSendReport(report: Record<string, unknown>): Promise<void> {
        if (this.isBulkFeatureFlagEnable()) {
            this._putInBulkQueue(report);
        } else {
            if (!this._isInitialized) {
                return;
            }
            try {
                this._logger.verbose('[ReportService::report] sending a single report to New Relic', {
                    sendOverNetwork: false
                });
                await this._sendReport(report);
            } catch (error) {
                this._logger.warning(
                    `[ReportService:: report]Failed sending a single report to New Relic ${JSON.stringify(error)}`,
                    {
                        sendOverNetwork: false
                    }
                );
            }
        }
    }

    async reportLogin(
        args: Map<string, string>,
        loginProperties: LoginProperties,
        reportType: ReportType
    ): Promise<void> {
        if (!this._isInitialized) {
            return;
        }
        const { loginRequestId, isSilent, success, mode } = loginProperties;
        const hostSdkInitParams = ArrayHelper.buildStringFromArgsMap(args);
        const properties = {
            loginRequestId,
            hostSdkInitParams,
            isSilent,
            mode,
            success
        };
        return this.report(reportType, properties);
    }

    setupExeAdUUIDParam(executableAdID: ExecutableAdID): void {
        this._exeAdUUID = executableAdID;
    }

    setAdLifeCycleParameters(adLifeCycleParameters: Map<string, unknown>): void {
        if (adLifeCycleParameters) {
            this._adLifeCycleParameters = ArrayHelper.convertMapToArray(adLifeCycleParameters);
        } else {
            this._adLifeCycleParameters = {};
        }
    }

    setupAdSessionMetricsParams(properties: AdSessionMetricsParams): void {
        this._adSessionMetricsParams = properties;
    }

    private _resetAdSessionMetricsParamsIfTerminated(reportType: ReportType): void {
        if (reportType === ReportType.AdStopped || reportType === ReportType.AdError) {
            this._adSessionMetricsParams = {};
        }
    }

    private _buildCommonSDKMetricsParams(): CommonSDKMetricsParams {
        const commonSDKMetricsParams = this.createDefaultCommonSDKMetricsParams();
        const configService = ConfigService.getInstance();
        Object.keys(commonSDKMetricsParams).forEach((key) =>
            configService.sdkArguments && configService[key]
                ? (commonSDKMetricsParams[key] = configService[key])
                : commonSDKMetricsParams[key]
        );
        return commonSDKMetricsParams;
    }

    private static _addAdditionalMetricsParams(): Record<string, string | number | boolean> {
        const currentDate = new Date();
        return {
            clientTime: currentDate.toISOString(), // TODO - check with other
            isSDKTrace: false,
            loginState: true,
            // eslint-disable-next-line unicorn/string-content
            eventType: 'XandrSDK' // TODO - check if needed
        };
    }

    private _updateTimeSinceParamsForNextIteration(reportType): void {
        if (
            reportType === ReportType.Login ||
            reportType === ReportType.AdStopped ||
            reportType === ReportType.AdError
        ) {
            this._timeSinceParams = new Map<string, number>();
        }
    }

    private _returnLastAdLifeCycleEventName(reportType: ReportType): Record<string, unknown> {
        const currentLastEvent: LifeCycleEvent = { reportEvent: {}, eventTime: Date.now() };
        switch (reportType) {
            case ReportType.Login:
                break;
            case ReportType.HostAdCreate:
                currentLastEvent.reportEvent = { lastAdLifeCycleEventName: ReportDefaultValue.NA };
                break;
            case ReportType.HostAdInit:
            case ReportType.HostAdStart:
            case ReportType.HostAdStop:
                if (
                    this._lastErrorEvent?.reportEvent?.['lastAdLifeCycleEventName'] === ReportType.Error ||
                    this._lastErrorEvent?.reportEvent?.['lastAdLifeCycleEventName'] === ReportType.AdError
                ) {
                    currentLastEvent.reportEvent = this._lastErrorEvent.reportEvent;
                    this._lastErrorEvent = { reportEvent: {}, eventTime: 0 };
                } else {
                    currentLastEvent.reportEvent = this._lastEvent.reportEvent;
                }
                break;
            default:
                currentLastEvent.reportEvent = this._lastEvent.reportEvent;
                break;
        }
        if (reportType === ReportType.Error || reportType === ReportType.AdError) {
            this._lastErrorEvent = {
                reportEvent: { lastAdLifeCycleEventName: reportType },
                eventTime: currentLastEvent.eventTime
            };
        } else {
            this._lastEvent = {
                reportEvent: { lastAdLifeCycleEventName: reportType },
                eventTime: currentLastEvent.eventTime
            };
        }
        return currentLastEvent.reportEvent;
    }

    private _getExeAdUUID(): Record<string, string> {
        return { exeAdUUID: this._exeAdUUID };
    }

    createDefaultCommonSDKMetricsParams(): CommonSDKMetricsParams {
        return {
            [HostParams.appName]: ReportDefaultValue.NA,
            [HostParams.appVersion]: ReportDefaultValue.NA,
            [HostParams.device]: 'TBD',
            [HostParams.deviceGroup]: ReportDefaultValue.NA,
            [HostParams.deviceManufacturer]: 'TBD',
            [HostParams.deviceModel]: 'TBD',
            [HostParams.deviceType]: ReportDefaultValue.NA,
            [HostParams.deviceUUID]: ReportDefaultValue.NA,
            [HostParams.externalIP]: ReportDefaultValue.NA,
            [HostParams.internalIP]: ReportDefaultValue.NA,
            [HostParams.osName]: 'TBD',
            [HostParams.osVersion]: 'TBD',
            [HostParams.platform]: ReportDefaultValue.NA,
            [HostParams.platformAdvId]: ReportDefaultValue.NA,
            [HostParams.platformName]: ReportDefaultValue.NA,
            [HostParams.sdkName]: ReportDefaultValue.NA,
            [HostParams.sdkVersion]: ReportDefaultValue.NA,
            [HostParams.tenantName]: ReportDefaultValue.NA,
            [HostParams.userType]: ReportDefaultValue.NA,
            [HostParams.memUsageMb]: ReportDefaultValue.NA,
            [HostParams.appMode]: ReportDefaultValue.NA
        };
    }

    private _updateSinceTimeParams(reportType: ReportType): Record<string, unknown> {
        if (reportType !== ReportType.Login) {
            if (
                reportType === ReportType.HostAdCreate ||
                (reportType === ReportType.Error && !this._lastEvent.eventTime)
            ) {
                this._timeSinceParams.set(TimeSinceEvent.LastLifeCycleEvent, 0);
            } else {
                this._timeSinceParams.set(TimeSinceEvent.LastLifeCycleEvent, Date.now() - this._lastEvent.eventTime);
            }
        }
        const reportTypeToTimeSinceEventMap = this._getReportTypeToTimeSinceEventMap();
        const timeSinceEvent: TimeSinceEvent = reportTypeToTimeSinceEventMap.get(reportType);
        if (timeSinceEvent) {
            this._timeSinceParams.set(timeSinceEvent, 0);
        }
        reportTypeToTimeSinceEventMap.delete(reportType);
        for (const value of reportTypeToTimeSinceEventMap.values()) {
            this._setTimeSinceEvent(value);
        }

        return ArrayHelper.convertMapToArray(this._timeSinceParams);
    }

    private _getReportTypeToTimeSinceEventMap(): Map<ReportType, TimeSinceEvent> {
        return new Map<ReportType, TimeSinceEvent>([
            [ReportType.HostAdCreate, TimeSinceEvent.HostAdCreated],
            [ReportType.HostAdInit, TimeSinceEvent.HostAdInit],
            [ReportType.HostAdStart, TimeSinceEvent.HostAdStarted],
            [ReportType.HostAdStop, TimeSinceEvent.HostAdStop],
            [ReportType.AdCreated, TimeSinceEvent.AdCreated],
            [ReportType.AdStarted, TimeSinceEvent.AdStarted]
        ]);
    }

    private _setTimeSinceEvent(param: TimeSinceEvent): void {
        if (this._timeSinceParams.has(param)) {
            const currentTimeSince =
                this._timeSinceParams.get(param) + this._timeSinceParams.get(TimeSinceEvent.LastLifeCycleEvent);
            this._timeSinceParams.set(param, currentTimeSince);
        }
    }

    createErrorReport(
        error: XaafError,
        extraFields?: Record<string, unknown>
    ): Record<string, string | number | boolean> {
        return {
            errorDomain: error.errorDomain,
            errorSubDomain: error.errorSubDomain,
            isRecoverable: error.isRecoverable,
            didTryRecovery: error.didTryRecovery,
            recoveryActionTaken: error.recoveryActionTaken,
            errorCode: error.errorCode,
            httpErrorCode: error.httpErrorCode,
            errorEndPoint: error.errorEndPoint,
            errorDesc: error.errorDesc,
            userInteracted: error.userInteracted,
            interactiveAd: error.interactiveAd,
            ...extraFields
        };
    }

    reportError(
        error: XaafError,
        reportType: ReportType = ReportType.Error,
        reporter: Reporter = ReportService.getInstance()
    ): void {
        const errorReport = this.createErrorReport(error);
        reporter.report(reportType, errorReport);
    }

    updateParamsAfterLogin(): void {
        this.delegate.init(this._reportingBulkDelay(), this._reportingBulk(), this.isBulkFeatureFlagEnable());
    }
}

InjectionContainer.registerSingleton(ContainerDef.reportService, ReportService);
