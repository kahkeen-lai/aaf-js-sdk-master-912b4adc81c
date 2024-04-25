import { setInterceptor } from '../interceptors/http-interceptor';
import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { XaafHttpService } from '@xaaf/http-axios';
import { InMemoryReportService } from '../services';
import { DeviceInfo } from '../utils';
import SecureAsyncStorage from '../utils/SecureAsyncStorage';

Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.httpService, XaafHttpService);
// set interceptor for all you.i calls to add userAgent
setInterceptor();
Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.storageService, SecureAsyncStorage);
export class YouIXaafSDK {
    private static _deviceUuidKeyName: string = 'att.aaf.deviceUUID';
    private static _sdkInstance: YouIXaafSDK;

    private _apiKey: string;
    private _configMap: Map<string, string>;
    private _sdkName: string = 'js-sdk-youi';
    private _sdkVersion: string = '__HOST_PACKAGE_VERSION__';
    private _platformName: string = `youi-${DeviceInfo().getSystemName()}`;
    private _xaafJsSdk: Xaaf.XaafJsSdk;

    constructor() {
        this._xaafJsSdk = new Xaaf.XaafJsSdk();
        this._xaafJsSdk.persistentReportServiceDelegate = InMemoryReportService.getInstance();
    }

    static getInstance(): YouIXaafSDK {
        if (!YouIXaafSDK._sdkInstance) {
            YouIXaafSDK._sdkInstance = new YouIXaafSDK();
        }
        return YouIXaafSDK._sdkInstance;
    }

    private static async _createAndStoreDeviceUuid(): Promise<string> {
        const _loggerService = Xaaf.LoggerService.getInstance();
        const newGeneratedUuid = Xaaf.UuidGenerator.generate();
        try {
            await SecureAsyncStorage.setItem(this._deviceUuidKeyName, newGeneratedUuid);
            _loggerService.info(newGeneratedUuid);
        } catch (error) {
            _loggerService.error('Failed to store generated uuid with error: ' + error);
        }
        return newGeneratedUuid;
    }

    private static async _getDeviceUuid(): Promise<string> {
        const _loggerService = Xaaf.LoggerService.getInstance();
        let deviceUUID: string = '';
        try {
            deviceUUID = await SecureAsyncStorage.getItem(this._deviceUuidKeyName);
            if (deviceUUID) {
                return deviceUUID;
            }
        } catch (error) {
            _loggerService.error(`error from storage ${error}`);
        }
        return YouIXaafSDK._createAndStoreDeviceUuid();
    }

    get xaafSdkVersion(): string {
        return this._sdkVersion;
    }

    set xaafInitListener(xaafInitListener: Xaaf.XaafInitListener) {
        this._xaafJsSdk.xaafInitListener = xaafInitListener;
    }

    initialize(apiKey: string, hostConfig: Map<string, string>): void {
        (async () => {
            const _loggerService = Xaaf.LoggerService.getInstance();
            this._apiKey = apiKey;
            const {
                getDeviceName,
                getDeviceManufacturer,
                getDeviceId,
                getDeviceModel,
                getSystemName,
                getSystemVersion
            } = DeviceInfo();
            try {
                const deviceName = await getDeviceName();
                _loggerService.info(deviceName);
                const deviceManufacturer = await getDeviceManufacturer();
                this._configMap = new Map<string, string>([
                    ...hostConfig,
                    [Xaaf.HostParams.sdkName, this._sdkName],
                    [Xaaf.HostParams.deviceId, getDeviceId()],
                    [Xaaf.HostParams.device, deviceName],
                    [Xaaf.HostParams.deviceModel, getDeviceModel()],
                    [Xaaf.HostParams.deviceManufacturer, deviceManufacturer],
                    [Xaaf.HostParams.osName, getSystemName()],
                    [Xaaf.HostParams.osVersion, getSystemVersion()],
                    [Xaaf.HostParams.platformName, this._platformName],
                    [Xaaf.HostParams.sdkVersion, this._trimPrereleaseTag(this._sdkVersion)],
                    // TODO: fix hardcoded values
                    [Xaaf.HostParams.xaafAdvId, '1234567'],
                    [Xaaf.HostParams.tenantSystemName, 'directv']
                ]);

                let deviceUUID: string;

                // TODO: add platformAdvId
                this._configMap.set('platformAdvId', 'NA');

                try {
                    deviceUUID = await YouIXaafSDK._getDeviceUuid();
                    this._configMap.set('deviceUUID', deviceUUID);
                } catch (error) {
                    _loggerService.error('[YouIXaafSDK::initialize] _getDeviceUuid error' + error);
                }

                try {
                    this._setupFeatureFlagsService(deviceUUID, this._configMap);
                } catch (error) {
                    _loggerService.error('[YouIXaafSDK::initialize] _setupFeatureFlagsService error- ' + error);
                }

                this._xaafJsSdk.initialize(this._apiKey, this._configMap);
                console.log('[YouIXaafSDK::initialize]success- ' + JSON.stringify([...this._configMap.entries()]));
            } catch (error) {
                _loggerService.error('[YouIXaafSDK::initialize] error- ' + error);
            }
        })();
    }

    getExecutableAd(opportunityInfo: Xaaf.OpportunityInfo): Xaaf.ExecutableAd {
        // TODO: handle error e.g. not initialized, undefined etc. | Israel
        return this._xaafJsSdk.getExecutableAd(opportunityInfo);
    }

    private _setupFeatureFlagsService(distinctId: string, hostConfig: Map<string, string>): void {
        Xaaf.InjectionContainer.registerSingleton(
            Xaaf.ContainerDef.featureFlagsDelegate,
            Xaaf.FeatureFlagsProxyDelegate
        );
        this._xaafJsSdk.featureFlagService.register(
            {
                distinctId,
                appName: this._sdkName,
                version: this._sdkVersion,
                platform: this._platformName
            },
            hostConfig
        );
    }

    /**
     * To remove the .0 suffix from the sdk version after alpha/beta
     * Why? Because existing API expects the version to be in the format of x.y.z-alpha/beta
     *
     * @returns {string} - the sdk version without the .0 suffix after alpha/beta
     */
    private _trimPrereleaseTag(version: string): string {
        // If it has prerelease tag
        if (version.includes('-')) {
            // Split the version by the prerelease tag
            const versionParts = version.split('-');
            // If the version has .0 suffix
            if (versionParts[1].endsWith('.0')) {
                // Remove the .0 suffix
                versionParts[1] = versionParts[1].replace('.0', '');
            }
            // Join the version parts back together
            return versionParts.join('-');
        }

        return version;
    }
}
