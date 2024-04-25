import { HostParams } from './login';

export interface CommonSDKMetricsParams {
    [HostParams.appName]: string;
    [HostParams.appVersion]: string;
    [HostParams.device]: string;
    [HostParams.deviceGroup]: string;
    [HostParams.deviceManufacturer]: string;
    [HostParams.deviceModel]: string;
    [HostParams.deviceType]: string;
    [HostParams.deviceUUID]: string;
    [HostParams.externalIP]: string;
    [HostParams.internalIP]: string;
    [HostParams.osName]: string;
    [HostParams.osVersion]: string;
    [HostParams.platform]: string;
    [HostParams.platformAdvId]: string;
    [HostParams.platformName]: string;
    [HostParams.sdkName]: string;
    [HostParams.sdkVersion]: string;
    [HostParams.tenantName]: string;
    [HostParams.userType]: string;
    [HostParams.memUsageMb]: string;
    [HostParams.appMode]: string;
}

export type ContentType = 'live' | 'vod' | 'rtvod' | 'recorded';

export type ExpType = 'out_of_stream' | 'in_stream';

export enum InitAdParams {
    platform = 'platform', // Platform type (e.g. dfw)
    contentType = 'contentType', // The type of the playing asset (vod, live, recorded, rtvod)
    deviceType = 'deviceType', // The type of the device (e.g. firetv/tvos/roku/osprey)
    deviceAdId = 'deviceAdId', // Device advertising ID
    userAdvrId = 'userAdvrId', // Partner profile ID
    fwSUSSId = 'fwSUSSId', // Same as "userAdvrId"
    householdid = 'householdid', // Same as "userAdvrId"
    deviceAdvrId = 'deviceAdvrId', // Device advertising ID
    userType = 'userType', // 2
    deviceFWAdId = 'deviceFWAdId', // Nielsen - device ad id
    networkName = 'networkName', // The name of the network (e.g. abc)
    channelId = 'channelId', // CCID
    channelName = 'channelName', // The name of the channel (e.g. ESPN) if available
    programName = 'programName', // The name of the program (e.g. game_of_thrones)
    programmerName = 'programmerName', // The name of the programmer (e.g. Disney)
    tenantName = 'tenantName', // directv
    isDuringAd = 'isDuringAd', // true/false
    appName = 'appName', // ov/wtv/dtv
    appVersion = 'appVersion', // e.g. 1.0.103
    expType = 'expType', // out_of_stream / in_stream
    context = 'context', // pause
    adStartDelayHint = 'adStartDelayHint', // Expected delay time form ad_init to ad_start trigger, in milliseconds
    hostCCPAEnabled = 'hostCCPAEnabled' // Host decide regarding CCPA. true/false
}

export interface AdSessionMetricsParams {
    [InitAdParams.adStartDelayHint]: number; // Should be provided in ms.
    [InitAdParams.channelId]: string;
    [InitAdParams.channelName]: string;
    [InitAdParams.contentType]: ContentType;
    [InitAdParams.context]: string;
    [InitAdParams.expType]: ExpType;
    [InitAdParams.isDuringAd]: boolean;
    [InitAdParams.networkName]: string;
    [InitAdParams.programName]: string;
    [InitAdParams.programmerName]: string;
}

export enum ReportType {
    Login = 'LOGIN',
    Refresh = 'REFRESH',
    Error = 'ERROR',
    AdCreated = 'AD_CREATED',
    AdInit = 'AD_INIT',
    AdLoaded = 'AD_LOADED',
    AdStarting = 'AD_STARTING',
    AdStarted = 'AD_STARTED',
    AdPlaying = 'AD_PLAYING',
    AdPausing = 'AD_PAUSING',
    AdPaused = 'AD_PAUSED',
    AdResuming = 'AD_RESUMING',
    AdResumed = 'AD_RESUMED',
    AdInteraction = 'AD_INTERACTION',
    AdStopping = 'AD_STOPPING',
    AdStopped = 'AD_STOPPED',
    AdError = 'AD_ERROR',
    AdTerminated = 'AD_TERMINATED',
    AdInfo = 'AD_INFO',
    HostAdCreate = 'HOST_AD_CREATE',
    HostAdInit = 'HOST_AD_INIT',
    HostAdStart = 'HOST_AD_START',
    HostAdStop = 'HOST_AD_STOP'
}

export enum TimeSinceEvent {
    AdCreated = 'timeSinceAdCreatedEvent',
    LastLifeCycleEvent = 'timeSinceLastLifeCycleEvent',
    AdStart = 'timeSinceStart',
    AdStarted = 'timeSinceStarted',
    HostAdCreated = 'HOST_AD_CREATE',
    HostAdInit = 'HOST_AD_INIT',
    HostAdStarted = 'HOST_AD_START',
    HostAdStop = 'HOST_AD_STOP'
}

export enum ReportLoginMode {
    PreAuth = 'PRE_AUTH', // Client performs refresh token request before token expires
    ErrorDriven = 'ERROR_DRIVEN' // Client performs refresh token request post authorization error (when token expires)
}

export enum ReportDefaultValue {
    NA = 'NA',
    NP = 'NP',
    NPS = 'NPS'
}

export interface Reporter {
    report: (reportType: ReportType, properties?: Record<string, string | number | boolean>) => Promise<void>;
}

export interface LifeCycleEvent {
    reportEvent: Record<string, unknown>;
    eventTime: number;
}

export enum AdInfoType {
    Buffer = 'buffer'
}

export interface LoginProperties {
    loginRequestId: string;
    isSilent: boolean;
    success: boolean;
    mode: ReportLoginMode;
}
