/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-var-requires */
import { setMockedResponse, resetMocks } from '../mock/mock';
import * as Core from '@xaaf/common';
import { LoginResponse, ContainerDef, InjectionContainer, Xip } from '@xaaf/common';
import {
    ConfigService,
    FeatureFlagsService,
    DateTimeService,
    ReportService,
    AppConfig,
    RestApiService
} from '../services';
import { ExecutableAd } from './executable-ad';
import { ElementMock, RendererMock, XaafAdContainerMock } from '../mock/models';
import { OpportunityType } from './opportunity';
import { State } from '../fsm/state';
import { LoginService } from '../services/login-service/login-service';
import { AttributeNames } from './attributes/attributes';
import { MockDateTimeService } from '../mock/services';
import { XaafElement } from './elements';
import { OpportunityInfo } from '../xaaf-js-sdk';
import { CommandsDataStructuresCreator } from './structures/commands-data-structures-creator';

let executableAd: ExecutableAd;
let loginService: LoginService;

describe('ExecutableAd - Delay Engagement', () => {
    let configService: ConfigService;
    beforeEach(() => {
        resetMocks();
        // Set up config service with mock data
        const login: LoginResponse = require('../mock/expectations/Login-200.json');
        loginService = LoginService.getInstance();
        const appConfig: AppConfig = {
            apiKey: login.token,
            sdkArguments: new Map([['foo', 'bar']]),
            loginRes: login,
            tokenData: {
                tenantId: 'string',
                tenantName: 'string',
                appId: 'string',
                platformName: 'string',
                sdkVersion: 'string',
                sdkName: 'string',
                enabled: true,
                host: 'string',
                privilegeType: 'string',
                environment: 'string',
                apiKeyIat: 0,
                iat: 0,
                exp: 0,
                iss: 'string',
                sub: 'string'
            }
        };
        configService = InjectionContainer.resolve<ConfigService>(ContainerDef.configService);
        configService.update(appConfig);

        executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });
    });

    afterEach(() => {
        if (executableAd) {
            executableAd.executableAdEventListener = null;
        }
    });

    describe('Delay Engagement', () => {
        const SECOND = 1000;
        const HALF_SECOND = SECOND / 2;

        let login: LoginResponse;
        let opportunity: Xip;
        let el: XaafElement;
        let executableAd: ExecutableAd; // NOSONAR (false positive, this is not a duplicate declaration)

        let feautreFlagService: FeatureFlagsService;
        let dateTimeService: DateTimeService;

        function setConfigServiceWithPreAdStartEngageTime(preAdStartEngageTime: number): void {
            configService.update({
                loginRes: {
                    ...login,
                    configuration: {
                        ...login.configuration,
                        pre_ad_start_xaaba_engage_time: preAdStartEngageTime
                    }
                }
            });
        }

        function getInitAdinfoWithDelayHint(delayHint: string): Map<string, string> {
            return new Map<string, string>([['adStartDelayHint', delayHint]]);
        }

        beforeEach(() => {
            Core.InjectionContainer.registerSingleton(Core.ContainerDef.dateTimeService, MockDateTimeService);

            loginService.isLoggedIn = true;
            feautreFlagService = FeatureFlagsService.getInstance();
            dateTimeService = Core.InjectionContainer.resolve<DateTimeService>(Core.ContainerDef.dateTimeService);

            el = new ElementMock();
            login = require('../mock/expectations/Login-200.json');
            opportunity = require('../mock/expectations/SHOW_VIDEO.json');

            const opportunityInfo: OpportunityInfo = {
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            };

            executableAd = new ExecutableAd(opportunityInfo);
        });
        it('state moves to Loaded when 2 commands send handled', () => {
            const initAdinfo = setIsLoggedInAndMockResponse('../mock/expectations/SHOW_VIDEO_COMMANDS.json');
            jest.spyOn(loginService, 'isXaafAvailable', 'get').mockReturnValue(true);
            const executableAd = new ExecutableAd({ // NOSONAR (false positive, this is not a duplicate declaration)
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            const commandsDataStructuresCreator = InjectionContainer.resolve<CommandsDataStructuresCreator>(
                ContainerDef.commandsDataStructuresCreator
            );
            commandsDataStructuresCreator['_commandFactory'] = new RendererMock();

            // @ts-ignore
            const spyOnMoveToNextStateFunc = jest.spyOn(executableAd, '_moveToNextState');
            executableAd.initAd(new XaafAdContainerMock(), initAdinfo);
            expect.assertions(2);
            executableAd.executableAdEventListener = () => {
                expect(executableAd.currentState).toEqual(State.STATE_LOADED);
                expect(spyOnMoveToNextStateFunc).toHaveBeenCalled();
            };
        });
        it('state moves to Loaded when 0 commands exist', (done) => {
            const initAdinfo = setIsLoggedInAndMockResponse('../mock/expectations/EMPTY_COMMAND.json');
            jest.spyOn(loginService, 'isXaafAvailable', 'get').mockReturnValue(true);
            const executableAd = new ExecutableAd({ // NOSONAR (false positive, this is not a duplicate declaration)
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            // @ts-ignore
            const spyOnMoveToNextStateFunc = jest.spyOn(executableAd, '_moveToNextState');
            executableAd.initAd(new XaafAdContainerMock(), initAdinfo);
            executableAd.executableAdEventListener = () => {
                expect(executableAd.currentState).toEqual(State.STATE_LOADED);
                expect(spyOnMoveToNextStateFunc).toHaveBeenCalled();
                done();
            };
        });

        it('initAd method: on valid delay calculation, ad initialization should be called after calculated delay', async () => {
            const preAdStartEngageTime = HALF_SECOND;
            const hint = 2.5 * SECOND;
            const expectedDelay = hint - preAdStartEngageTime;
            const initAdinfo = getInitAdinfoWithDelayHint(`${hint}`);
            setMockedResponse(200, opportunity);
            setConfigServiceWithPreAdStartEngageTime(preAdStartEngageTime);
            jest.spyOn(feautreFlagService, 'adStartHintEnabled', 'get').mockReturnValue(true);
            jest.spyOn(dateTimeService, 'delay').mockImplementation((delayMS) => Promise.resolve(delayMS));
            addListenerToExecutableAdToCheckForState(State.STATE_LOADED);
            executableAd.initAd(el, initAdinfo);
            expect(dateTimeService.delay).toHaveBeenCalledWith(expectedDelay);
        });

        it('initAd method: on invalid delay calculation, ad initialization should be called immediately', async () => {
            const preAdStartEngageTime = 3.5 * SECOND;
            const hint = 2.5 * SECOND;
            const expectedDelay = 0;
            const initAdinfo = getInitAdinfoWithDelayHint(`${hint}`);
            setMockedResponse(200, opportunity);
            setConfigServiceWithPreAdStartEngageTime(preAdStartEngageTime);
            jest.spyOn(feautreFlagService, 'adStartHintEnabled', 'get').mockReturnValue(true);
            jest.spyOn(dateTimeService, 'delay').mockImplementation((delayMS) => Promise.resolve(delayMS));
            addListenerToExecutableAdToCheckForState(State.STATE_LOADED);
            executableAd.initAd(el, initAdinfo);

            expect(dateTimeService.delay).toHaveBeenCalledWith(expectedDelay);
        });

        it('initAd method: on delay engagement feature flag not enabled, ad initialization should be called immediately', async () => {
            const preAdStartEngageTime = HALF_SECOND;
            const hint = 2.5 * SECOND;
            const initAdinfo = getInitAdinfoWithDelayHint(`${hint}`);
            setMockedResponse(200, opportunity);
            setConfigServiceWithPreAdStartEngageTime(preAdStartEngageTime);
            jest.spyOn(feautreFlagService, 'adStartHintEnabled', 'get').mockReturnValue(false);
            jest.spyOn(dateTimeService, 'delay');

            addListenerToExecutableAdToCheckForState(State.STATE_LOADED);
            executableAd.initAd(el, initAdinfo);
            expect(dateTimeService.delay).toHaveBeenCalledTimes(0);
        });
    });

    describe('resiliency functions', () => {
        it('refresh token fails with 500 error, resiliency is triggered', async () => {
            setMockedResponse(500, {
                errorCode: '500-9000',
                data: 'General Error',
                name: 'GeneralError',
                message: 'General Error'
            });

            loginService['_handleRefreshTokenResiliency'] = jest.fn();

            try {
                await loginService.refreshToken(false);
            } catch (error) {
                //
            }
            expect(loginService['_handleRefreshTokenResiliency']).toBeCalled();
        });

        it('refresh token fails with 429 error, resiliency is triggered', async () => {
            setMockedResponse(429, null);
            loginService['_handleRefreshTokenResiliency'] = jest.fn();
            expect.assertions(1);
            try {
                await loginService.refreshToken(false);
            } catch (error) {
                //
            }
            expect(loginService['_handleRefreshTokenResiliency']).toBeCalled();
        });

        it('init ad fails with 500 error, _handleError is triggered', () => {
            const errorRes = {
                errorCode: '500-9000',
                data: 'General Error',
                name: 'GeneralError',
                message: 'General Error'
            };
            executableAd['_getAndParseOpportunity'] = jest.fn(() => {
                throw errorRes;
            });
            executableAd['_handleError'] = jest.fn();
            executableAd['_tryGetAndParseOpportunity']();

            expect(executableAd['_handleError']).toBeCalledWith(errorRes);
        });

        it('init ad fails with 500 error, resiliency is triggered', () => {
            const errorRes = {
                errorCode: '500-9000',
                data: 'General Error',
                name: 'GeneralError',
                message: 'General Error'
            };
            executableAd['_getAndParseOpportunity'] = jest.fn(() => {
                throw errorRes;
            });
            executableAd['_retryGetAndParseOpportunity'] = jest.fn();
            executableAd['_tryGetAndParseOpportunity']();
            expect(executableAd['_retryGetAndParseOpportunity']).toBeCalled();
        });

        it('tests that error report is sent on empty commands', async () => {
            const opportunity: Xip = require('../mock/expectations/BROKEN_XIP.json');
            jest.spyOn(RestApiService.getInstance(), 'getOpportunity').mockImplementation(async () => opportunity);
            const reportMock = jest.spyOn(ReportService.getInstance(), 'reportError');

            await executableAd['_getAndParseOpportunity']();

            expect(reportMock).toBeCalled();
        });
    });
});

function then_executableAdStateIs(state: string): void {
    expect(executableAd.getAttribute(AttributeNames.STATE)).toBe(state);
}
function setIsLoggedInAndMockResponse(url: string): Map<string, string> {
    loginService.isLoggedIn = true;
    const initAdinfo = new Map<string, string>([['foo', 'bar']]);
    const opportunity = require(url);
    setMockedResponse(200, opportunity);
    return initAdinfo;
}

function addListenerToExecutableAdToCheckForState(expectedState: string, done?: any): void {
    executableAd.executableAdEventListener = () => {
        then_executableAdStateIs(expectedState);
        if (done) {
            done();
        }
    };
}
