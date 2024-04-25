/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { resetMocks, setMockedErrorResponse, setMockedResponse } from './mock/mock';
import { XaafJsSdk } from './xaaf-js-sdk';
import * as Core from '@xaaf/common';
import {
    AdEvent,
    ContainerDef,
    ErrorCode,
    ErrorSubDomain,
    HttpService,
    InjectionContainer,
    LoginStoredData,
    XaafEvent,
    XaafEventType
} from '@xaaf/common';
import { OpportunityType } from './executable-ad/opportunity';
import { ExecutableAd } from './executable-ad/executable-ad';
import { DummyExecutableAd } from './executable-ad/dummy-executable-ad';
import { ElementMock } from './mock/models';
import { State } from './fsm/state';
import { AppConfig, ConfigService, LoginService, ReportService, TokenExpirationStatus, TokenService } from './services';
import { XaafAdContainer } from './executable-ad/elements';

describe('xaaf-js-sdk tests', () => {
    class mockedLoginServiceDelegate implements Core.StorageService {
        val: LoginStoredData;
        constructor(val: LoginStoredData) {
            this.val = val;
        }

        getItem(key): Promise<string> {
            return Promise.resolve(JSON.stringify(this.val));
        }

        setItem(key, value): Promise<void> {
            return Promise.resolve((this.val = value));
        }

        removeItem(key): Promise<void> {
            return Promise.resolve();
        }
    }

    let loginResponseMock,
        opportunityResponseMock,
        tokenData,
        opportunityInfo,
        rnRenderer,
        apiKey,
        configMap,
        el,
        initAdinfo,
        killSwitchResponseMock;
    let sdk: XaafJsSdk;
    let loginService;

    beforeEach(() => {
        sdk = new XaafJsSdk();
        resetMocks();
        apiKey =
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkMzQ4MzBiNGM4NzcxMDAxMjJhYTY5OSIsImFwcElkIjoiNWQzNDgzMGI0Yzg3NzEwMDEyMmFhNjlhIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImFuZHJvaWR0diIsImVudmlyb25tZW50IjoidGx2LXRlc3QiLCJpYXQiOjE1NjM3MjI1MDgsImlzcyI6IkFUJlQiLCJzdWIiOiJBcGlLZXkifQ.FlveU39PtMrUIS6cENIk8xY-qgSPmGBK4Ir4COgfTQIoOat4wS73xl9sSTLm3zG1gedqGDIXYKT_lV43ASvVP5e1fpXdeWEsHvNyh163O-mbhI12_UvWl7JvBAhzFVlxflbHgWCdoyfN7Px1jx469RfzVELNck5dinYwEMyIJThDEc_TZ0DQogwTncHCmMfBtmANAc7LhHPtTOL0xLTUs5A2WtI1fD_jVsMAcM9Hdj1W6KFDIH2OXjfYmMtKkLQMpVl668Jx8K5D3WqHJHtdjHJlnLzyq31p6dMUV4TeRq5whLcE_e_ptkYVJ6KbOMJ7Kzs3eOBgsMPu16JNmMclgA';
        configMap = new Map();

        loginResponseMock = require('./mock/expectations/Login-200.json');
        opportunityResponseMock = require('./mock/expectations/SHOW_VIDEO.json');
        killSwitchResponseMock = require('./mock/expectations/Login-401-2-kill-switch.json');
        tokenData = require('./mock/expectations/tokenData.json');
        opportunityInfo = {
            opportunity: OpportunityType.Pause,
            arguments: new Map()
        };
        const appConfig: AppConfig = {
            apiKey: loginResponseMock.token,
            sdkArguments: new Map([['foo', 'bar']]),
            loginRes: loginResponseMock,
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

        el = new ElementMock();
        initAdinfo = new Map<string, string>([
            ['platform', 'dfw'],
            ['sdkName', 'tvos'],
            ['contentType', 'vod'],
            ['userType', '2'],
            ['sdkVersion', 'v1'],
            ['tenantSystemName', 'directv'],
            ['deviceType', 'tvos']
        ]);
        Core.InjectionContainer.registerInstance(
            Core.ContainerDef.storageService,
            new mockedLoginServiceDelegate(apiKey)
        );
        TokenService.getInstance();
        loginService = LoginService.getInstance();
    });
    afterEach(() => {
        if (sdk) {
            sdk.xaafInitListener = null;
        }
        sdk['_loginService'].isLoggedIn = false;
        sdk['_loginService']['_featureFlagsService'].isFlagEnabled = jest.fn((_flagName) => true);
        sdk['_reportService']['_isInitialized'] = false;
    });
    describe('integration test', () => {
        it('init Ad, start Ad, stop Ad - happy flow', (done) => {
            setMockedResponse(200, loginResponseMock);
            sdk.xaafInitListener = () => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                executableAd.initAd(el, initAdinfo);
                executableAd.startAd(el);
                executableAd.executableAdEventListener = () => {
                    expect(executableAd.currentState).toEqual(State.STATE_STOPPED);
                    done();
                };
                executableAd.stopAd();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('init Ad, start Ad, stop Ad without interaction - happy flow', (done) => {
            setMockedResponse(200, loginResponseMock);
            sdk.xaafInitListener = () => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                executableAd.initAd(el, initAdinfo);
                executableAd.startAd(el);
                executableAd.executableAdEventListener = () => {
                    expect(executableAd.currentState).toEqual(State.STATE_STOPPED);
                    done();
                };
                executableAd.stopAd('', false);
            };
            sdk.initialize(apiKey, configMap);
        });

        it('init Ad, start Ad, stop Ad with interaction - happy flow', (done) => {
            setMockedResponse(200, loginResponseMock);
            sdk.xaafInitListener = () => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                executableAd.initAd(el, initAdinfo);
                executableAd.startAd(el);
                executableAd.executableAdEventListener = () => {
                    expect(executableAd.currentState).toEqual(State.STATE_STOPPED);
                    done();
                };
                executableAd.stopAd('', true);
            };
            sdk.initialize(apiKey, configMap);
        });

        it('given expired tokens, initAd should relogin, then, current state should move to STATE_LOADED, given stopAd current state should move to STOPPED', (done) => {
            jest.setTimeout(1000 * 60 * 60);

            const httpService: HttpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            httpService.get = jest.fn(async () => ({ status: 200, body: opportunityResponseMock }));
            httpService.post = jest.fn(async () => ({ status: 200, body: loginResponseMock }));

            rnRenderer = null;
            // @ts-ignore
            sdk._loginService.isLoggedIn = true;
            sdk.xaafInitListener = () => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                executableAd.executableAdEventListener = (_adEvent: AdEvent) => {
                    expect(executableAd.currentState).not.toEqual(State.STATE_ERROR);
                    expect(executableAd.currentState).toEqual(State.STATE_LOADED);
                    executableAd.executableAdEventListener = () => {
                        expect(executableAd.currentState).toEqual(State.STATE_STOPPED);
                        done();
                    };
                    executableAd.stopAd(el);
                };
                executableAd.initAd(el, initAdinfo);
                executableAd.startAd(el);
            };
            sdk.initialize(apiKey, configMap);
        });

        it('start Ad - STATE_CREATED logging properly', (done) => {
            setMockedResponse(200, loginResponseMock);
            rnRenderer = null;
            console.debug = jest.fn().mockImplementation();
            const _configMap = configMap;
            _configMap.set('consoleLogger', 'true');
            _configMap.set('productionLogger', 'false');
            _configMap.set('loggerLevel', 'verbose');

            sdk.xaafInitListener = () => {
                expect(console.debug).toBeCalled();
                done();
            };
            sdk.initialize(apiKey, _configMap);
        });

        it('given start Ad and opportunity response, should move to STATE_STARTING', (done) => {
            jest.setTimeout(1000 * 60 * 10);

            const httpService: HttpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            httpService.get = jest.fn(async () => ({ status: 200, body: opportunityResponseMock }));
            httpService.post = jest.fn(async () => ({ status: 200, body: loginResponseMock }));

            rnRenderer = null;
            sdk.xaafInitListener = () => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);

                executableAd.executeTriggeredCommands = jest.fn(() => {
                    /**
                     * the previous implementation of this test returned a login response for getOpportunity response
                     * after such a thing is impossible (error check in getOpportunity), the mock has been fixed.
                     * However, executeTriggeredCommands now works as expected,
                     * also it needs to be mocked and call _moveToNextState
                     */
                    executableAd['_moveToNextState'](State.STATE_STARTED);
                });

                executableAd.executableAdEventListener = () => {
                    expect(executableAd.currentState).not.toEqual(State.STATE_ERROR);
                    expect(executableAd.currentState).toEqual(State.STATE_LOADED);
                    executableAd.executableAdEventListener = () => {
                        expect(executableAd.currentState).not.toEqual(State.STATE_ERROR);
                        expect(executableAd.currentState).toEqual(State.STATE_STARTED);
                        expect(executableAd.executeTriggeredCommands).toBeCalled();
                        done();
                    };
                    executableAd.startAd({});
                };
                executableAd.initAd({} as XaafAdContainer, initAdinfo);
            };
            sdk.initialize(apiKey, configMap);
        });

        it('stop Ad - STATE_STOPPING', (done) => {
            setMockedResponse(200, loginResponseMock);
            rnRenderer = null;
            sdk.initialize(apiKey, configMap);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            sdk.xaafInitListener = (_xaafEvent: XaafEvent) => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                executableAd.executableAdEventListener = () => {
                    expect(executableAd.currentState).toEqual('STATE_STOPPED');
                    done();
                };
                executableAd.startAd(el);
                executableAd.stopAd();
            };
        });

        // it.only('init Ad, start Ad, startAd - STATE_ERROR', (done) => {
        //     //no login creates an error
        //     // setMockedResponse(200, loginResponseMock);
        //     setMockedErrorResponse('Error fetch login response');
        //     rnRenderer = null;
        //     sdk.xaafInitListener = () => {
        //         const executableAd = sdk.getExecutableAd(opportunityInfo);
        //         executableAd.executableAdEventListener = () => {
        //             expect(executableAd.currentState).toEqual('STATE_ERROR');
        //             done();
        //         }
        //         executableAd.initAd(el, initAdinfo);
        //         executableAd.startAd(el);
        //     }
        //     sdk.initialize(apiKey, configMap);
        // });

        it('init Ad, start Ad, startAd - STATE_ERROR', (done) => {
            setMockedResponse(200, loginResponseMock);
            rnRenderer = null;
            sdk.xaafInitListener = () => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                executableAd.executableAdEventListener = () => {
                    expect(executableAd.currentState).toEqual('STATE_ERROR');
                    done();
                };
                executableAd.initAd(el, initAdinfo);
                executableAd.startAd(el);
                executableAd.startAd(el);
            };
            sdk.initialize(apiKey, configMap);
        });

        it('should return Dummy if flag is off', () => {
            setMockedResponse(200, loginResponseMock);
            sdk.initialize(apiKey, configMap);
            const dummyExecutableAd = sdk.getExecutableAd(opportunityInfo);
            expect(dummyExecutableAd).toBeDefined();
        });

        it('should return Dummy if flag is off', () => {
            setMockedResponse(200, loginResponseMock);
            sdk.initialize(apiKey, configMap);
            // sdk._featureFlagsService.xaafEnabled = false;
            // @TODO: missing import
            // const callback : IsFlagEnabledCallback = (flagName: 'dummy', defaultValue: false) => false
            // sdk.isFlagEnabledCallback = callback;
            const dummyExecutableAd = sdk.getExecutableAd(opportunityInfo);
            expect(dummyExecutableAd).toBeDefined();
        });

        it('should not allow the listener to work if not a function', () => {
            setMockedResponse(200, loginResponseMock);
            sdk.initialize(apiKey, configMap);
            const dummyString = 'dummy';
            // @ts-ignore
            sdk._notifyXaafListenerXaafEvent(dummyString);
            expect(sdk.xaafInitListener).toBeNull;
        });

        it('should allow the listener to work if a function', async (done) => {
            let isTrue = false;
            setMockedResponse(200, loginResponseMock);
            const xaafEvent = sdk.initialize(apiKey, configMap);
            sdk.xaafInitListener = () => {
                isTrue = true;
                expect(isTrue).toBeTruthy();
                done();
            };
            // @ts-ignore
            sdk._notifyXaafListenerXaafEvent(xaafEvent);
        });

        // TODO - add test startAd, loadAd
    });

    describe('xaaf sdk - kill switch tests', () => {
        it('login failed with kill switch error, should return dummy executable ad', (done) => {
            setMockedResponse(401, killSwitchResponseMock);
            sdk.xaafInitListener = (xaafEvent) => {
                expect(xaafEvent).toEqual({ type: XaafEventType.SUCCESS });
                expect(sdk['_configService']['_config'].tokenData).toEqual(tokenData);
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                expect(executableAd).toBeInstanceOf(DummyExecutableAd);
                done();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('kill switch defined in persistent storage, should skip login and return dummy executable ad', (done) => {
            setMockedResponse(200, loginResponseMock);
            const killSwitchStoredData = {
                apiKey,
                timeToNextEngagement: new Date().getTime() + 60000,
                configuration: {}
            };
            jest.spyOn(sdk['_loginService'], 'getPersistentLoginItem').mockResolvedValueOnce(killSwitchStoredData);
            jest.spyOn(sdk['_loginService'], 'getLoginResponse');
            sdk.xaafInitListener = (xaafEvent) => {
                expect(xaafEvent).toEqual({ type: XaafEventType.SUCCESS });
                expect(sdk['_configService']['_config'].tokenData).toEqual(tokenData);
                expect(sdk['_loginService'].getLoginResponse).not.toBeCalled();
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                expect(executableAd).toBeInstanceOf(DummyExecutableAd);
                done();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('login failed with kill switch error, should return dummy executable ad and then after kill switch expired real executable ad', (done) => {
            // set timeToNextEngagement to 0.01 minutes - less then 1 second
            killSwitchResponseMock.data.timeToNextEngagement = 0.01;
            setMockedResponse(401, killSwitchResponseMock);
            sdk.xaafInitListener = (xaafEvent) => {
                expect(xaafEvent).toEqual({ type: XaafEventType.SUCCESS });
                expect(sdk['_configService']['_config'].tokenData).toEqual(tokenData);
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                expect(executableAd).toBeInstanceOf(DummyExecutableAd);
                setTimeout(() => {
                    const executableAd2 = sdk.getExecutableAd(opportunityInfo);
                    expect(executableAd2).not.toBeInstanceOf(DummyExecutableAd);
                    done();
                }, 3000);
            };
            sdk.initialize(apiKey, configMap);
        });

        it('refresh token failed with kill switch error, when get ad return dummy executable ad', (done) => {
            setMockedResponse(200, loginResponseMock);
            sdk.initialize(apiKey, configMap);
            sdk.xaafInitListener = (xaafEvent) => {
                expect(xaafEvent).toEqual({ type: XaafEventType.SUCCESS });
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                expect(executableAd).toBeInstanceOf(ExecutableAd);
                expect(executableAd).not.toBeInstanceOf(DummyExecutableAd);

                // given killSwitchResponseMock, executableAdEventListener should be called with Error
                jest.spyOn(executableAd['_tokenService'], 'refreshTokenTokenExpirationStatus').mockReturnValue(
                    TokenExpirationStatus.VALID
                );
                jest.spyOn(executableAd['_tokenService'], 'accessTokenTokenExpirationStatus')
                    .mockReturnValueOnce(TokenExpirationStatus.EXPIRED)
                    .mockReturnValueOnce(TokenExpirationStatus.VALID);
                jest.spyOn(loginService, 'refreshToken');
                jest.spyOn(loginService, '_setKillSwitch');
                killSwitchResponseMock.data.timeToNextEngagement = 1;
                setMockedResponse(401, killSwitchResponseMock);

                executableAd.executableAdEventListener = (_adEvent: AdEvent) => {
                    expect(_adEvent.type).toBe('Error');
                    expect(_adEvent['error'].errorCode).toBe('9000');
                    expect(executableAd.currentState).toEqual('STATE_ERROR');
                    expect(loginService.refreshToken).toBeCalled();
                    expect(loginService['_setKillSwitch']).toBeCalled();

                    // getExecutableAd should return dummy
                    const newExecutableAd = sdk.getExecutableAd(opportunityInfo);
                    expect(newExecutableAd).toBeInstanceOf(DummyExecutableAd);
                    done();
                };

                executableAd.initAd(el, initAdinfo);
            };
        });

        it('refresh token failed with kill switch error, when get ad after kill switch expired return real executable ad', (done) => {
            setMockedResponse(200, loginResponseMock);
            sdk.initialize(apiKey, configMap);
            sdk.xaafInitListener = (xaafEvent) => {
                expect(xaafEvent).toEqual({ type: XaafEventType.SUCCESS });
                let executableAd = sdk.getExecutableAd(opportunityInfo);
                expect(executableAd).toBeInstanceOf(ExecutableAd);
                expect(executableAd).not.toBeInstanceOf(DummyExecutableAd);
                jest.spyOn(executableAd['_tokenService'], 'refreshTokenTokenExpirationStatus').mockReturnValue(
                    TokenExpirationStatus.VALID
                );
                jest.spyOn(executableAd['_tokenService'], 'accessTokenTokenExpirationStatus')
                    .mockReturnValueOnce(TokenExpirationStatus.EXPIRED)
                    .mockReturnValueOnce(TokenExpirationStatus.VALID);
                jest.spyOn(loginService, 'refreshToken');
                jest.spyOn(loginService, '_setKillSwitch');
                killSwitchResponseMock.data.timeToNextEngagement = 0.01;
                setMockedResponse(401, killSwitchResponseMock);
                executableAd.initAd(el, initAdinfo);
                executableAd.executableAdEventListener = () => {
                    expect(executableAd.currentState).toEqual('STATE_ERROR');
                    expect(loginService.refreshToken).toBeCalled();
                    expect(loginService['_setKillSwitch']).toBeCalled();
                    setTimeout(() => {
                        executableAd = sdk.getExecutableAd(opportunityInfo);
                        expect(executableAd).not.toBeInstanceOf(DummyExecutableAd);
                        done();
                    }, 1000);
                };
            };
        });
    });

    describe('xaaf sdk - isXaafAvailable tests', () => {
        it('init successful login, isXaafAvailable = true', (done) => {
            setMockedResponse(200, loginResponseMock);
            // @ts-ignore
            sdk._loginService._featureFlagsService.isFlagEnabled = jest.fn((_flagName, _defaultValue) => true);
            sdk.xaafInitListener = (xaafEvent) => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                // @ts-ignore
                expect(sdk._configService._config.tokenData).toEqual(tokenData);
                expect(xaafEvent).toEqual({ type: XaafEventType.SUCCESS });
                expect(executableAd).toBeInstanceOf(ExecutableAd);
                expect(executableAd).not.toBeInstanceOf(DummyExecutableAd);
                done();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('test xaaf js sdk - init - login succeed, rollout isXaafEnabled false, isXaafAvailable = false', (done) => {
            setMockedResponse(200, loginResponseMock);
            // @ts-ignore
            sdk._loginService._featureFlagsService.isFlagEnabled = jest.fn((_flagName, _defaultValue) => false);
            sdk.xaafInitListener = (xaafEvent) => {
                const executableAd = sdk.getExecutableAd(opportunityInfo);
                expect(xaafEvent).toEqual({ type: XaafEventType.SUCCESS });
                // @ts-ignore
                expect(sdk._configService._config.loginRes).toEqual(loginResponseMock);
                // @ts-ignore
                expect(sdk._configService._config.tokenData).toEqual(tokenData);
                expect(executableAd).toBeInstanceOf(DummyExecutableAd);
                done();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('rollout isXaafEnabled = true, isXaafAvailable = false', async () => {
            setMockedErrorResponse('Error fetch login response');
            ConfigService.getInstance()['_config'] = {};

            await new Promise<XaafEvent>((resolve) => {
                sdk.xaafInitListener = resolve;
                sdk.initialize(apiKey, configMap);
            });

            const executableAd = sdk.getExecutableAd(opportunityInfo);
            expect(sdk['_configService']['_config'].loginRes).toEqual(undefined);
            expect(executableAd).toBeInstanceOf(ExecutableAd);
        });

        it('init sdk with wrong api key alg (HS256)', (done) => {
            apiKey =
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJlbnZpcm9ubWVudCI6InRsdi1hZHZlcnRpc2UtMDAwMCJ9.xufPaSDuDVABQJ9s7DzYGsTcdgNsLgk2NeYcAP5iRms';
            sdk.xaafInitListener = (xaafEvent) => {
                expect(xaafEvent.type).toEqual(XaafEventType.FAILURE);
                expect(xaafEvent.error).toBeDefined();
                expect(xaafEvent.error.errorSubDomain).toEqual(ErrorSubDomain.Auth);
                expect(xaafEvent.error.errorCode).toEqual(ErrorCode.KeyError);
                expect(xaafEvent.error.comment).toMatch('');
                done();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('init sdk with invalid api key', (done) => {
            apiKey = 'asasfasfafs';
            // @ts-ignore
            const spyOnFunctionnotifyError = jest.spyOn(sdk, '_handleErrorEvent');
            sdk.xaafInitListener = (_adEvent) => {
                expect(spyOnFunctionnotifyError).toHaveBeenCalled();
                done();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('init sdk with invalid api key - report', (done) => {
            apiKey = 'asasfasfafs';
            const _configMap = new Map([['deviceUUID', 'MockedDeviceUUID']]);
            const reportServiceDelegate = {
                init: (intervalInMilliseconds, bulkSize, bulkFFEnable) => undefined,
                isInitialized: () => true,
                putInReportQueue: async (report) => {
                    // Ensure a report has been stored and that it contains identifying data (ADVERTISE-8280)
                    expect(report['deviceUUID']).toEqual('MockedDeviceUUID');
                    done();
                    return true;
                }
            };
            Core.InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, reportServiceDelegate);
            sdk.initialize(apiKey, _configMap);
        });

        it(
            'test xaaf js sdk - init - login succeed, call to reportServiceDelegate.init twice: ' +
                'first with default values and second with configuration we got from login response',
            (done) => {
                const BULK_SIZE_BEFORE_LOGIN = 100;
                const BULK_DELAY_BEFORE_LOGIN = 180000;
                const BULK_SIZE_FROM_LOGIN = 10;
                const BULK_DELAY_FROM_LOGIN = 60000;

                const loginResponse = JSON.parse(JSON.stringify(loginResponseMock));
                loginResponse.configuration.reporting_bulk = BULK_SIZE_FROM_LOGIN;
                loginResponse.configuration.reporting_bulk_delay = BULK_DELAY_FROM_LOGIN;
                setMockedResponse(200, loginResponse);
                // @ts-ignore
                sdk._loginService._featureFlagsService.isFlagEnabled = jest.fn(
                    (_flagName, _defaultValue) => _flagName === 'reportInBulksEnabled'
                );
                let firstInit = true;
                const reportServiceDelegate = {
                    // expect call to init twice before and after login.
                    // in second call, bulk configuration come from login response
                    init: (intervalInMilliseconds, bulkSize) => {
                        if (firstInit) {
                            // original configuration
                            expect(bulkSize).toEqual(BULK_SIZE_BEFORE_LOGIN);
                            expect(intervalInMilliseconds).toEqual(BULK_DELAY_BEFORE_LOGIN);
                            firstInit = false;
                        } else {
                            // configuration from login response
                            expect(intervalInMilliseconds).toEqual(BULK_DELAY_FROM_LOGIN);
                            expect(bulkSize).toEqual(BULK_SIZE_FROM_LOGIN);
                            done();
                        }
                    },
                    isInitialized: () => true,
                    putInReportQueue: async (_) => true
                };
                Core.InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, reportServiceDelegate);
                sdk.initialize(apiKey, configMap);
            }
        );

        it('init sdk with invalid api key and then succeed on login - report', (done) => {
            const invalidApiKey =
                'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.IEtk2ESbme76dfcj1nERZqM_Vt_GERGqgF1joqqMnrEBOffZ9tP3chSdD5SWmRfCdiiVEWYK4GLqwEVey5DTYYy7fqGr9noTQq2A-dUK4QdYLOGymlG2H4jDwveK4cb4B0Kjfhjn1uqLO3DucSM94FskuGTT8hdVK-Uhij1WcSTWPkkJtso_VTQx4ssjBxVJdbpoJ5WNZqZzv2V0qR2oY5-_vGMuQ0k4_GAiB2uKcVP-Hn6nvWlsfWhHo_7-zuAG-07XQ2OMx8iBfYFKZukUnnSTrAI8_vZPtrDKjEoApK-Vq_SW_Ij4Qxr9GnEsv2nh0Z6O3eYy90IeSBA7BXipjQ';
            const _configMap = new Map([['deviceUUID', 'MockedDeviceUUID']]);
            const spyOnReportService = jest.spyOn(ReportService.getInstance(), 'report');

            sdk.xaafInitListener = async (_xaafEvent: XaafEvent) => {
                expect(_xaafEvent.type).toEqual(XaafEventType.FAILURE);
                const errorReportObj = {
                    errorCode: '5000-1',
                    errorSubDomain: 'AUTH'
                };

                expect(spyOnReportService).toHaveBeenNthCalledWith(
                    1,
                    Core.ReportType.Error,
                    expect.objectContaining(errorReportObj)
                );

                sdk.xaafInitListener = async (_xaafEvent2: XaafEvent) => {
                    expect(_xaafEvent2.type).toEqual(XaafEventType.SUCCESS);
                    const loginReportObj = {
                        success: true,
                        isSilent: false,
                        mode: 'PRE_AUTH',
                        hostSdkInitParams: 'deviceUUID=MockedDeviceUUID'
                    };

                    expect(spyOnReportService).toHaveBeenNthCalledWith(
                        2,
                        Core.ReportType.Login,
                        expect.objectContaining(loginReportObj)
                    );
                    done();
                };

                setMockedResponse(200, loginResponseMock);
                sdk.initialize(apiKey, _configMap);
            };
            sdk.initialize(invalidApiKey, _configMap);
        });

        it('init sdk with empty api key', (done) => {
            apiKey = '';
            // @ts-ignore
            const spyOnFunctionnotifyError = jest.spyOn(sdk, '_handleErrorEvent');
            sdk.xaafInitListener = (_adEvent) => {
                expect(spyOnFunctionnotifyError).toHaveBeenCalled();
                done();
            };
            sdk.initialize(apiKey, configMap);
        });

        it('init sdk with unknown environment', (done) => {
            apiKey =
                'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkNzQ5ZWNkMWMxYTZlMDAxOWVlNDRhYiIsImFwcElkIjoiNWQ3NDllY2ZmMGQ2NjIwMDE5NjUzMWI5IiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImFuZHJvaWR0diIsImVudmlyb25tZW50IjoidGx2LXBlcmZvcm1hbmNlIiwiaWF0IjoxNTY3OTIzOTIwLCJpc3MiOiJBVCZUIiwic3ViIjoiQXBpS2V5In0.Jm7jvK049AFErNOugkmnWOy0NCG3KQH5bN8h_RwSkesmfDsN0-q4y7wq0AvxSFrruHiKcOVJUf5bBvqSLSLHp-fP7x6370Ob0yV_evSiuxsv0DxfSHle2JHkYapyL4--zj8oi_orTJJsscZFieJNY1_lsU84VNCkWzduP86ZaNQ_YueI7wvFzmiE2Vhb5gwsvSvTGeU8mG8DVhSspchuyT6gXGU9MRzLZEQP94sYRXmGpUVv2kgj76WARHmU2IEYpoXdK5NOnIv_g9F8vz6WKGaQIf8o_ad-kwc2fXC0MnbqUUQxoqweVmvHBCyjcp4vmYA9I2j0rMpNzT0NGxeRYg';
            // @ts-ignore
            const spyOnFunctionnotifyError = jest.spyOn(sdk, '_handleErrorEvent');
            sdk.xaafInitListener = (_adEvent) => {
                expect(spyOnFunctionnotifyError).toHaveBeenCalled();
                done();
            };
            sdk.initialize(apiKey, configMap);
        });
    });

    function addListenerToExecutableAdToCheckForState(executableAd: ExecutableAd, expectedState: string): void {
        executableAd.executableAdEventListener = (_adEvent) => {
            expect(executableAd.currentState).toEqual(expectedState);
        };
    }
});
