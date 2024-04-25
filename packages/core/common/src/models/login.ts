import { ConfigResponse } from './config';
import { FeatureFlagsRequest } from '../internals/feature-flags-service';

export interface RefreshResponse {
    token: string;
    configuration: ConfigResponse;
    nonce?: string;
}

export interface LoginResponse extends RefreshResponse {
    refreshToken: string;
}

export interface LoginStoredData {
    persistentApiKey: string;
    persistentLoginRes: LoginResponse;
}

export interface KillSwitchStoredData {
    apiKey: string;
    timeToNextEngagement: number;
}

export const LOGIN_PERSISTENT_STORAGE_KEY = 'LOGIN_PERSISTENT_STORAGE_KEY';
export const KILL_SWITCH_PERSISTENT_STORAGE_KEY = 'KILL_SWITCH_PERSISTENT_STORAGE_KEY';

export interface RequestBody extends FeatureFlagsRequest {
    [HostParams.appMode]?: string;
    [HostParams.appName]?: string;
    [HostParams.appVersion]?: string;
    [HostParams.consoleLogger]?: string;
    [HostParams.device]?: string;
    [HostParams.deviceAdId]?: string;
    [HostParams.deviceAdvrId]?: string;
    [HostParams.deviceFWAdId]?: string;
    [HostParams.deviceId]?: string;
    [HostParams.deviceManufacturer]?: string;
    [HostParams.deviceModel]?: string;
    [HostParams.deviceType]?: string;
    [HostParams.deviceUUID]?: string;
    [HostParams.fwSUSSId]?: string;
    [HostParams.hostRequestId]?: string;
    [HostParams.householdId]?: string;
    [HostParams.loggerLevel]?: string;
    [HostParams.osName]?: string;
    [HostParams.osVersion]?: string;
    [HostParams.platform]?: string;
    [HostParams.platformAdvId]?: string;
    [HostParams.platformName]?: string;
    [HostParams.sdkName]?: string;
    [HostParams.sdkVersion]?: string;
    [HostParams.tenantName]?: string;
    [HostParams.tenantSystemName]?: string;
    [HostParams.userAdvrId]?: string;
    [HostParams.userType]?: string;
    [HostParams.xaafAdvId]?: string;
}

export enum HostParams {
    appMode = 'appMode',
    appName = 'appName',
    appVersion = 'appVersion',
    consoleLogger = 'consoleLogger',
    device = 'device',
    deviceAdId = 'deviceAdId',
    deviceAdvrId = 'deviceAdvrId',
    deviceFWAdId = 'deviceFWAdId',
    deviceId = 'deviceId',
    deviceManufacturer = 'deviceManufacturer',
    deviceModel = 'deviceModel',
    deviceType = 'deviceType',
    deviceUUID = 'deviceUUID',
    fwSUSSId = 'fwSUSSId',
    hostRequestId = 'hostRequestId',
    householdId = 'householdId',
    loggerLevel = 'loggerLevel',
    osName = 'osName',
    osVersion = 'osVersion',
    platform = 'platform',
    platformAdvId = 'platformAdvId',
    platformName = 'platformName',
    sdkName = 'sdkName',
    sdkVersion = 'sdkVersion',
    tenantName = 'tenantName',
    tenantSystemName = 'tenantSystemName',
    userAdvrId = 'userAdvrId',
    userType = 'userType',
    xaafAdvId = 'xaafAdvId',
    deviceGroup = 'deviceGroup',
    externalIP = 'externalIP',
    internalIP = 'internalIP',
    memUsageMb = 'memUsageMb',
    ignoreOpportunities = 'ignoreOpportunities',
    context = 'context',
    opportunityType = 'opportunityType'
}
