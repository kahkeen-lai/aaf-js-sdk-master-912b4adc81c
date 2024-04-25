import { YouIXaafSDK } from './xaaf-sdk';
import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { ContainerDef, InjectionContainer } from '@xaaf/xaaf-js-sdk';
const httpMock = jest.mock('@xaaf/http-axios');
jest.mock('../utils/SecureAsyncStorage', () => ({
    SecureAsyncStorage: {
        setItem: jest.fn(),
        getItem: jest.fn()
    }
}));

jest.mock('../utils/DeviceInfo', () => ({
    DeviceInfo: function() {
        return {
            getSystemName: jest.fn(() => 'jest-systemName'),
            getDeviceId: jest.fn(() => 'jest-deviceId'),
            getDeviceName: jest.fn(() => 'jest-deviceName'),
            getDeviceModel: jest.fn(() => 'jest-deviceModel'),
            getDeviceManufacturer: jest.fn(() => 'jest-deviceManufacturer'),
            getSystemVersion: jest.fn(() => 'jest-systemVersion'),
            getAdvertisingId: jest.fn(() => 'jest-advertisingId'),
            getDeviceType: jest.fn(() => 'jest-deviceType')
        }
    }
}));

describe('xaaf sdk', () => {
    beforeEach(() => {
        Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.configService, Xaaf.ConfigService);
        Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsService, Xaaf.FeatureFlagsService);
        //   Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.loggerService, console);
        Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.httpService, httpMock);
    });

    it('initialization has correct properties', () => {
        const youIXaafSDK = new YouIXaafSDK();

        const xaafJsSdk = youIXaafSDK['_xaafJsSdk'];
        expect(xaafJsSdk).toBeTruthy();

        expect(xaafJsSdk['_loginService']).toBeTruthy();
        expect(xaafJsSdk['_reportService']).toBeTruthy();
        expect(xaafJsSdk['_tokenService']).toBeTruthy();
        expect(xaafJsSdk['_logger']).toBeTruthy();
        expect(xaafJsSdk['featureFlagService']).toBeTruthy();

        expect(youIXaafSDK['_sdkName']).toBe('js-sdk-youi');
        expect(youIXaafSDK['_platformName']).toBe('youi-jest-systemName');
    });

    it('initialize has correct properties', async () => {
        const youIXaafSDK = new YouIXaafSDK();
        const apiKey = 'jest-apiKey';
        const configMap = new Map([['foo', 'bar']]);

        youIXaafSDK['_setupFeatureFlagsService'] = jest.fn();
        YouIXaafSDK['getDeviceUuid'] = jest.fn(() => Promise.resolve('jest-DeviceUuid'));

        expect.assertions(4);

        // initialize is not an async function, wrapping it in one
        await new Promise<void>((resolve) => {
            youIXaafSDK['_xaafJsSdk']['initialize'] = jest.fn(() => Promise.resolve(resolve()));
            youIXaafSDK.initialize(apiKey, configMap);
        });

        expect(youIXaafSDK['_apiKey']).toBe(apiKey);
        expect(youIXaafSDK['_configMap'].get('foo')).toBe('bar');

        expect(youIXaafSDK['_setupFeatureFlagsService']).toBeCalledTimes(1);
        expect(youIXaafSDK['_xaafJsSdk']['initialize']).toBeCalledTimes(1);
    });

    it('_setupRolloutService has correct properties', async () => {
        const youIXaafSDK = new YouIXaafSDK();
        const distinctId = 'jest-distinctId';
        const configMap = new Map([['foo', 'bar']]);

        youIXaafSDK['_xaafJsSdk']['featureFlagService']['register'] = jest.fn();
        youIXaafSDK['_sdkName'] = 'jest-sdkName';
        youIXaafSDK['_sdkVersion'] = 'jest-sdkVersion';
        youIXaafSDK['_platformName'] = 'jest-platformName';

        youIXaafSDK['_setupFeatureFlagsService'](distinctId, configMap);
        expect(youIXaafSDK['_xaafJsSdk']['featureFlagService']['register']).toBeCalledWith(
            {
                distinctId,
                appName: 'jest-sdkName',
                version: 'jest-sdkVersion',
                platform: 'jest-platformName'
            },
            configMap
        );
    });

    it('_setupRolloutService with mock feature flag service', async () => {
        const youIXaafSDK = new YouIXaafSDK();
        const apiKey = 'jest-apiKey';
        const configMap = new Map([['foo', 'bar']]);
        InjectionContainer.registerInstance(ContainerDef.featureFlagsService, {
            register: jest.fn()
        });

        // initialize is not an async function, wrapping it in one
        await new Promise<void>((resolve) => {
            youIXaafSDK['_xaafJsSdk']['initialize'] = jest.fn(() => Promise.resolve(resolve()));
            youIXaafSDK.initialize(apiKey, configMap);
        });

        expect(youIXaafSDK['_xaafJsSdk']['featureFlagService'].register).toBeCalled();
    });
});
