/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    resetMockedResponseWithIntervals,
    setMockedResponse,
    setMockedResponseWithIntervals,
    resetMocks
} from '../../mock/mock';
import {
    _retryFunctionUntilSucceeds,
    backOff,
    BackOffAbort,
    retryLoginUntilSucceeds,
    retryRefreshTokenUntilSucceeds
} from './resiliency-functions';
import { AppConfig, ConfigService, FeatureFlagsService, ReportServiceDelegate } from '..';
import * as Core from '@xaaf/common';

describe('resiliency-functions tests', () => {
    let _args;
    let _apiKey;
    let _tokenData;
    class mockedDelegate implements ReportServiceDelegate {
        init(intervalInMilliseconds, bulkSize, bulkFFEnable): void {}
        isInitialized(): boolean {
            return true;
        }

        async putInReportQueue(report): Promise<boolean> {
            return true;
        }
    }
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

    describe('resiliency functions', () => {
        beforeAll(() => {
            FeatureFlagsService.getInstance().isFlagEnabled = jest.fn(() => true);
        });
        it('after several retries, functions resolves promise when the poll succeeds', async () => {
            let retry = 0;

            const taskFn = jest.fn(
                () =>
                    new Promise<string>((resolve, reject) => {
                        if (++retry < 5) {
                            reject('fail');
                        } else {
                            resolve('success');
                        }
                    })
            );

            const intervals = [0, 0, 0, 0, 0];

            expect.assertions(1);
            try {
                const result: Core.HttpResponse<unknown> = await _retryFunctionUntilSucceeds(taskFn, false, intervals);
                expect(result).toBe('success');
            } catch (error) {
                fail(error);
            }
        });

        it('resolves the retry promise when the poll succeeds', async () => {
            Core.InjectionContainer.registerInstance(Core.ContainerDef.reportServiceDelegate, new mockedDelegate());
            setMockedResponse(200, {
                token: 'foo',
                configuration: {}
            });

            try {
                const result: Core.HttpResponse<any> = await retryRefreshTokenUntilSucceeds(false);
                expect(result.status).toBe(200);
                expect(result.body.token).toBe('foo');
            } catch (error) {
                fail(error);
            }
            expect.assertions(2);
        });

        it('after one retry of 500 error, backoff mechanism should abort', async () => {
            Core.InjectionContainer.registerInstance(Core.ContainerDef.reportServiceDelegate, new mockedDelegate());
            const errorResponse: Core.HttpResponse<any> = {
                status: 500,
                body: {
                    message: 'Error',
                    name: 'Error',
                    errorCode: '500-1',
                    data: 'Error Error'
                }
            };
            const goodResponse: Core.HttpResponse<any> = {
                status: 200,
                body: {
                    token: 'foo',
                    configuration: {}
                }
            };
            const responses = [errorResponse, errorResponse, errorResponse, goodResponse];
            setMockedResponseWithIntervals(responses);
            const intervals = [0, 0, 0, 0, 0];

            expect.assertions(1);
            try {
                await retryRefreshTokenUntilSucceeds(false, intervals);
            } catch (error) {
                expect(error[0]).toBe(BackOffAbort);
            }
        });

        it('after several retries of 5xx error, resolves the retry promise when the poll succeeds', async () => {
            Core.InjectionContainer.registerInstance(Core.ContainerDef.reportServiceDelegate, new mockedDelegate());
            const errorResponse: Core.HttpResponse<any> = {
                status: 503,
                body: {
                    message: 'Error',
                    name: 'Error',
                    errorCode: '503',
                    data: 'Error Error'
                }
            };
            const goodResponse: Core.HttpResponse<any> = {
                status: 200,
                body: {
                    token: 'foo',
                    configuration: {}
                }
            };
            const responses = [errorResponse, errorResponse, errorResponse, goodResponse];
            setMockedResponseWithIntervals(responses);
            const intervals = [0, 0, 0, 0, 0];

            expect.assertions(2);
            try {
                const result: Core.HttpResponse<any> = await retryRefreshTokenUntilSucceeds(false, intervals);
                expect(result.status).toBe(200);
                expect(result.body.token).toBe('foo');
            } catch (error) {
                fail(error);
            }
        });

        it('after several retries of 5xx error, resolves the login promise when the poll succeeds', async () => {
            Core.InjectionContainer.registerInstance(Core.ContainerDef.reportServiceDelegate, new mockedDelegate());
            const errorResponse: Core.HttpResponse<any> = {
                status: 503,
                body: {
                    message: 'Error',
                    name: 'Error',
                    errorCode: '503',
                    data: 'Error Error'
                }
            };
            const goodResponse: Core.HttpResponse<any> = {
                status: 200,
                body: {
                    token: 'foo',
                    configuration: {}
                }
            };
            const responses = [errorResponse, errorResponse, errorResponse, goodResponse];
            setMockedResponseWithIntervals(responses);
            const intervals = [0, 0, 0, 0, 0];

            expect.assertions(2);
            try {
                const result: Core.HttpResponse<any> = await retryLoginUntilSucceeds(false, intervals);
                expect(result.status).toBe(200);
                expect(result.body.token).toBe('foo');
            } catch (error) {
                fail(error);
            }
        });

        it('after max retries of 5xx error, rejects with rejections array', async () => {
            Core.InjectionContainer.registerInstance(Core.ContainerDef.reportServiceDelegate, new mockedDelegate());
            const failureMessage = 'foo';
            const errorResponse: Core.HttpResponse<any> = {
                status: 503,
                body: {
                    message: failureMessage,
                    name: 'Error',
                    errorCode: '503',
                    data: 'Error Error'
                }
            };
            const responses = [errorResponse, errorResponse, errorResponse, errorResponse, errorResponse];
            setMockedResponseWithIntervals(responses);
            const intervals = [0, 0, 0, 0, 0];

            try {
                await retryLoginUntilSucceeds(false, intervals);
            } catch (error) {
                error.forEach((rejection) => expect(rejection).toBe(failureMessage));
            }

            expect.assertions(intervals.length);
        });
    });

    describe('timeout helper functions', () => {
        beforeEach(() => {
            _apiKey =
                'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2LXlvdWkiLCJzZGtWZXJzaW9uIjoidjEiLCJzZGtOYW1lIjoianMtc2RrLXlvdWkiLCJlbmFibGVkIjp0cnVlLCJob3N0IjoiaHR0cHM6Ly94YWFmLWFpby50bHYtZGV2b3BzLmNvbS9hZHZlcnRpc2UtNTk4OCIsInByaXZpbGVnZVR5cGUiOiJ0ZXN0ZXIiLCJlbnZpcm9ubWVudCI6InRsdi1hZHZlcnRpc2UtNTk4OCIsImlhdCI6MTU4NDk2Nzk2MiwiaXNzIjoiQVQmVCIsInN1YiI6IkFwaUtleSJ9.ET_rX844PgrmOSIe0VdhGSMBRbSVybjT_0O22LK5wjDIqDVz4fwRR3594koog3eyYNZo0soCFhRGuWM5jImJHtHO5cdzL0uguADJugA7b9Oy6qnc3zYrvAHNe5N7GJ1mT36ZbpF5IQpflyVB1EfzxlSNIfcgMzk0G-m_bIXuH3Wfjd5_NhvcZl-Ol8Y-3Au1nsPOPmSaaBR55uWavVmqGLerpvA4B_CShp1tY8tDk56mp9ED5nfutC4gMSP7Q_Aqa0jNwT38xpHXQRJUUlbCZr5FDhkjuTPEJ-a_EpMdKKB9b4UIIUlx7B5xuaz5pkHbq-n5fxf6TOUzgFX21GDzjQ';
            _tokenData = {
                tenantId: '5e6f42fefc8159001bb219f0',
                appId: '5e6f42fffc8159001bb219f2',
                platformName: 'firetv-youi',
                sdkVersion: 'v1',
                sdkName: 'js-sdk-youi',
                enabled: true,
                host: 'https://xaaf-be-aio.att.com/advertise-5988',
                privilegeType: 'tester',
                environment: 'tlv-advertise-5988',
                iat: 1584967962,
                iss: 'AT&T',
                sub: 'ApiKey'
            };
            _args = new Map([
                ['platform', 'dfw'],
                ['deviceType', 'tvos'],
                ['deviceAdId', 'aaec17dc-ec32-517b-8f34-074db4c9f5d5'],
                ['userAdvrId', 'HvV2D2av62BzmeVW1QLhqw=='],
                ['fwSUSSId', 'HvV2D2av62BzmeVW1QLhqw=='],
                ['householdId', 'HvV2D2av62BzmeVW1QLhqw=='],
                ['deviceAdvrId', '198e6038-1ef7-45b0-99c0-81fac6348b2e'],
                ['userType', '2'],
                ['deviceFWAdId', '7112e70355377c66a6bec1b723cd5588e88315a311756bc5bf15d7291f3b9a8b'],
                ['tenantName', 'directv'],
                ['appName', 'ov'],
                ['appVersion', '3.0.21105.01005'],
                ['sdkName', 'js-sdk-youi'],
                ['platformAdvId', 'fbc97ab6-e3d9-49bb-9c1b-7c29596b285c'],
                ['deviceId', 'goldfish_x86'],
                ['device', 'Android SDK built for x86'],
                ['deviceModel', 'Android SDK built for x86'],
                ['deviceManufacturer', 'Google'],
                ['osName', 'android'],
                ['osVersion', '9'],
                ['platformName', 'youi-android'],
                ['deviceUUID', '15b7d90f-1f17-4234-9f99-a26b5c312573'],
                ['xaafAdvId', '1234567'],
                ['sdkVersion', '1.0.20'],
                ['tenantSystemName', 'directv']
                // ['timeout', '2000']
            ]);
        });
    });
});

describe('polling service tests', () => {
    it('BackOffMechanism returns a promise', () => {
        const poller = backOff({
            taskFn: () => Promise.resolve('foo')
        });
        expect(poller.then).toBeDefined();
        expect(typeof poller.then).toBe('function');
    });

    it('resolves the master promise when the poll succeeds', (done) => {
        backOff({
            taskFn: () => Promise.resolve('foo'),
            retries: 3
        }).then(
            (result) => {
                expect(result).toBe('foo');
                done();
            },
            () => fail('Master promise was rejected')
        );
    });

    it('wraps a non-promise task function return in Promise.resolve', (done) => {
        backOff({
            taskFn: () => Promise.resolve('foobar'),
            retries: 3
        }).then((val) => {
            expect(val).toEqual('foobar');
            done();
        });
    });

    it('fails the poll if an exception is thrown in the task function', (done) => {
        backOff({
            taskFn: () => {
                throw new Error('oops');
            },
            retries: 3
        }).then(null, (error) => {
            expect(error.message).toBe('oops');
            done();
        });
    });

    it('rejects the master promise if the task promise rejects with the abort token', (done) => {
        let counter = 0;
        const taskFn = (): Promise<never> => {
            if (++counter === 1) {
                return Promise.reject(BackOffAbort);
            } else {
                return Promise.reject('bar');
            }
        };

        backOff({
            taskFn,
            retries: 3
        }).then(fail, (error) => {
            expect(error).toEqual([BackOffAbort]);
            expect(counter).toEqual(1);
            done();
        });
    });
});
