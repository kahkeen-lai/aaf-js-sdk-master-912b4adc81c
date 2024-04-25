/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import { LoginResponse, ReportType, AdEvent, AdEventType } from '@xaaf/common';
import * as Core from '@xaaf/common';
import { setMockedBadResponse, setMockedResponse, resetMocks } from '../mock/mock';
import { ExecutableAd } from './executable-ad';
import { ConfigService, AppConfig } from '../services/config-service/config-service';
import { ElementMock, XaafAdContainerMock } from '../mock/models';
import { OpportunityType } from './opportunity';
import { State, StateType } from '../fsm/state';
import { LoginService } from '../services/login-service/login-service';
import { AttributeNames } from './attributes/attributes';
import { ReportService } from '../services';
import { Trigger } from '../fsm/trigger';
import { XaafAdContainer, XaafVideoElement } from '..';

describe('ExectuableAd states tests', () => {
    let executableAd: ExecutableAd;

    beforeEach(() => {
        resetMocks();
        // setup config service with mock data
        const login: LoginResponse = require('../mock/expectations/Login-200.json');
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

        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, {
            isFlagEnabled: (_) => true,
            setup: (_) => Promise.resolve(),
            register: (_) => {},
            fetch: () => {}
        });

        const configService = ConfigService.getInstance();
        configService.update(appConfig);
    });
    afterEach(() => {
        if (executableAd) {
            executableAd.executableAdEventListener = null;
        }
    });

    describe('ExecutableAd.initAd() tests', () => {
        it('initAd() when bad response - should move to STOPPED state with xaaf not available', async () => {
            given_ExecutableAdDependenciesMockedBadResponse();
            addListenerToExecutableAdToCheckForState(State.STATE_ERROR);
            when_initAd_isExecutedOnExecutableAd();
            then_next_isExecutedOnFSM_withStates(State.STATE_ERROR);
        });

        it('initAd() when not logged in - should move to STOPPED state with xaaf not available', async () => {
            given_ExecutableAdInState_CREATED();
            LoginService.getInstance().isLoggedIn = false;
            addListenerToExecutableAdToCheckForState(State.STATE_STOPPED);
            when_initAd_isExecutedOnExecutableAd();
        });

        it('initAd() on ExecutableAd in CREATED state - should move to INITIATING state', async () => {
            given_ExecutableAdInState_CREATED();
            addListenerToExecutableAdToCheckForState(State.STATE_INITIATING);
            when_initAd_isExecutedOnExecutableAd();
            addListenerToExecutableAdToCheckForState(State.STATE_INITIATING);
            // then_next_isExecutedOnFSM_withStates(State.STATE_INITIATING);
        });

        it('initAd() on ExecutableAd in LOADED state - should stay in LOADED state', async () => {
            given_ExecutableAdInState_CREATED();
            addListenerToExecutableAdToCheckForState(State.STATE_LOADED);
            given_ExecutableAdInState_LOADED();
            when_initAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_INITIATING);
        });

        it('initAd() on ExecutableAd in PLAYING state - should stay in PLAYING state', async () => {
            await given_ExecutableAdInState_PLAYING();
            addListenerToExecutableAdToCheckForState(State.STATE_PLAYING);

            when_initAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_INITIATING);
        });

        // Note: this is a TEMPORARY test only, to test avoiding performing
        // initialization when it shouldn't be performed
        // Note: There's nothing more permanent than a temporary solution.
        it('initAd() on ExecutableAd in PLAYING state - should not perform ExecutableAd initialization', async (done) => {
            await given_ExecutableAdInState_PLAYING();
            executableAd.currentState = State.STATE_PLAYING;
            // @ts-ignore
            const spyOnFunctionTryGetAndParseOpportunity = jest.spyOn(executableAd, '_tryGetAndParseOpportunity');
            executableAd.executableAdEventListener = () => {
                expect(spyOnFunctionTryGetAndParseOpportunity).not.toHaveBeenCalled();
                done();
            };
            when_initAd_isExecutedOnExecutableAd();
        });

        it('initAd() on ExecutableAd in CREATED state - should perform ExecutableAd initialization', async (done) => {
            given_ExecutableAdInState_CREATED();
            executableAd.currentState = State.STATE_CREATED;
            // @ts-ignore
            const spyOnFunctionTryGetAndParseOpportunity = jest.spyOn(executableAd, '_tryGetAndParseOpportunity');
            executableAd.executableAdEventListener = () => {
                expect(spyOnFunctionTryGetAndParseOpportunity).toHaveBeenCalled();
                done();
            };
            when_initAd_isExecutedOnExecutableAd();
        });

        it('initAd() on ExecutableAd in STOPPED state - should stay in STOPPED state', async () => {
            given_ExecutableAdInState_STOPPED();
            addListenerToExecutableAdToCheckForState(State.STATE_STOPPED);
            when_initAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_INITIATING);
        });

        function when_initAd_isExecutedOnExecutableAd(): void {
            executableAd.initAd(null, new Map<string, string>());
        }
    });

    describe('ExectuableAd.startAd() tests', () => {
        it('startAd() on ExecutableAd in CREATED state - should stay in CREATED state', async () => {
            given_ExecutableAdInState_CREATED();

            when_startAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_STARTING);
            then_executableAdStateIs(State.STATE_CREATED);
        });

        it('startAd() on ExecutableAd in LOADED state - should move to PLAYING state', async () => {
            await given_ExecutableAdInState_LOADED();
            addListenerToExecutableAdToCheckForState(State.STATE_PLAYING);
            when_startAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_STARTING, State.STATE_STARTED);
        });

        it('startAd() on ExecutableAd in PLAYING state - should stay in PLAYING state', async () => {
            await given_ExecutableAdInState_PLAYING();
            addListenerToExecutableAdToCheckForState(State.STATE_PLAYING);
            when_startAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_INITIATING);
        });

        it('startAd() on ExecutableAd in STOPPED state - should stay in STOPPED state', async () => {
            given_ExecutableAdInState_STOPPED();

            when_startAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_INITIATING);
            then_executableAdStateIs(State.STATE_STOPPED);
        });

        function when_startAd_isExecutedOnExecutableAd(): void {
            executableAd.startAd(new ElementMock());
        }
    });

    describe('ExectuableAd.stopAd() tests', () => {
        it('stopAd() on ExecutableAd in CREATED state - should move to STOPPED state', async () => {
            given_ExecutableAdInState_CREATED();

            when_stopAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_STOPPING);
            then_executableAdStateIs(State.STATE_STOPPED);
        });

        it('stopAd() on ExecutableAd in LOADED state - should move to STOPPED state', async () => {
            await given_ExecutableAdInState_LOADED();

            when_stopAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_STOPPING);
            then_executableAdStateIs(State.STATE_STOPPED);
        });

        it('stopAd() on ExecutableAd in PLAYING state - should move to STOPPED state', async () => {
            await given_ExecutableAdInState_PLAYING();

            when_stopAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_STOPPING);
            then_executableAdStateIs(State.STATE_STOPPED);
        });

        it('stopAd() with interaction on ExecutableAd in PLAYING state - should move to INTERACTION state', async () => {
            await given_ExecutableAdInState_PLAYING();

            when_stopAd_with_interaction_isExecutedOnExecutableAd();
            then_next_isExecutedOnFSM_withStates(State.STATE_INTERACTION);
            then_executableAdStateIs(State.STATE_STOPPED);
        });

        it('stopAd() on ExecutableAd in STOPPED state - should stay in STOPPED state', async () => {
            given_ExecutableAdInState_STOPPED();

            when_stopAd_isExecutedOnExecutableAd();

            then_next_isExecutedOnFSM_withStates(State.STATE_STOPPING);
            then_executableAdStateIs(State.STATE_STOPPED);
        });

        function when_stopAd_isExecutedOnExecutableAd(): void {
            executableAd.stopAd();
        }

        function when_stopAd_with_interaction_isExecutedOnExecutableAd(): void {
            executableAd.stopAd('', true);
        }
    });

    describe('ExectuableAd _handleCurrentState and _moveToNextState tests', () => {
        it('_handleCurrentState with state STATE_INTERACTION should report AD_INTERACTION to NR', () => {
            given_ExecutableAdInState_STOPPEDWithInteraction();
            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            executableAd._handleCurrentState(State.STATE_INTERACTION);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdInteraction);
        });

        it('_handleCurrentState with state STATE_STOPPED should report AD_STOPPED to NR', () => {
            given_ExecutableAdInState_STOPPED();
            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            executableAd._handleCurrentState(State.STATE_STOPPED);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopped, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA'
            });
        });

        it('_moveToNextState with state STATE_INTERACTION call to fsm.next with state STATE_STOPPING', () => {
            given_ExecutableAdDependenciesMocked();
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            // @ts-ignore
            executableAd._moveToNextState(State.STATE_INTERACTION);
            expect(spyOnFunctionFsmNext).toBeCalledTimes(2);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPING);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPED);
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it('_moveToNextState with state STATE_STARTED should notify host and call to fsm.next with state STATE_PLAYING', () => {
            given_ExecutableAdDependenciesMocked();
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            executableAd._moveToNextState(State.STATE_STARTED);
            expect(spyOnFunctionFsmNext).toBeCalledTimes(1);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_PLAYING);
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
        });

        it('_moveToNextState with state STATE_STOPPED should notify host and stop FSM', (): void => {
            given_ExecutableAdDependenciesMocked();
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionStopFSM = jest.spyOn(executableAd, '_stopFSM');
            // @ts-ignore
            executableAd._moveToNextState(State.STATE_STOPPED);
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionStopFSM).toBeCalled();
        });
    });

    describe('Non-Interactive Ad Reporting', () => {
        const mockedXaafAdContainer = given_mockedXaafAdContainer();
        it('AD_STOPPING to NR with userInteracted executableAd.stopAd()', async () => {
            const opportunity = require('../mock/expectations/SHOW_IMAGE.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            executableAd.executeTriggeredCommands = jest.fn(() => {
                executableAd['_moveToNextState'](State.STATE_STARTED);
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);

            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            executableAd.stopAd();
            // @ts-ignore
            expect(spyOnFunctionFsmNext).toBeCalledTimes(2);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPING);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.HostAdStop);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopping, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA',
                interactiveAd: false,
                userInteracted: false
            });
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPED);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopped, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA'
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it(`AD_STOPPING to NR with userInteracted executableAd.stopAd('', false)`, async () => {
            const opportunity = require('../mock/expectations/SHOW_IMAGE.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            executableAd.executeTriggeredCommands = jest.fn(() => {
                executableAd['_moveToNextState'](State.STATE_STARTED);
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);

            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            executableAd.stopAd('', false);
            // @ts-ignore
            expect(spyOnFunctionFsmNext).toBeCalledTimes(2);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPING);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.HostAdStop);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopping, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA',
                interactiveAd: false,
                userInteracted: false
            });
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPED);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopped, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA'
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it(`AD_STOPPING to NR with userInteracted executableAd.stopAd('', true)`, async () => {
            const opportunity = require('../mock/expectations/SHOW_IMAGE.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);

            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            executableAd.stopAd('', true);
            // @ts-ignore
            expect(spyOnFunctionFsmNext).toBeCalledTimes(2);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPING);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.HostAdStop);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopping, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA',
                interactiveAd: false,
                userInteracted: false
            });
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPED);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopped, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA'
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it('AD_STOPPING to NR with STATE_ERROR after AD_PLAYING', async () => {
            const opportunity = require('../mock/expectations/SHOW_IMAGE.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });
            executableAd.executeTriggeredCommands = jest.fn(() => {
                executableAd['_moveToNextState'](State.STATE_STARTED);
            });

            executableAd.executableAdEventListener = (_adEvent: AdEvent) => {
                if (_adEvent.type === AdEventType.Loaded) {
                    executableAd.startAd(mockedXaafAdContainer);
                }
            };

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);
            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            executableAd['_failAd']('player error', {
                name: 'general error',
                message: 'sample ad general error'
            });

            expect(spyOnFunctionFsmNext).toBeCalledTimes(1);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdError, {
                didTryRecovery: 'NONE',
                errorCode: '9000',
                errorDesc: '9000: General. sample ad general error',
                errorDomain: 'EXAD',
                errorEndPoint: 'player error',
                errorSubDomain: 'XAABA',
                httpErrorCode: 'NP',
                isRecoverable: false,
                recoveryActionTaken: 'NONE',
                userInteracted: false,
                interactiveAd: false
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it('AD_STOPPING to NR with STATE_ERROR before AD_PLAYING', async () => {
            const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);
            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');

            executableAd['_failAd']('player error', {
                name: 'general error',
                message: 'sample ad general error'
            });

            expect(spyOnFunctionFsmNext).toBeCalledTimes(1);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdError, {
                didTryRecovery: 'NONE',
                errorCode: '9000',
                errorDesc: '9000: General. sample ad general error',
                errorDomain: 'EXAD',
                errorEndPoint: 'player error',
                errorSubDomain: 'XAABA',
                httpErrorCode: 'NP',
                isRecoverable: false,
                recoveryActionTaken: 'NONE',
                userInteracted: false,
                interactiveAd: false
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });
    });
    describe('Interactive Ad Reporting', () => {
        const mockedXaafAdContainer = given_mockedXaafAdContainer();
        it('AD_STOPPING to NR with userInteracted executableAd.stopAd()', async () => {
            const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });
            executableAd.executeTriggeredCommands = jest.fn(() => {
                executableAd['_moveToNextState'](State.STATE_STARTED);
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);

            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            executableAd.stopAd();
            // @ts-ignore
            expect(spyOnFunctionFsmNext).toBeCalledTimes(2);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPING);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.HostAdStop);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopping, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA',
                interactiveAd: true,
                userInteracted: false
            });
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPED);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopped, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA'
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it(`AD_STOPPING to NR with userInteracted executableAd.stopAd('', false)`, async () => {
            const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });
            executableAd.executeTriggeredCommands = jest.fn(() => {
                executableAd['_moveToNextState'](State.STATE_STARTED);
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);

            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            executableAd.stopAd('', false);
            // @ts-ignore
            expect(spyOnFunctionFsmNext).toBeCalledTimes(2);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPING);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.HostAdStop);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopping, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA',
                interactiveAd: true,
                userInteracted: false
            });
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPED);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopped, {
                reason: 'AD_STOPPED',
                hostStoppingReason: 'NA'
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it(`AD_STOPPING to NR with userInteracted executableAd.stopAd('', true)`, async () => {
            const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });
            executableAd.executeTriggeredCommands = jest.fn(() => {
                executableAd['_moveToNextState'](State.STATE_STARTED);
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);

            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');
            executableAd.stopAd('', true);
            // @ts-ignore
            expect(spyOnFunctionFsmNext).toBeCalledTimes(3);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_INTERACTION);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdInteraction);
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPING);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.HostAdStop);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopping, {
                reason: 'USER_INTERACTION',
                hostStoppingReason: 'NA',
                interactiveAd: true,
                userInteracted: true
            });
            expect(spyOnFunctionFsmNext).toBeCalledWith(Trigger.STATE_STOPPED);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdStopped, {
                reason: 'USER_INTERACTION',
                hostStoppingReason: 'NA'
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it('AD_STOPPING to NR with STATE_ERROR after AD_PLAYING', async () => {
            const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });
            executableAd.executeTriggeredCommands = jest.fn(() => {
                executableAd['_moveToNextState'](State.STATE_STARTED);
            });

            executableAd.executableAdEventListener = (_adEvent: AdEvent) => {
                if (_adEvent.type === AdEventType.Loaded) {
                    executableAd.startAd(mockedXaafAdContainer);
                }
            };

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);
            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');

            executableAd['_failAd']('player error', {
                name: 'general error',
                message: 'sample ad general error'
            });

            expect(spyOnFunctionFsmNext).toBeCalledTimes(1);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdError, {
                didTryRecovery: 'NONE',
                errorCode: '9000',
                errorDesc: '9000: General. sample ad general error',
                errorDomain: 'EXAD',
                errorEndPoint: 'player error',
                errorSubDomain: 'XAABA',
                httpErrorCode: 'NP',
                isRecoverable: false,
                recoveryActionTaken: 'NONE',
                userInteracted: false,
                interactiveAd: true
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });

        it('AD_STOPPING to NR with STATE_ERROR before AD_PLAYING', async () => {
            const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
            setMockedResponse(200, opportunity);
            // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);

            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            // ReportService dependency should be replaced with a mocked one,
            // although the default implementation is not initialized by default
            executableAd = new ExecutableAd({
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);
            const _reportService = ReportService.getInstance();
            const spyOnFunctionReport = jest.spyOn(_reportService, 'report');
            // @ts-ignore
            const spyOnFunctionNotify = jest.spyOn(executableAd, '_notify');
            // @ts-ignore
            const spyOnFunctionFsmNext = jest.spyOn(executableAd._fsm, 'next');
            // @ts-ignore
            const spyOnFunctionFsmStop = jest.spyOn(executableAd._fsm, 'stop');

            executableAd['_failAd']('player error', {
                name: 'general error',
                message: 'sample ad general error'
            });

            expect(spyOnFunctionFsmNext).toBeCalledTimes(1);
            expect(spyOnFunctionReport).toBeCalledWith(ReportType.AdError, {
                didTryRecovery: 'NONE',
                errorCode: '9000',
                errorDesc: '9000: General. sample ad general error',
                errorDomain: 'EXAD',
                errorEndPoint: 'player error',
                errorSubDomain: 'XAABA',
                httpErrorCode: 'NP',
                isRecoverable: false,
                recoveryActionTaken: 'NONE',
                userInteracted: false,
                interactiveAd: false
            });
            expect(spyOnFunctionNotify).toBeCalledTimes(1);
            expect(spyOnFunctionFsmStop).toBeCalledTimes(1);
        });
    });

    function given_ExecutableAdDependenciesMocked(): void {
        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);
        // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
        LoginService.getInstance().isLoggedIn = true;
        // ReportService dependency should be replaced with a mocked one,
        // although the default implementation is not initialized by default
        executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });
    }

    function given_ExecutableAdDependenciesMockedBadResponse(): void {
        setMockedBadResponse(500, new Error('bad'));

        // LoginService dependency should be replaced with a mocked one that returns false for isLoggedIn
        LoginService.getInstance().isLoggedIn = true;
        executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });
    }

    // given-when-then helper functions

    function given_ExecutableAdInState_CREATED(): void {
        given_ExecutableAdDependenciesMocked();
    }

    async function given_ExecutableAdInState_LOADED(): Promise<void> {
        given_ExecutableAdDependenciesMocked();
        executableAd.initAd(null, new Map<string, string>());
    }

    async function given_ExecutableAdInState_PLAYING(): Promise<void> {
        given_ExecutableAdDependenciesMocked();
        executableAd.initAd(null, new Map<string, string>());
        executableAd.startAd(null);
    }

    function given_ExecutableAdInState_STOPPED(): void {
        given_ExecutableAdDependenciesMocked();
        executableAd.stopAd();
    }

    function given_ExecutableAdInState_STOPPEDWithInteraction(): void {
        given_ExecutableAdDependenciesMocked();
        executableAd.stopAd('', true);
    }

    function then_next_isExecutedOnFSM_withStates(...states: string[]): void {
        // TODO Royi - find a way to verify that only X number of executions were made on the 'next' function
        // TODO Royi - find a way to verify that 'next' function was executed with certain parameter(s)
        // expect(spiedFSM.calls.all()[0].args[0]).toBe(states[0]);
    }

    function then_executableAdStateIs(state: string): void {
        expect(executableAd.getAttribute(AttributeNames.STATE)).toBe(state);
    }
    function addListenerToExecutableAdToCheckForState(expectedState: string): void {
        executableAd.executableAdEventListener = () => {
            then_executableAdStateIs(expectedState);
        };
    }
    function given_mockedXaafAdContainer(): XaafAdContainer {
        return {
            setElementType: jest.fn(),
            clearElementType: jest.fn()
        };
    }
});
