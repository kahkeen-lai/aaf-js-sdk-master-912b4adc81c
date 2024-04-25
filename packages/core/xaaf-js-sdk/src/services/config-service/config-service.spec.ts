/* eslint-disable @typescript-eslint/no-var-requires */
import { resetMockedResponseWithIntervals } from '../../mock/mock';
import { ConfigService, AppConfig } from './config-service';
import { LoginResponse } from '@xaaf/common';

let loginNrUrl;
let loginNrApiKey;
let appConfig: AppConfig;
beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const login: LoginResponse = require('../../mock/expectations/Login-200.json');
    loginNrUrl = login.configuration.nr_url;
    loginNrApiKey = login.configuration.nr_rest_api_key;
    appConfig = {
        apiKey: login.token,
        sdkArguments: new Map([
            ['platform', 'dfw'],
            ['userAdvrId', '01234'],
            ['fwSUSSId', '12345'],
            ['householdId', '23456'],
            ['deviceAdvrId', '34567'],
            ['deviceFWAdId', '45678'],
            ['deviceUUID', '56789'],
            ['deviceManufacturer', 'testDeviceManufacturer'],
            ['deviceModel', 'testDeviceModel'],
            ['deviceType', 'tvos1'],
            ['device', 'deviceTest'],
            ['osName', 'testOsName'],
            ['osVersion', 'testOsVersion'],
            ['userType', 'testType'],
            ['tenantName', 'testTenantName'],
            ['appName', 'testAppName'],
            ['appVersion', 'testAppVersion'],
            ['sdkName', 'testSdkName'],
            ['sdkVersion', 'testSdkVersion'],
            ['platformName', 'testPlatformName'],
            ['tenantSystemName', 'testTenantSystemName']
        ]),

        loginRes: login,
        tokenData: {
            tenantId: 'tenantId',
            tenantName: 'tenantName',
            appId: 'appId',
            platformName: 'platformName',
            sdkVersion: 'sdkVersion',
            sdkName: 'sdkName',
            enabled: true,
            host: 'https://xaaf-be-lal.att.com',
            privilegeType: 'privilegeType',
            environment: 'environment',
            apiKeyIat: 0,
            iat: 0,
            exp: 0,
            iss: 'iss',
            sub: 'sub'
        }
    };
    const configService = ConfigService.getInstance();
    configService.update(appConfig);
    resetMockedResponseWithIntervals();
});

describe('config service functions', () => {
    test('get instance is not null', async () => {
        const configService = ConfigService.getInstance();
        expect(configService).toBeDefined();
    });

    describe('config service getMeasurementParams', () => {
        test('getMeasurementParams with platformAdvId param should return platformAdvId', async () => {
            expect(ConfigService.getInstance().getMeasurementParams('platformAdvId')).toEqual(
                ConfigService.getInstance().platformAdvId
            );
        });
        test('getMeasurementParams with Invalid key param should return null', async () => {
            expect(ConfigService.getInstance().getMeasurementParams('Invalid')).toBeUndefined();
        });
        test('getMeasurementParams with clientFormattedTimeStamp param validate 22.03.2020 14:05:38 +120 date format', async () => {
            const spy = jest.spyOn(global.Date, 'now').mockImplementation(() => 1584878738817);
            expect(ConfigService.getInstance().getMeasurementParams('clientFormattedTimeStamp').startsWith("2203202020")).toBeTruthy;
            expect(ConfigService.getInstance().getMeasurementParams('clientFormattedTimeStamp')).toContain(
                '0538'
            );
            spy.mockRestore();
        });
        test('getMeasurementParams with deviceId param should return deviceId', async () => {
            expect(ConfigService.getInstance().getMeasurementParams('deviceId')).toEqual(
                ConfigService.getInstance().deviceAdId
            );
        });
        test('getMeasurementParams get parameter from sdk config without getter', async () => {
            expect(ConfigService.getInstance().getMeasurementParams('platform')).toEqual('dfw');
        });
        test('get new relic url parameter', async () => {
            expect(ConfigService.getInstance().newrelicUrl).toEqual(loginNrUrl);
        });
        test('get new relic api key parameter', async () => {
            expect(ConfigService.getInstance().nrApiKey).toEqual(loginNrApiKey);
        });
        test('get userAdvrId parameter', async () => {
            expect(ConfigService.getInstance().userAdvrId).toEqual('01234');
        });
        test('get fwSUSSId parameter', async () => {
            expect(ConfigService.getInstance().fwSUSSId).toEqual('12345');
        });
        test('get householdId parameter', async () => {
            expect(ConfigService.getInstance().householdId).toEqual('23456');
        });
        test('get deviceAdvrId parameter', async () => {
            expect(ConfigService.getInstance().deviceAdvrId).toEqual('34567');
        });
        test('get deviceFWAdId parameter', async () => {
            expect(ConfigService.getInstance().deviceFWAdId).toEqual('45678');
        });
        test('get DeviceID parameter', async () => {
            expect(ConfigService.getInstance().DeviceID).toEqual('56789');
        });
        test('get isLoggedIn parameter', async () => {
            expect(ConfigService.getInstance().isLoggedIn).toEqual(true);
        });
        test('get playerConfiguration parameter', async () => {
            expect(ConfigService.getInstance().playerConfiguration.minBuffer).toBeDefined();
            expect(ConfigService.getInstance().playerConfiguration.maxBuffer).toBeDefined();
        });
        test('get refreshToken parameter', async () => {
            expect(ConfigService.getInstance().refreshToken).toBeDefined();
        });
        test('get tokenExpiration parameter', async () => {
            expect(ConfigService.getInstance().tokenExpiration).toBeDefined();
        });
        test('get refreshToken expiration parameter', async () => {
            expect(ConfigService.getInstance().refreshTokenExpiration).toBeDefined();
        });
        test('get deviceManufacturer parameter', async () => {
            expect(ConfigService.getInstance().deviceManufacturer).toEqual('testDeviceManufacturer');
        });
        test('get deviceModel parameter', async () => {
            expect(ConfigService.getInstance().deviceModel).toEqual('testDeviceModel');
        });
        test('get deviceType parameter', async () => {
            expect(ConfigService.getInstance().deviceType).toEqual('tvos1');
        });
        test('get device parameter', async () => {
            expect(ConfigService.getInstance().device).toEqual('deviceTest');
        });
        test('get OsName', async () => {
            expect(ConfigService.getInstance().osName).toEqual('testOsName');
        });
        test('get osVersion', async () => {
            expect(ConfigService.getInstance().osVersion).toEqual('testOsVersion');
        });
        test('get userType', async () => {
            expect(ConfigService.getInstance().userType).toEqual('testType');
        });
        test('get tenantName', async () => {
            expect(ConfigService.getInstance().tenantName).toEqual('testTenantName');
        });
        test('get appName', async () => {
            expect(ConfigService.getInstance().appName).toEqual('testAppName');
        });
        test('get appVersion', async () => {
            expect(ConfigService.getInstance().appVersion).toEqual('testAppVersion');
        });
        test('get sdkName', async () => {
            expect(ConfigService.getInstance().sdkName).toEqual('testSdkName');
        });
        test('get sdkVersion', async () => {
            expect(ConfigService.getInstance().sdkVersion).toEqual('testSdkVersion');
        });
        test('get tenantSystemName', async () => {
            expect(ConfigService.getInstance().tenantSystemName).toEqual('testTenantSystemName');
        });
        test('get lazyRefreshTokenBeforeExpirationMinutes parameter', async () => {
            expect(ConfigService.getInstance().lazyRefreshTokenBeforeExpirationMinutes).toBeDefined();
        });
        test('get timeouts parameter http', async () => {
            expect(ConfigService.getInstance().timeouts.http).toBeDefined();
        });
        test('get timeouts parameter xaaba', async () => {
            expect(ConfigService.getInstance().timeouts.xaaba).toBeDefined();
        });
        test('get timeouts parameter assets', async () => {
            expect(ConfigService.getInstance().timeouts.assets).toBeDefined();
        });
        test('get timeouts parameter player', async () => {
            expect(ConfigService.getInstance().timeouts.player).toBeDefined();
        });
        test('get timeouts parameter buffer', async () => {
            expect(ConfigService.getInstance().timeouts.buffer).toBeDefined();
        });
        test('get timeouts parameter reporting', async () => {
            expect(ConfigService.getInstance().timeouts.reporting).toBeDefined();
        });
        test('get timeouts parameter http_timeout', async () => {
            appConfig.loginRes.configuration.http_timeout = 1;
            const configService = ConfigService.getInstance();
            configService.update(appConfig);
            expect(ConfigService.getInstance().timeouts.http).toEqual(1);
        });
        test('get timeouts parameter buffer_timeout', async () => {
            appConfig.loginRes.configuration.buffer_timeout = 1;
            const configService = ConfigService.getInstance();
            configService.update(appConfig);
            expect(ConfigService.getInstance().timeouts.buffer).toEqual(1);
        });
        test('get timeouts parameter player_timeout', async () => {
            appConfig.loginRes.configuration.player_timeout = 1;
            const configService = ConfigService.getInstance();
            configService.update(appConfig);
            expect(ConfigService.getInstance().timeouts.player).toEqual(1);
        });
        test('get new relic bulk reporting config', async () => {
            const configService = ConfigService.getInstance();
            configService.update(appConfig);
            expect(ConfigService.getInstance().bulkConfiguration.reportingBulk).toEqual(100);
            expect(ConfigService.getInstance().bulkConfiguration.reportingBulkDelay).toEqual(180000);
        });
        test('get new relic bulk reporting config when no login response', async () => {
            appConfig.loginRes.configuration.reporting_bulk = undefined;
            appConfig.loginRes.configuration.reporting_bulk_delay = undefined;
            const configService = ConfigService.getInstance();
            configService.update({});
            expect(ConfigService.getInstance().bulkConfiguration.reportingBulk).toEqual(50);
            expect(ConfigService.getInstance().bulkConfiguration.reportingBulkDelay).toEqual(180000);
        });
        test('get timeouts parameter xaaba_timeoutba', async () => {
            appConfig.loginRes.configuration.xaaba_timeout = 1;
            const configService = ConfigService.getInstance();
            configService.update(appConfig);
            expect(ConfigService.getInstance().timeouts.xaaba).toEqual(1);
        });
        test('get timeouts parameter assets_timeout', async () => {
            appConfig.loginRes.configuration.assets_timeout = 1;
            const configService = ConfigService.getInstance();
            configService.update(appConfig);
            expect(ConfigService.getInstance().timeouts.assets).toEqual(1);
        });

        test('get timeouts parameter reporting_timeout', async () => {
            appConfig.loginRes.configuration.reporting_timeout = 1;
            const configService = ConfigService.getInstance();
            configService.update(appConfig);
            expect(ConfigService.getInstance().timeouts.reporting).toEqual(1);
        });
    });
});
