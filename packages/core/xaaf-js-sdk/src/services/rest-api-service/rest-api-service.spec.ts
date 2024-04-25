/* eslint-disable @typescript-eslint/no-unused-vars */
import { resetMockedResponseWithIntervals, resetMocks } from '../../mock/mock';
import { RestApiService } from './rest-api-service';
import { ApiVersion, AppConfig, ConfigService } from '..';
import * as Core from '@xaaf/common';
import { XaafJsSdk } from '../../xaaf-js-sdk';
import { HttpService } from '@xaaf/common';

describe('rest api service tests', () => {
    let _args;
    let _apiKey;
    let _tokenData;
    const restApiService = RestApiService.getInstance();
    beforeEach(() => {
        resetMocks();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const login: Core.LoginResponse = require('../../mock/expectations/Login-200.json');
        const appConfig: AppConfig = {
            apiKey: login.token,
            sdkArguments: new Map([['foo', 'bar']]),
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

    it('checks request body params on login', async () => {
        const _httpService: Core.HttpService = Core.InjectionContainer.resolve<Core.HttpService>(
            Core.ContainerDef.httpService
        );

        expect.assertions(4);
        const postFn = _httpService.post;

        _httpService.post = jest.fn((url) => {
            expect(url).toBe(ConfigService.getInstance().loginUrl);

            return Promise.resolve({
                status: 1337,
                body: { foo: 'bar' }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as Core.HttpResponse<any>);
        });

        const args = new Map([['deviceUUID', 'deviceUUID']]);
        const { status, body } = await restApiService.login(_apiKey, _tokenData, args);
        expect(_httpService.post).toBeCalled();
        expect(status).toBe(1337);
        expect(body['foo']).toBe('bar');
        _httpService.post = postFn;
    });
    it('checks request body params on login v2 with mock ff delegate SDK', async () => {
        const _httpService: Core.HttpService = Core.InjectionContainer.resolve<Core.HttpService>(
            Core.ContainerDef.httpService
        );

        expect.assertions(9);
        const postFn = _httpService.post;
        _httpService.post = jest.fn((url, _, body) => { // NOSONAR
            expect(url).toBe(ConfigService.getInstance().loginUrl);
            const flagNames: string[] = body['featureFlags'].flagNames;
            expect(flagNames.includes('foo')).toBe(true);
            expect(flagNames.includes('bar')).toBe(true);
            expect(flagNames.includes('baz')).toBe(true);
            expect(body['featureFlags'].distinctId).toBe('distinctId');
            expect(body['featureFlags'].namespace).toBe('xaaf');

            return Promise.resolve({
                status: 1337,
                body: { foo: 'bar' }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as Core.HttpResponse<any>);
        });
        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, ({
            featureFlagRequest: {
                featureFlags: {
                    flagNames: ['foo', 'bar', 'baz'],
                    namespace: 'xaaf',
                    distinctId: 'distinctId',
                    customStringProperties: {}
                }
            }
        } as unknown) as Core.FeatureFlagsDelegate);
        const args = new Map([['deviceUUID', 'deviceUUID']]);
        ConfigService.getInstance().apiVersion = ApiVersion.v2;
        const { status, body } = await restApiService.login(_apiKey, _tokenData, args);
        expect(_httpService.post).toBeCalled();
        expect(status).toBe(1337);
        expect(body['foo']).toBe('bar');
        _httpService.post = postFn;
        ConfigService.getInstance().apiVersion = ApiVersion.v1;
    });
    it('checks request body params on refresh v2 with mock ff delegate SDK', async () => {
        const _httpService: Core.HttpService = Core.InjectionContainer.resolve<Core.HttpService>(
            Core.ContainerDef.httpService
        );

        expect.assertions(13);
        const postFn = _httpService.post;
        _httpService.post = jest.fn((url, _, body) => { // NOSONAR
            expect(url).toBe(ConfigService.getInstance().refreshTokenUrl);
            const flagNames: string[] = body['featureFlags'].flagNames;
            expect(flagNames.includes('foo')).toBe(true);
            expect(flagNames.includes('bar')).toBe(true);
            expect(flagNames.includes('baz')).toBe(true);
            expect(body['featureFlags'].distinctId).toBe('distinctId');
            expect(body['featureFlags'].namespace).toBe('xaaf');
            expect(body['featureFlags'].customStringProperties).toBeTruthy();

            expect(body['param1']).toBe('1');
            expect(body['param2']).toBe('2');
            expect(body['param3']).toBe('3');
            return Promise.resolve({
                status: 1337,
                body: { foo: 'bar' }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as Core.HttpResponse<any>);
        });
        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, ({
            featureFlagRequest: {
                featureFlags: {
                    flagNames: ['foo', 'bar', 'baz'],
                    namespace: 'xaaf',
                    distinctId: 'distinctId',
                    customStringProperties: {}
                }
            }
        } as unknown) as Core.FeatureFlagsDelegate);

        const sdkArguments: Map<string, string> = new Map([
            ['deviceUUID', 'deviceUUID'],
            ['foo', 'bar'],
            ['param1', '1'],
            ['param2', '2'],
            ['param3', '3']
        ]);
        const loginRequestId = 'loginRequestId';
        const { status, body } = await restApiService['_refreshTokenV2'](sdkArguments, loginRequestId);
        expect(_httpService.post).toBeCalled();
        expect(status).toBe(1337);
        expect(body['foo']).toBe('bar');
        _httpService.post = postFn;
    });
    it('checks feature flags request is created correctly', () => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, ({
            featureFlagRequest: {
                featureFlags: {
                    flagNames: ['foo', 'bar', 'baz'],
                    namespace: 'xaaf',
                    distinctId: 'distinctId',
                    customStringProperties: {}
                }
            }
        } as unknown) as Core.FeatureFlagsDelegate);
        const { featureFlags }: Core.RequestBody = restApiService['_buildAuthBody']({ foo: 'bar' });
        expect(featureFlags.namespace).toBe('xaaf');
        expect(featureFlags.flagNames.includes('foo')).toBe(true);
        expect(featureFlags.flagNames.includes('bar')).toBe(true);
        expect(featureFlags.flagNames.includes('baz')).toBe(true);
    });
    it('checks body is built correctly', () => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, ({
            featureFlagRequest: {
                featureFlags: {
                    flagNames: ['foo', 'bar', 'baz'],
                    namespace: 'xaaf',
                    distinctId: 'distinctId',
                    customStringProperties: {}
                }
            }
        } as unknown) as Core.FeatureFlagsDelegate);
        const body: Core.RequestBody = restApiService['_buildAuthBody']({ deviceUUID: 'deviceUUID' });
        expect(body.deviceUUID).toBe('deviceUUID');
        expect(body.featureFlags.flagNames.includes('foo')).toBe(true);
        expect(body.featureFlags.flagNames.includes('bar')).toBe(true);
        expect(body.featureFlags.flagNames.includes('baz')).toBe(true);
    });
    it('checks body is built correctly, no feature flag request', () => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, ({
            flagNames: []
        } as unknown) as Core.FeatureFlagsDelegate);
        const body: Core.RequestBody = restApiService['_buildAuthBody']({ deviceUUID: 'deviceUUID' });
        expect(body.deviceUUID).toBe('deviceUUID');
        expect(body.featureFlags).not.toBeTruthy();
    });
    it('check auth headers', () => {
        const requestId = 'requestId';
        const token = 'token';
        const authHeaders = restApiService['_buildAuthHeaders'](token, requestId);
        expect(authHeaders['Authorization']).toBe(`Bearer ${token}`);
        expect(authHeaders['X-Request-ID']).toBe(requestId);
        expect(authHeaders['Content-Type']).toBe('application/json');
    });
});

describe('longform tests', () => {
    const FFDelegateMock = {
        isFlagEnabled: (_) => true,
        setup: (_) => Promise.resolve(null),
        register: (_) => null,
        fetch: () => null
    };

    const mockResponse: Core.HttpResponse<Core.LoginResponse> = {
        status: 200,
        body: {
            token: 'token',
            refreshToken: 'refreshToken',
            configuration: ({
                foo: 'bar'
            } as unknown) as Core.ConfigResponse
        }
    };

    const TLV_TEST =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNzhiODE0ZjA0OWJiMDAxYjBiYmM4NCIsImFwcElkIjoiNWU3OGI4MTVmMDQ5YmIwMDFiMGJiYzg2IiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1iZS10ZXN0LmF0dC5jb20iLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiZW52aXJvbm1lbnQiOiJ0bHYtdGVzdCIsImlhdCI6MTU5NjAxODQ2NywiaXNzIjoiQVQmVCIsInN1YiI6IkFwaUtleSJ9.H0vBCix7n74hxwR8MgS3ixOzUrGnTHxIEBKlDlGd1q9aiIeuTNJA8d0RPoyc6eUIpU9q3O8KP-g8krGxSFWbmQ579gh2wIrYkNeO2ykuG945NCGgYf13EA9zSnLzy3rmQ9YERSxXSeVenvvraXLNlQMqjSr_mMhyqeWTpc1L8fuX54nwYpH9-0pjlARIIKh03TuNGR7nMgPEaMeIMjjQ3Q_ykBaKOnHN8NTdE5C88vKoWzpb2_ulquJEwSUezPAeaCmr2SHoXvy8lWvr7LBfvK9VlVk2H-Dwk_iBBbL5EuTK5E3CuwzkJbAoz1vqW62KU42jn1ejgGcbQmGfdQYjbg';

    it('setting proxy delegate should retrieve v2 auth functions for feature flags', () => {
        const xaafJsSdk: XaafJsSdk = new XaafJsSdk();
        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, {
            ...FFDelegateMock,
            usesRelayProxy: true
        });
        expect(xaafJsSdk['_configService'].apiVersion).toBe(ApiVersion.v2);
    });
    it('setting proxy delegate should trigger v2 login', (done) => {
        const xaafJsSdk: XaafJsSdk = new XaafJsSdk();

        // needed for kill switch and persistent login
        Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, {
            setItem: jest.fn(),
            getItem: jest.fn(),
            removeItem: jest.fn()
        });

        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, {
            ...FFDelegateMock,
            usesRelayProxy: true
        });

        const restApi = RestApiService.getInstance();
        restApi['_loginV2'] = jest.fn((sdkArguments, requestId) => {
            expect(sdkArguments.get('foo')).toBe('bar');
            expect(requestId).toBeDefined();
            done();
            return Promise.resolve({ ...mockResponse });
        });

        xaafJsSdk.initialize(TLV_TEST, new Map([['foo', 'bar']]));
    });
    it('setting regular delegate should trigger v1 login', (done) => {
        const xaafJsSdk: XaafJsSdk = new XaafJsSdk();
        // needed for kill switch and persistent login
        Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, {
            setItem: jest.fn(),
            getItem: jest.fn(),
            removeItem: jest.fn()
        });

        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, {
            ...FFDelegateMock,
            usesRelayProxy: false
        });

        const restApi = RestApiService.getInstance();
        restApi['_loginV1'] = jest.fn((sdkArguments, requestId) => {
            expect(sdkArguments.get('foo')).toBe('bar');
            expect(requestId).toBeDefined();
            done();
            return Promise.resolve({ ...mockResponse });
        });

        xaafJsSdk.initialize(TLV_TEST, new Map([['foo', 'bar']]));
    });

    it('accounting url should be called upon refresh token V2 request', () => {
        const httpService = Core.InjectionContainer.resolve<HttpService>(Core.ContainerDef.httpService);
        const restApiService = RestApiService.getInstance();
        const configService = ConfigService.getInstance();
        jest.spyOn(configService, 'accountingUrl', 'get').mockReturnValueOnce('https://accountingUrl');
        jest.spyOn(configService, 'DeviceID', 'get').mockReturnValueOnce('12141277');
        const sdkArguments: Map<string, string> = new Map([
            ['foo', 'bar'],
            ['param1', '1'],
            ['param2', '2'],
            ['param3', '3']
        ]);
        const loginRequestId = 'loginRequestId';
        const expectedUrl = 'https://accountingUrl?distinct_id=12141277';
        jest.spyOn(httpService, 'request');

        restApiService['_refreshTokenV2'](sdkArguments, loginRequestId);

        expect(httpService.request).toHaveBeenCalledWith(expectedUrl, 'HEAD', expect.anything());
    });

    it('accounting url should not be called if not recived from login configuration', () => {
        const httpService = Core.InjectionContainer.resolve<HttpService>(Core.ContainerDef.httpService);
        const restApiService = RestApiService.getInstance();
        const configService = ConfigService.getInstance();
        jest.spyOn(configService, 'accountingUrl', 'get').mockReturnValueOnce(undefined);
        jest.spyOn(configService, 'DeviceID', 'get').mockReturnValueOnce('12141277');
        const sdkArguments: Map<string, string> = new Map([
            ['foo', 'bar'],
            ['param1', '1'],
            ['param2', '2'],
            ['param3', '3']
        ]);
        const loginRequestId = 'loginRequestId';
        jest.spyOn(httpService, 'request');

        restApiService['_refreshTokenV2'](sdkArguments, loginRequestId);

        expect(httpService.request).not.toBeCalled();
    });
});
