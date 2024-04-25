import * as Core from '@xaaf/common';
import { HostParams } from '@xaaf/common';
import { DateHelper } from '../../utils/date-helper';

export interface AppConfig {
    apiKey?: string;
    sdkArguments?: Map<string, string>; // TODO: change type to Map<HostParams, string> (trivial, but big PR)
    tokenData?: Core.TokenData;
    loginRes?: Core.LoginResponse;
}

export enum ApiVersion {
    v1 = 'v1',
    v2 = 'v2'
}

export class ConfigService implements Core.ConfigServiceContract {
    private _config: AppConfig = {};
    private _playerStartTime: Date;
    private _playerStopTime: Date;
    private _apiVersion: string = ApiVersion.v1;
    private _timeToNextEngagement: number;
    static getInstance(): ConfigService {
        return Core.InjectionContainer.resolve<ConfigService>(Core.ContainerDef.configService);
    }

    update(config: Partial<AppConfig>): void {
        this._config = {
            ...this._config,
            ...config
        };
    }

    get sdkArguments(): Map<string, string> {
        return this._config.sdkArguments;
    }

    get apiKey(): string {
        return this._config.apiKey;
    }

    get tokenData(): Core.TokenData {
        return this._config?.tokenData;
    }

    /** api version */
    get apiVersion(): string {
        /**
         * if using feature flags proxy solution, v2 is required.
         * */
        let requiredApiVersion = this._apiVersion;
        try {
            const featureFlagsDelegate = Core.InjectionContainer.resolve<Core.FeatureFlagsDelegate>(
                Core.ContainerDef.featureFlagsDelegate
            );
            if (featureFlagsDelegate?.usesRelayProxy) {
                requiredApiVersion = ApiVersion.v2;
            }
        } catch (error) {
            // do nothing
        }
        return requiredApiVersion ?? ApiVersion.v1;
    }

    set apiVersion(version: string) {
        this._apiVersion = version ?? ApiVersion.v1;
    }

    /** urls */
    get loginUrl(): string {
        return `${this.tokenData?.host}/auth/${this.apiVersion}/login`;
    }

    get refreshTokenUrl(): string {
        return `${this.tokenData?.host}/auth/${this.apiVersion}/token/refresh`;
    }

    get opportunityUrl(): string {
        return this._config.loginRes?.configuration?.xaaba_url;
    }

    get accountingUrl(): string {
        return this._config.loginRes?.configuration?.featureFlags?.accountingUrl;
    }

    /** new relic */
    get newrelicUrl(): string {
        return this._config.loginRes?.configuration?.nr_url;
    }

    get nrApiKey(): string {
        return this._config.loginRes?.configuration?.nr_rest_api_key;
    }

    /** configuration */
    get playerConfiguration(): Core.PlayerConfiguration {
        return this._config.loginRes?.configuration?.playerConfiguration;
    }

    get contentToggleList(): Core.ContentToggleItem[] {
        return this._config.loginRes?.configuration?.content_toggle_list;
    }

    /** state */
    get isLoggedIn(): boolean {
        return !!this._config.loginRes;
    }

    /** authorization */
    get token(): string {
        return this._config?.loginRes?.token;
    }

    get refreshToken(): string {
        return this._config.loginRes?.refreshToken;
    }

    get tokenExpiration(): string {
        return this._config.loginRes?.configuration?.access_token?.expiration;
    }

    get refreshTokenExpiration(): string {
        return this._config.loginRes?.configuration?.refresh_token?.expiration;
    }

    get lazyRefreshTokenBeforeExpirationMinutes(): number {
        return this._config.loginRes?.configuration?.lazy_refresh_token_before_expiration_minutes || 5;
    }

    /** authentication */
    get DeviceID(): string {
        return this._config.sdkArguments.get(HostParams.deviceUUID);
    }

    get deviceType(): string {
        return this._config.sdkArguments.get(HostParams.deviceType);
    }

    get device(): string {
        return this._config.sdkArguments.get(HostParams.device);
    }

    get deviceModel(): string {
        return this._config.sdkArguments.get(HostParams.deviceModel);
    }

    get deviceManufacturer(): string {
        return this._config.sdkArguments.get(HostParams.deviceManufacturer);
    }

    get osName(): string {
        return this._config.sdkArguments.get(HostParams.osName);
    }

    get osVersion(): string {
        return this._config.sdkArguments.get(HostParams.osVersion);
    }

    get deviceAdId(): string {
        return this._config.sdkArguments.get(HostParams.deviceAdId);
    }

    get userAdvrId(): string {
        return this._config.sdkArguments.get(HostParams.userAdvrId);
    }

    get fwSUSSId(): string {
        return this._config.sdkArguments.get(HostParams.fwSUSSId);
    }

    get householdId(): string {
        return this._config.sdkArguments.get(HostParams.householdId);
    }

    get deviceAdvrId(): string {
        return this._config.sdkArguments.get(HostParams.deviceAdvrId);
    }

    get userType(): string {
        return this._config.sdkArguments.get(HostParams.userType);
    }

    get deviceFWAdId(): string {
        return this._config.sdkArguments.get(HostParams.deviceFWAdId);
    }

    get tenantName(): string {
        return this._config.sdkArguments.get(HostParams.tenantName);
    }

    get appName(): string {
        return this._config.sdkArguments.get(HostParams.appName);
    }

    get appVersion(): string {
        return this._config.sdkArguments.get(HostParams.appVersion);
    }

    get platform(): string {
        return this._config.sdkArguments.get(HostParams.platform);
    }

    get sdkName(): string {
        return this._config.sdkArguments.get(HostParams.sdkName);
    }

    get sdkVersion(): string {
        return this._config.sdkArguments.get(HostParams.sdkVersion);
    }

    get platformName(): string {
        return this._config.sdkArguments.get(HostParams.platformName);
    }

    get tenantSystemName(): string {
        return this._config.sdkArguments.get(HostParams.tenantSystemName);
    }

    get deviceUUID(): string {
        return this._config.sdkArguments.get(HostParams.deviceUUID);
    }

    get platformAdvId(): string {
        return this._config.sdkArguments.get(HostParams.platformAdvId);
    }

    get appMode(): string {
        return this._config.sdkArguments.get(HostParams.appMode);
    }

    get ignoreOpportunities(): string {
        return this._config.sdkArguments.get(HostParams.ignoreOpportunities);
    }

    getMeasurementParams(paramType: string): string {
        switch (paramType) {
            case 'clientFormattedTimeStamp':
                return DateHelper.clientTime();
            case 'deviceId':
                return this.deviceAdId;
            case 'timeFromStarted':
                return DateHelper.calcDuration(this.playerStartTime, this.playerStopTime);
            default:
                return this._config.sdkArguments.get(paramType);
        }
    }

    get bulkConfiguration(): Core.BulkConfiguration {
        const configuration = this._config.loginRes?.configuration;
        return {
            reportingBulk: configuration?.reporting_bulk ?? 50,
            reportingBulkDelay: configuration?.reporting_bulk_delay ?? 180000
        };
    }

    get timeouts(): Core.AppTimeouts {
        const configuration = this._config.loginRes?.configuration;
        return {
            http: configuration?.http_timeout ?? 3000,
            xaaba: configuration?.xaaba_timeout ?? 3000,
            assets: configuration?.assets_timeout ?? 3000,
            player: configuration?.player_timeout ?? 3000,
            buffer: configuration?.buffer_timeout ?? 3000,
            reporting: configuration?.reporting_timeout ?? 3000
        };
    }

    get preAdStartXaabaEngageTime(): number {
        const defaultEngageTime = 5000;
        return this._config.loginRes?.configuration?.pre_ad_start_xaaba_engage_time ?? defaultEngageTime;
    }

    get playerStartTime(): Date {
        return this._playerStartTime;
    }

    set playerStartTime(startTime: Date) {
        this._playerStartTime = startTime;
    }

    get playerStopTime(): Date {
        return this._playerStopTime;
    }

    set playerStopTime(stopTime: Date) {
        this._playerStopTime = stopTime;
    }

    get timeToNextEngagement(): number {
        return this._timeToNextEngagement;
    }

    set timeToNextEngagement(timeToNextEngagement: number) {
        this._timeToNextEngagement = timeToNextEngagement;
    }


    setContentToggleList(contentToggleList:Core.ContentToggleItem) {
        // @ts-ignore
        this._config.loginRes?.configuration?.content_toggle_list = contentToggleList;
    }
}
Core.InjectionContainer.registerSingleton(Core.ContainerDef.configService, ConfigService);
