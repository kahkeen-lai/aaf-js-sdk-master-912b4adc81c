import * as Core from '@xaaf/common';
import { XaafKeyService } from '@xaaf/key-service';
import { XaafEvent, XaafEventType, XaafInitListener, ErrorProperties, ContainerDef } from '@xaaf/common';
import { ExecutableAd } from './executable-ad/executable-ad';
import { TokenService } from './services/token-service/token-service';
import { ConfigService, FeatureFlagsService, LoginService, ReportServiceDelegate } from './services';
import { DummyExecutableAd } from './executable-ad/dummy-executable-ad';
import { ReportService } from './services/report-service/report-service';
import { ConsoleLogger, LoggerService, ProductionLogger } from './services/logger-service';
import { NewRelicLogger } from './services/logger-service/new-relic-logger';
import { UuidGenerator } from './utils/uuid-generator';
import { serializeError } from 'serialize-error';
import { OpportunityType } from './executable-ad/opportunity';

export interface OpportunityInfo {
    opportunity: OpportunityType;
    arguments: Map<string, string>;
}

export class XaafJsSdk {
    xaafInitListener: XaafInitListener;

    private get _configService(): ConfigService {
        return ConfigService.getInstance();
    }

    private get _loginService(): LoginService {
        return LoginService.getInstance();
    }

    private get _reportService(): ReportService {
        return ReportService.getInstance();
    }

    private get _tokenService(): TokenService {
        return TokenService.getInstance();
    }

    private get _logger(): LoggerService {
        return LoggerService.getInstance();
    }

    get featureFlagService(): FeatureFlagsService {
        return FeatureFlagsService.getInstance();
    }

    set persistentReportServiceDelegate(delegate: ReportServiceDelegate) {
        Core.InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, delegate);
    }

    initialize(apiKey: string, sdkArguments: Map<string, string>): void {
        (async (): Promise<void> => {
            this._setupEnvironment(apiKey, sdkArguments);
            const requestId: string = sdkArguments.get(Core.HostParams.hostRequestId) ?? UuidGenerator.generate();

            try {
                const tokenData: Core.TokenData = this._processApiKey(apiKey);
                await this._setTimeToNextEngagement(apiKey);
                if (!this._isKillSwitchEnabled()) {
                    try {
                        await this._loginService.loginAndConfigure(apiKey, tokenData, sdkArguments, requestId);
                        this._reportService.updateParamsAfterLogin();
                    } catch (error) {
                        /**
                         * error 401-2 (Kill Switch) could be received,
                         * initialize should continue as SUCCESS,
                         * TODO: treat login errors differently
                         * */
                        this._logger.error(
                            '[XaafJsSdk::initialize] Login failed: ' + JSON.stringify(serializeError(error))
                        );
                        const xaafError = ErrorProperties.get(error.errorCode);
                        if (!xaafError || xaafError.throwable) {
                            this._loginService.isFailed = true;
                            throw error;
                        } else {
                            this._loginService.isFailed = false;
                        }
                    }
                }

                this._notifyXaafListenerXaafEvent({ type: XaafEventType.SUCCESS });
            } catch (error) {
                await this._handleErrorEvent(error);
            }
        })();
    }

    getExecutableAd(opportunityInfo: OpportunityInfo): ExecutableAd {
        this.featureFlagService.fetch();
        if (this.featureFlagService.xaafEnabled && !this._isKillSwitchEnabled()) {
            this._logger.info('[XaafJsSdk::getExecutableAd] getting executable ad');
            return new ExecutableAd(opportunityInfo);
        } else {
            this._logger.info('[XaafJsSdk::getExecutableAd] getting dummy executable ad');
            return new DummyExecutableAd(this._configService, opportunityInfo);
        }
    }

    private _createLogger(logLevel: string, consoleLoggerOut: string): void {
        const extractedLogLevel: Core.LogLevel = LoggerService.extractLogLevel(logLevel);
        const loggerConstruct: Core.LoggerConstruct = {
            logLevel: extractedLogLevel,
            loggers: [
                ConsoleLogger.createConsoleLogger(consoleLoggerOut),
                ProductionLogger.createProductionLogger(
                    this.featureFlagService,
                    new NewRelicLogger(this._configService)
                )
            ]
        };
        this._logger.createLogger(loggerConstruct);
        // Todo | CR: change the way we use prefixes in logger
        this._logger.debug('[XaafJsSdk::initialize] AAF SDK Application Logger started');
    }

    private _setupEnvironment(apiKey: string, sdkArguments: Map<string, string>): void {
        this._createLogger(sdkArguments.get(Core.HostParams.loggerLevel), sdkArguments.get('consoleLogger'));
        this._configService.update({ apiKey, sdkArguments });
        this._reportService.init();
    }

    private async _setTimeToNextEngagement(currentApiKey: string): Promise<void> {
        const persistentLoginItem: Core.KillSwitchStoredData = await this._loginService.getPersistentLoginItem(
            Core.KILL_SWITCH_PERSISTENT_STORAGE_KEY
        );
        const isSameEnvironment = persistentLoginItem?.apiKey === currentApiKey;
        if (persistentLoginItem?.timeToNextEngagement && isSameEnvironment) {
            this._configService.timeToNextEngagement = persistentLoginItem?.timeToNextEngagement;
        }
    }

    private _assertApiKeyValid(keyService: Core.KeyService, apiKey: string, environment: string): void {
        const isApiKeyValid: boolean = keyService.verify(apiKey, environment);
        if (!isApiKeyValid) {
            this._logger.error('[XaafJsSdk::initialize] Failed to initialize sdk as a result of invalid API key');
            throw Core.ErrorUtils.sdkError(Core.ErrorCode.KeyError, '', Core.ErrorSubDomain.Auth, 'sdk::initialize');
        }
    }

    private _processApiKey(apiKey: string): Core.TokenData {
        this._logger.debug('[XaafJsSdk::initialize] Decode and Verify API key');
        const keyService: Core.KeyService = new XaafKeyService();
        const tokenData: Core.TokenData = keyService.decode<Core.TokenData>(apiKey);
        this._configService.update({ tokenData });
        this._assertApiKeyValid(keyService, apiKey, tokenData?.environment);
        return tokenData;
    }

    private async _handleErrorEvent(error: Error | Core.XaafError): Promise<void> {
        this._logger.error('[XaafJsSdk::initialize] Failed to initialize sdk: ' + serializeError(error));

        const xaafError: Core.XaafError = Core.ErrorUtils.sdkError(
            error['errorCode'] ?? Core.ErrorCode.General,
            `${error.name ?? 'failed to initialize'}: ${error.message}`,
            Core.ErrorSubDomain.Auth,
            error['errorEndPoint'] ?? 'sdk::initialize'
        );
        xaafError.name = error.name;

        this._reportService.reportError(xaafError);
        this._notifyXaafListenerXaafEvent({ error: xaafError, type: XaafEventType.FAILURE });
    }

    private _notifyXaafListenerXaafEvent(xaafEvent: XaafEvent): void {
        this.xaafInitListener && this.xaafInitListener(xaafEvent);
    }

    private _isKillSwitchEnabled(): boolean {
        const timeToNextEngagement = this._configService.timeToNextEngagement;
        this._logger.info(`[XaafJsSdk::isKillSwitchEnabled] timeToNextEngagement: ${timeToNextEngagement}`);

        return timeToNextEngagement && timeToNextEngagement > new Date().getTime();
    }
}
