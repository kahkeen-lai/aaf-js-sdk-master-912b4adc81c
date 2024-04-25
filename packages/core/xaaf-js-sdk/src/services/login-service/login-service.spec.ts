/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
import { setMockedResponse, mockModule } from '../../mock/mock';
import * as Core from '@xaaf/common';
import { LoginService } from './login-service';
import { ConfigService } from '../config-service/config-service';
import { TokenService } from '../token-service/token-service';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import { ErrorResponse } from '@xaaf/common';
import { RestApiService } from '../rest-api-service/rest-api-service';

class mockedLoginServiceDelegate implements Core.StorageService {
    val: Core.LoginStoredData;
    constructor(val: Core.LoginStoredData) {
        this.val = val;
    }

    getItem(): Promise<string> {
        return Promise.resolve(JSON.stringify(this.val));
    }

    setItem(key, value): Promise<void> {
        return Promise.resolve((this.val = value));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeItem = jest.fn((key: string) => Promise.resolve(null));
}

describe('login-service tests', () => {
    let tokenData: Core.TokenData;
    let apiKeyTlvTestFiretv: string;
    let apiKeyTlvLalFiretv: string;
    let args;
    let loginResponseMock: Core.LoginResponse;
    let refreshTokenResponseMock: Core.LoginResponse;
    let loginStoredData: Core.LoginStoredData;
    let loginService: LoginService;
    let configService: ConfigService;
    let tokenService: TokenService;
    let featureFlagsService: FeatureFlagsService;

    beforeEach(() => {
        loginService = LoginService.getInstance();
        configService = ConfigService.getInstance();
        tokenService = TokenService.getInstance();
        featureFlagsService = FeatureFlagsService.getInstance();

        tokenData = {
            tenantId: 'tenantId',
            tenantName: 'tenantName',
            appId: 'appId',
            platformName: 'platformName',
            sdkVersion: 'sdkVersion',
            sdkName: 'sdkName',
            enabled: true,
            host: 'https://xaaf-lal.tlv-devops.com',
            privilegeType: 'privilegeType',
            environment: 'environment',
            apiKeyIat: 0,
            iat: 0,
            exp: 0,
            iss: 'iss',
            sub: 'sub'
        };

        args = new Map();

        apiKeyTlvTestFiretv =
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkMzQ4MzBiNGM4NzcxMDAxMjJhYTY5OSIsImFwcElkIjoiNWQzNDgzMGI0Yzg3NzEwMDEyMmFhNjlhIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImFuZHJvaWR0diIsImVudmlyb25tZW50IjoidGx2LXRlc3QiLCJpYXQiOjE1NjM3MjI1MDgsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.FlveU39PtMrUIS6cENIk8xY-qgSPmGBK4Ir4COgfTQIoOat4wS73xl9sSTLm3zG1gedqGDIXYKT_lV43ASvVP5e1fpXdeWEsHvNyh163O-mbhI12_UvWl7JvBAhzFVlxflbHgWCdoyfN7Px1jx469RfzVELNck5dinYwEMyIJThDEc_TZ0DQogwTncHCmMfBtmANAc7LhHPtTOL0xLTUs5A2WtI1fD_jVsMAcM9Hdj1W6KFDIH2OXjfYmMtKkLQMpVl668Jx8K5D3WqHJHtdjHJlnLzyq31p6dMUV4TeRq5whLcE_e_ptkYVJ6KbOMJ7Kzs3eOBgsMPu16JNmMclgA';
        apiKeyTlvLalFiretv =
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkNzc2ZTM0MTdiZmE0MDAxOTgyZjRmNCIsImFwcElkIjoiNWQ3NzZlMzQ4MmU4YWIwMDE5ODNhY2Q5IiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2LXlvdWkiLCJzZGtWZXJzaW9uIjoidjEiLCJzZGtOYW1lIjoianMtc2RrLXlvdWkiLCJlbmFibGVkIjp0cnVlLCJob3N0IjoiaHR0cHM6Ly94YWFmLWxhbC50bHYtZGV2b3BzLmNvbSIsInByaXZpbGVnZVR5cGUiOiJ0ZXN0ZXIiLCJlbnZpcm9ubWVudCI6InRsdi1sYWwiLCJpYXQiOjE1ODUwODEwMjMsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.MjvrsiSqIskXaRV-jVm62_8xY4GqCSiXtJ6F_3NGFv2dSDBd47HKeveA2jToYxi_qcsYV0AtheD5M0qHLnquzo6f8eHBBerJjgVWNf8RU5wwLK1XTl6RVRZfnvEYm8DkKc_Z33Rzo_4kMsVX_0nI0iyT556RFzkYIN_O3Oa3K4OWoXyUsN7WCPMtAT52aRG5VtMgwsCjKPcjCPplT3lnyKdp_LN-qXRnzp5570_JtnJ_IN8wJCxUgCnuDX5QJHO-oqxPVEUtzLwLJR-n3bVOJtef4-gTjfXtR1-3smw5xP5z39GOrR22ctteybp2SDi0qTUofSPGFoyGv0z3bGe_9g';

        loginResponseMock = require('../../mock/expectations/Login-200.json');
        refreshTokenResponseMock = require('../../mock/expectations/RefreshToken-200.json');

        loginStoredData = {
            persistentApiKey: apiKeyTlvLalFiretv,
            persistentLoginRes: loginResponseMock
        };
    });

    describe('util functions', () => {
        let _retrieveErrorData;
        let _handleLoginResponseError;

        beforeEach(() => {
            loginService['_retryLoginInfinite'] = jest.fn();
            loginService['_retryLoginOnce'] = jest.fn();

            _retrieveErrorData = LoginService['_retrieveErrorData'];
            _handleLoginResponseError = (err) => loginService['_handleLoginResponseError'](err);
        });

        it('_retrieveErrorData', () => {
            expect(
                _retrieveErrorData({
                    errorCode: '500',
                    comment: 'foo'
                })
            ).toStrictEqual({
                errorCode: '500',
                message: 'foo'
            });

            expect(
                _retrieveErrorData({
                    errorCode: '503',
                    comment: 'foo'
                })
            ).toStrictEqual({
                errorCode: '503',
                message: 'foo'
            });

            expect(
                _retrieveErrorData({
                    status: 401
                })
            ).toStrictEqual({
                errorCode: '401',
                message: 'http error 401'
            });

            expect(_retrieveErrorData('foo')).toStrictEqual({
                errorCode: '9000',
                message: ''
            });

            expect(
                _retrieveErrorData({
                    body: {
                        errorCode: '500-1',
                        message: 'foo'
                    }
                })
            ).toStrictEqual({
                errorCode: '500-1',
                message: 'foo'
            });
        });

        it('_handleLoginResponseError GeneralError', () => {
            _handleLoginResponseError({ errorCode: Core.ErrorCode.GeneralError });
            expect(loginService['_retryLoginOnce']).toBeCalled();
        });
        it('_handleLoginResponseError InternalServerError', () => {
            _handleLoginResponseError({ errorCode: Core.ErrorCode.InternalServerError });
            expect(loginService['_retryLoginOnce']).toBeCalled();
        });
        it('_handleLoginResponseError FailureEngagingAdRouter', () => {
            _handleLoginResponseError({ errorCode: Core.ErrorCode.FailureEngagingAdRouter });
            expect(loginService['_retryLoginOnce']).toBeCalled();
        });
        it('_handleLoginResponseError 503', () => {
            _handleLoginResponseError({ errorCode: '503' });
            expect(loginService['_retryLoginOnce']).not.toBeCalled();
            expect(loginService['_retryLoginInfinite']).toBeCalled();
        });
        it('_handleLoginResponseError 599', () => {
            _handleLoginResponseError({ errorCode: '599' });
            expect(loginService['_retryLoginOnce']).not.toBeCalled();
            expect(loginService['_retryLoginInfinite']).toBeCalled();
        });
        it('_handleLoginResponseError 500-1', () => {
            _handleLoginResponseError({ errorCode: '500-1' });
            expect(loginService['_retryLoginInfinite']).not.toBeCalled();
            expect(loginService['_retryLoginOnce']).toBeCalled();
        });
    });

    describe('resiliency functions', () => {
        let loginService; // NOSONAR

        beforeEach(() => {
            loginService = new LoginService();
            loginService['_retryLogin'] = jest.fn();
            Core.InjectionContainer.registerInstance(
                Core.ContainerDef.storageService,
                new mockedLoginServiceDelegate(null)
            );
        });

        it('login fails with 500 error, resiliency is triggered', async () => {
            setMockedResponse(500, {
                errorCode: '500-9000',
                data: 'General Error',
                name: 'GeneralError',
                message: 'General Error'
            });

            expect.assertions(1);

            const apiKey = '';
            const tokenData = {}; // NOSONAR
            const args = new Map(); // NOSONAR

            Core.InjectionContainer.registerInstance(
                Core.ContainerDef.storageService,
                new mockedLoginServiceDelegate(null)
            );

            try {
                await loginService.getLoginResponse(apiKey, tokenData, args, '');
            } catch (error) {
                //
            }
            expect(loginService['_retryLogin']).toBeCalled();
        });

        it('login fails with 500 error, no error body, resiliency is triggered', async () => {
            setMockedResponse(500, {});

            expect.assertions(1);

            const apiKey = '';
            const tokenData = {}; // NOSONAR
            const args = new Map(); // NOSONAR

            Core.InjectionContainer.registerInstance(
                Core.ContainerDef.storageService,
                new mockedLoginServiceDelegate(null)
            );

            try {
                await loginService.getLoginResponse(apiKey, tokenData, args, '');
            } catch (error) {
                //
            }
            expect(loginService['_retryLogin']).toBeCalled();
        });

        it('429 login with rate limit error', async () => {
            setMockedResponse(429, null);

            expect.assertions(1);

            try {
                await loginService.getLoginResponse(apiKeyTlvTestFiretv, tokenData, args, '');
            } catch (error) {
                //
            }
            expect(loginService['_retryLogin']).toBeCalled();
        });
    });

    describe('Kill switch tests', () => {
        let loginService; // NOSONAR

        const errorResponse: ErrorResponse = {
            errorCode: '401-2',
            data: {
                timeToNextEngagement: 1
            },
            name: 'KillSwitchWarning',
            message: 'Kill Switch Warning'
        };

        beforeEach(() => {
            loginService = new LoginService();
            Core.InjectionContainer.registerInstance(
                Core.ContainerDef.storageService,
                new mockedLoginServiceDelegate(null)
            );

            jest.spyOn(loginService, '_setKillSwitch');
            jest.spyOn(loginService, '_setPersistentLoginItem');
            jest.spyOn(loginService._storageService, 'removeItem');
        });

        it('login fails with 401-2 kill switch error', async () => {
            setMockedResponse(401, errorResponse);

            expect.assertions(4);

            const apiKey = '';
            const tokenData = {}; // NOSONAR
            const args = new Map(); // NOSONAR

            Core.InjectionContainer.registerInstance(
                Core.ContainerDef.storageService,
                new mockedLoginServiceDelegate(null)
            );

            expect.assertions(4);
            try {
                await loginService.getLoginResponse(apiKey, tokenData, args, '');
            } catch (error) {
                expect(loginService._storageService['removeItem']).toBeCalledWith(
                    Core.KILL_SWITCH_PERSISTENT_STORAGE_KEY
                );
                expect(loginService['_setKillSwitch']).toBeCalledWith(errorResponse);
                expect(configService.timeToNextEngagement).not.toEqual(0);
                expect(loginService['_setPersistentLoginItem']).toBeCalled();
            }
        });

        it('refresh token fails with 401-2 kill switch error', async () => {
            setMockedResponse(401, errorResponse);

            expect.assertions(4);

            Core.InjectionContainer.registerInstance(
                Core.ContainerDef.storageService,
                new mockedLoginServiceDelegate(null)
            );

            try {
                await loginService.refreshToken(false);
            } catch (error) {}

            expect(loginService._storageService['removeItem']).toBeCalledWith(Core.KILL_SWITCH_PERSISTENT_STORAGE_KEY);
            expect(loginService['_setKillSwitch']).toBeCalledWith(errorResponse);
            expect(configService.timeToNextEngagement).not.toEqual(0);
            expect(loginService['_setPersistentLoginItem']).toBeCalled();
        });
    });

    describe('feature flags response in refresh', () => {
        it('checks feature flags response in refresh with mock', async () => {
            const loginService = new LoginService(); // NOSONAR
            const featureFlags = {
                flag1: true,
                flag2: false,
                flag3: true,
                flag4: true
            };

            configService['_config'] = {
                sdkArguments: new Map<string, string>(),
                apiKey: apiKeyTlvLalFiretv,
                tokenData: {
                    host: 'foo'
                } as Core.TokenData
            };
            const _setPersistentLoginItem = loginService['_setPersistentLoginItem'];
            loginService['_setPersistentLoginItem'] = jest.fn();
            const decodeTokens = tokenService.decodeTokens;
            tokenService.decodeTokens = jest.fn();
            const setTokensExpirationDates = tokenService.setTokensExpirationDates;
            tokenService.setTokensExpirationDates = jest.fn();

            featureFlagsService.setup = jest.fn();

            Core.InjectionContainer.registerInstance(Core.ContainerDef.httpService, {
                post: jest.fn(() =>
                    Promise.resolve(({
                        status: 1337,
                        body: {
                            foo: 'bar',
                            configuration: {
                                featureFlags
                            }
                        }
                    } as unknown) as Core.HttpResponse<Core.LoginResponse>)
                )
            });

            Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, ({
                usesRelayProxy: true
            } as unknown) as Core.FeatureFlagsDelegate);

            expect.assertions(6);
            const response = await loginService.refreshToken(false);
            const _featureFlags = response['configuration']['featureFlags'];

            expect(response['foo']).toBe('bar');
            expect(_featureFlags['flag1']).toBe(true);
            expect(_featureFlags['flag2']).toBe(false);
            expect(_featureFlags['flag3']).toBe(true);
            expect(_featureFlags['flag4']).toBe(true);
            expect(featureFlagsService.setup).toBeCalledWith({ featureFlags });

            loginService['_setPersistentLoginItem'] = _setPersistentLoginItem;
            tokenService.decodeTokens = decodeTokens;
            tokenService.setTokensExpirationDates = setTokensExpirationDates;
        });
    });

    describe('Multiple Login with PersistentLoginService', () => {
        it('New ApiKey and persisted ApiKey are the same in silentLogin - setPersistentLoginItem will be called and token will be updated even though keys are the same', async () => {
            const delegate = new mockedLoginServiceDelegate(loginStoredData);
            Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, delegate);

            setMockedResponse(200, loginResponseMock);

            jest.spyOn(delegate, 'setItem').mockImplementation(
                (key: string, value: string): Promise<void> => {
                    expect(JSON.parse(value)['persistentApiKey']).toEqual(apiKeyTlvLalFiretv);
                    return null;
                }
            );

            await loginService.getLoginResponse(apiKeyTlvLalFiretv, tokenData, args, '');
            await loginService.silentLoginRequest(false);

            expect(configService.token).toEqual(loginResponseMock.token);
            expect.assertions(2);
        });

        it('New ApiKey and persisted ApiKey are different in silentLogin - setPersistentLoginItem will be called and token will be updated', async () => {
            const delegate = new mockedLoginServiceDelegate(loginStoredData);
            Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, delegate);
            setMockedResponse(200, loginResponseMock);

            jest.spyOn(delegate, 'setItem').mockImplementation(
                (key: string, value: string): Promise<void> => {
                    expect(JSON.parse(value)['persistentApiKey']).toEqual(apiKeyTlvTestFiretv);
                    return null;
                }
            );

            await loginService.getLoginResponse(apiKeyTlvTestFiretv, tokenData, args, '');
            await loginService.silentLoginRequest(false);

            expect(configService.token).toEqual(loginResponseMock.token);
            expect.assertions(3);
        });

        it('New ApiKey and persisted ApiKey are the same in refreshToken - setPersistentLoginItem will be called and token will be updated even though keys are the same', async () => {
            const delegate = new mockedLoginServiceDelegate(loginStoredData);
            Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, delegate);

            jest.spyOn(RestApiService.getInstance(), 'refreshToken').mockImplementation(() =>
                Promise.resolve({ body: refreshTokenResponseMock } as Core.HttpResponse<Core.LoginResponse>)
            );

            jest.spyOn(delegate, 'setItem').mockImplementation(
                (key: string, value: string): Promise<void> => {
                    expect(JSON.parse(value)['persistentApiKey']).toEqual(apiKeyTlvLalFiretv);
                    return null;
                }
            );

            await loginService.getLoginResponse(apiKeyTlvLalFiretv, tokenData, args, '');
            await loginService.refreshToken(false);

            expect(configService.token).toEqual(refreshTokenResponseMock.token);
            expect.assertions(2);
        });

        it('New ApiKey and persisted ApiKey are different in refreshToken - setPersistentLoginItem will be called and token will be updated', async () => {
            const delegate = new mockedLoginServiceDelegate(loginStoredData);
            Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, delegate);

            jest.spyOn(RestApiService.getInstance(), 'refreshToken').mockImplementation(() =>
                Promise.resolve({ body: refreshTokenResponseMock } as Core.HttpResponse<Core.LoginResponse>)
            );

            jest.spyOn(delegate, 'setItem').mockImplementation(
                (key: string, value: string): Promise<void> => {
                    expect(JSON.parse(value)['persistentApiKey']).toEqual(apiKeyTlvTestFiretv);
                    return null;
                }
            );

            await loginService.getLoginResponse(apiKeyTlvTestFiretv, tokenData, args, '');
            await loginService.refreshToken(false);

            expect(configService.token).toEqual(refreshTokenResponseMock.token);
            expect.assertions(3);
        });

        it('Persisted ApiKey is null - setPersistentLoginItem will be called with the new apiKey as parameter', async () => {
            const loginServiceDelegate = new mockedLoginServiceDelegate(loginStoredData);
            Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, loginServiceDelegate);

            jest.spyOn(RestApiService.getInstance(), 'login').mockImplementation(() =>
                Promise.resolve({ body: {} } as Core.HttpResponse<Core.LoginResponse>)
            );

            jest.spyOn(loginServiceDelegate, 'setItem').mockImplementation(
                (key: string, value: string): Promise<void> => {
                    expect(JSON.parse(value)['persistentApiKey']).toEqual(apiKeyTlvTestFiretv);
                    return null;
                }
            );
            try {
                await loginService.getLoginResponse(apiKeyTlvTestFiretv, tokenData, args, '');
            } catch (error) {}
            expect.assertions(1);
        });

        it('New ApiKey and persisted ApiKey are the same - setPersistentLoginItem will not be called', async () => {
            const delegate = new mockedLoginServiceDelegate(loginStoredData);
            Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, delegate);
            jest.spyOn(RestApiService.getInstance(), 'login').mockImplementation(() =>
                Promise.resolve({ body: {} } as Core.HttpResponse<Core.LoginResponse>)
            );

            const isSetPersistentLoginItemCalled = jest.spyOn(delegate, 'setItem');

            await loginService.getLoginResponse(apiKeyTlvLalFiretv, tokenData, args, '');

            expect(isSetPersistentLoginItemCalled).not.toBeCalled();
        });
        it('New ApiKey and persisted ApiKey are different - setPersistentLoginItem will be called with the new apiKey as parameter', async () => {
            const delegate = new mockedLoginServiceDelegate(loginStoredData);
            Core.InjectionContainer.registerInstance(Core.ContainerDef.storageService, delegate);

            jest.spyOn(RestApiService.getInstance(), 'login').mockImplementation(() =>
                Promise.resolve({ body: {} } as Core.HttpResponse<Core.LoginResponse>)
            );

            jest.spyOn(delegate, 'setItem').mockImplementation(
                (key: string, value: string): Promise<void> => {
                    expect(JSON.parse(value)['persistentApiKey']).toEqual(apiKeyTlvTestFiretv);
                    return null;
                }
            );

            try {
                await loginService.getLoginResponse(apiKeyTlvTestFiretv, tokenData, args, '');
            } catch (error) {}
            expect.assertions(1);
        });
    });
});
