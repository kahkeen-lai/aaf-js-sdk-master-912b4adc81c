/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import { resetMocks } from '../mock/mock';
import {
    ContainerDef,
    InjectionContainer,
    LoginResponse,
    ReportType,
    CommandData,
    CommandFireAction,
    CommandFireTrigger,
    CommandModel,
    Xip
} from '@xaaf/common';
import { CommandTriggeredBy, ExecutableAd } from './executable-ad';
import { ConfigService, ReportService, LoginService, AppConfig, RestApiService } from '../services';
import { XaafAdContainerMock } from '../mock/models';
import { OpportunityType } from './opportunity';
import { XaafJsSdk, OpportunityInfo } from '../xaaf-js-sdk';
import { Command } from './commands/command';
import { FireTriggerMode, TriggerType } from '../fsm/trigger';
import { CommandFireCollection, CommandFireType } from './structures/commands-data-structures-creator';
import { StateType } from '../fsm/state';
import { XaafAdContainer } from './elements/elements';
import { XaafVideoData } from './elements/video';

describe('executable ad opportunity', () => {
    let executableAd: ExecutableAd;

    beforeEach(() => {
        InjectionContainer.registerInstance(ContainerDef.executableAdStorageService, new Map<string, unknown>());

        resetMocks();
        // Set up config service with mock data
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

        ConfigService.getInstance().update(appConfig);

        // Set up executable ad with mock http service
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

    describe('Opportunity Type and Context - getOpportunity (CreateAd) - HOST_AD_CREATE', () => {
        let reportService: ReportService;

        let _properties = {};
        let sdk: XaafJsSdk;

        beforeEach(async () => {
            sdk = new XaafJsSdk();
            reportService = ReportService.getInstance();
            jest.spyOn(reportService, 'report').mockImplementation(
                (reportType: ReportType, properties: Record<string, unknown>) => {
                    if (reportType === ReportType.HostAdCreate) {
                        _properties = properties;
                        return properties as any;
                    }
                }
            );
        });

        it('set opportunityType and context to PAUSE for getExecutableAd and check parameters are retrieved fine for report function', async () => {
            const opportunityInfo = {
                opportunity: OpportunityType.Pause,
                arguments: new Map([['context', 'pause']])
            };

            sdk.getExecutableAd(opportunityInfo);

            expect(_properties['opportunityType']).toEqual(OpportunityType.Pause);
            expect(_properties['context']).toEqual('pause');
        });

        it('set opportunityType and context to EMPTY for getExecutableAd and check opportunityType is NP and context is undefined for report function', async () => {
            const opportunityInfo = {
                opportunity: '',
                arguments: new Map([['context', '']])
            };

            sdk.getExecutableAd(opportunityInfo as OpportunityInfo);

            expect(_properties['opportunityType']).toEqual('NP');
            expect(_properties['context']).toEqual(undefined);
        });

        it('set opportunityType and context to NULL for getExecutableAd and check opportunityType is NP and context is undefined for report function', async () => {
            const opportunityInfo = {
                arguments: new Map([])
            };

            sdk.getExecutableAd(opportunityInfo as OpportunityInfo);

            expect(_properties['opportunityType']).toEqual('NP');
            expect(_properties['context']).toEqual(undefined);
        });
    });

    describe('Opportunity Type and Context - initAd - HOST_AD_INIT', () => {
        let reportService: ReportService;

        let _properties = {};
        let sdk: XaafJsSdk;

        beforeEach(async () => {
            sdk = new XaafJsSdk();
            reportService = ReportService.getInstance();
            LoginService.getInstance().silentLoginRequest = jest.fn();
            jest.spyOn(reportService, 'report').mockImplementation(
                (reportType: ReportType, properties: Record<string, unknown>) => {
                    if (reportType === ReportType.HostAdInit) {
                        _properties = properties;
                        return properties as any;
                    }
                }
            );
        });

        it('set context to PAUSE for initAd and check parameters are fine for report function even though they are different for getOpportunity', (done) => {
            const opportunityInfo = {
                opportunity: OpportunityType.Credits,
                arguments: new Map([['context', 'resume']])
            };

            executableAd = sdk.getExecutableAd(opportunityInfo as OpportunityInfo);

            const el = new XaafAdContainerMock();
            const initAdinfo = new Map<string, string>([['context', 'pause']]);
            executableAd.executableAdEventListener = () => {
                expect(_properties['context']).toEqual('pause');
                done();
            };

            executableAd.initAd(el, initAdinfo);
        });

        it('set context to EMPTY for initAd and check parameters are for report function - opportunityType should be empty, context should be NP', (done) => {
            const opportunityInfo = {
                opportunity: OpportunityType.Credits,
                arguments: new Map([['context', 'resume']])
            };

            executableAd = sdk.getExecutableAd(opportunityInfo as OpportunityInfo);

            const el = new XaafAdContainerMock();
            const initAdinfo = new Map<string, string>([['context', '']]);

            executableAd.executableAdEventListener = () => {
                expect(_properties['context']).toEqual('NP');
                done();
            };

            executableAd.initAd(el, initAdinfo);
        });

        it('set opportunityType and context to NULL for initAd and check parameters are for report function - opportunityType should be undefined, context should be NP', (done) => {
            // const sdk = new XaafJsSdk();

            // @ts-ignore
            LoginService.getInstance().isLoggedin = true;

            const opportunityInfo: OpportunityInfo = {
                opportunity: OpportunityType.Credits,
                arguments: new Map([['context', 'resume']])
            };

            executableAd = sdk.getExecutableAd(opportunityInfo);

            const el = new XaafAdContainerMock();
            const initAdinfo = new Map<string, string>([]);

            executableAd.executableAdEventListener = () => {
                expect(_properties['opportunityType']).toEqual(undefined);
                expect(_properties['context']).toEqual('NP');
                done();
            };
            executableAd.initAd(el, initAdinfo);
        });
    });

    describe('Opportunity with Stop Experience trigger action', () => {
        beforeEach(() => {
            const { commands }: Xip = require('../mock/expectations/Command-with-stop-experience-action.json');
            executableAd['_createCommandsDataStructures'](commands);
        });

        it('given a stop experience trigger action xip, when parsing, should initialize commands correctly', () => {
            const _triggersToCommandsMap: Map<string, Command[]> = executableAd['_triggersToCommandsMap'];
            expect(_triggersToCommandsMap.get('STATE_STARTED')[0].getCommandModel().commandName).toBe('SHOW_VIDEO');
            expect(_triggersToCommandsMap.get('STOP_EXPERIENCE')[0].getCommandModel().commandName).toBe(
                'STOP_EXPERIENCE'
            );
            expect(_triggersToCommandsMap.get('STATE_STOPPING')[0].getCommandModel().commandName).toBe(
                'REPORT_COMMAND'
            );

            const _commandIdToFireTriggerMap: Map<number, Map<FireTriggerMode, CommandFireTrigger[]>> =
                executableAd['_commandIdToFireTriggerMap'];
            expect(_commandIdToFireTriggerMap.get(1).get('COMPLETED' as FireTriggerMode)).toStrictEqual([
                {
                    mode: 'COMPLETED',
                    name: 'STOP_EXPERIENCE'
                }
            ]);

            const _commandIdToFireActionMap: Map<number, Map<FireTriggerMode, CommandFireAction[]>> =
                executableAd['_commandIdToFireActionMap'];
            expect(_commandIdToFireActionMap.size).toBe(0);

            const _commandsArray: Command[] = executableAd['_commandsArray'];
            expect(_commandsArray.every((command: unknown): boolean => command instanceof Command)).toBe(true);
            expect(_commandsArray[0].getCommandModel().commandName).toBe('SHOW_VIDEO');
            expect(_commandsArray[1].getCommandModel().commandName).toBe('STOP_EXPERIENCE');
            expect(_commandsArray[2].getCommandModel().commandName).toBe('REPORT_COMMAND');

            const _commandIdToCommandMap: Map<number, Command> = executableAd['_commandIdToCommandMap'];
            expect(_commandIdToCommandMap.get(1).getCommandModel().commandName).toBe('SHOW_VIDEO');
            expect(_commandIdToCommandMap.get(2).getCommandModel().commandName).toBe('STOP_EXPERIENCE');
            expect(_commandIdToCommandMap.get(3).getCommandModel().commandName).toBe('REPORT_COMMAND');
        });

        it('given a correct parsing of stop experience command, when passed to resolver, should not return null', async () => {
            const _commandIdToFireTriggerMap: Map<number, Map<FireTriggerMode, CommandFireCollection>> =
                executableAd['_commandIdToFireTriggerMap'];
            const fireCollectionHandled: CommandFireCollection = await new Promise<CommandFireCollection>(
                (resolve): void =>
                    executableAd['_handleCommandFire'](
                        1,
                        _commandIdToFireTriggerMap,
                        'COMPLETED' as FireTriggerMode,
                        CommandFireType.Trigger,
                        (fireCollection: CommandFireCollection): void => resolve(fireCollection)
                    )
            );

            expect(fireCollectionHandled).toBeDefined();
            expect(fireCollectionHandled).toStrictEqual([
                {
                    mode: 'COMPLETED',
                    name: 'STOP_EXPERIENCE'
                }
            ]);
        });

        it('given a correct parsing of stop experience command, when passed to executer, should be triggered', async () => {
            executableAd['_loginService'].isLoggedIn = true; // _getCommandsForTrigger returns [] if isXaafAvailable is false

            expect.assertions(2);
            executableAd.executeTriggeredCommands = jest.fn(
                (commands: Command[], state: StateType, commandTriggeredBy: CommandTriggeredBy) => {
                    expect(commands[0].getCommandModel().commandName).toBe('STOP_EXPERIENCE');
                    expect(commandTriggeredBy).toBe(CommandTriggeredBy.FireTrigger);
                }
            );

            const fireTriggerCommand: CommandFireTrigger[] = [
                {
                    mode: 'COMPLETED' as FireTriggerMode,
                    name: 'STOP_EXPERIENCE'
                }
            ];
            executableAd['_handleFireTriggerCommands'](fireTriggerCommand);
        });

        it('given a correct parsing of stop experience command, when executeTriggeredCommands called, should execute command', async () => {
            executableAd['_loginService'].isLoggedIn = true; // _getCommandsForTrigger returns [] if isXaafAvailable is false
            const currentState = 'STATE_STARTED';
            const [stopExperienceCommand]: Command[] = executableAd['_getCommandsForTrigger']('STOP_EXPERIENCE');

            expect.assertions(2);
            stopExperienceCommand.execute = jest.fn(
                (xaafAdContainer: XaafAdContainer, state: StateType, stateInstanceHistory: Set<TriggerType>) => {
                    expect(state).toBe(currentState);
                }
            );

            executableAd.executeTriggeredCommands(
                [stopExperienceCommand],
                currentState,
                CommandTriggeredBy.FireTrigger
            );

            expect(stopExperienceCommand.execute).toBeCalled();
        });

        it('given a correct parsing of stop experience command, when executeTriggeredCommands called, should stop ad', async () => {
            executableAd['_loginService'].isLoggedIn = true; // _getCommandsForTrigger returns [] if isXaafAvailable is false
            const currentState = 'STATE_STARTED';
            const _commands: Command[] = executableAd['_getCommandsForTrigger']('STOP_EXPERIENCE');

            executableAd['_resetDelayExecutionTimers'] = jest.fn();
            executableAd['_stopAd'] = jest.fn();
            executableAd['_notify'] = jest.fn();

            executableAd.executeTriggeredCommands(_commands, currentState, CommandTriggeredBy.FireTrigger);

            expect(executableAd['_stopAd']).toBeCalledWith('SELF_DISMISS', 'Ad duration completed');
            expect(executableAd['_resetDelayExecutionTimers']).toBeCalled();
            expect(executableAd['_notify']).toBeCalledWith({
                info: 'Ad duration completed',
                reason: 'SELF_DISMISS',
                type: 'ExperienceInfo'
            });
        });

        it('given repeat count in SHOW_VIDEO, when initiated, should parse correctly', () => {
            const body: Xip = require('../mock/expectations/Command-with-stop-experience-action.json');
            RestApiService.getInstance().getOpportunity = (args: Map<string, string>, exAdId: string) =>
                Promise.resolve(body);
            executableAd['_getAndParseOpportunity']();
            const [showVideoCommand]: Command[] = executableAd['_commandsArray'];
            expect(showVideoCommand.getCommandModel().commandName).toBe('SHOW_VIDEO');
            expect(showVideoCommand.getCommandModel().id).toBe(1);
            expect(showVideoCommand.getCommandModel().data.videoRepeatCount).toBe(3);
            expect(showVideoCommand.getCommandModel().data.freeze).not.toBeDefined();
        });

        it.each([[0], [-1], ['foo']])(
            'given repeatCount %i in SHOW_VIDEO, when initiated, should throw',
            (repeatCount: unknown) => {
                const body: Xip = require('../mock/expectations/Command-with-stop-experience-action.json');
                body.commands[0].data.videoRepeatCount = repeatCount;
                RestApiService.getInstance().getOpportunity = (args: Map<string, string>, exAdId: string) =>
                    Promise.resolve(body);

                executableAd['_getAndParseOpportunity']();
                const [showVideoCommand]: Command[] = executableAd['_commandsArray'];
                showVideoCommand['_playerConfig'] = {
                    minBuffer: 2000,
                    maxBuffer: 2000,
                    bufferForPlayback: 2000,
                    bufferPollInterval: 1000
                };

                const commandModel: CommandModel<CommandData> = showVideoCommand.getCommandModel();
                expect(commandModel.commandName).toBe('SHOW_VIDEO');
                expect(commandModel.id).toBe(1);
                expect(commandModel.data.freeze).not.toBeDefined();

                try {
                    showVideoCommand['_convertToXaafVideoData'](commandModel.data);
                    fail();
                } catch (error) {
                    expect(error).toBeDefined();
                }
            }
        );

        it.each([
            [undefined, 1],
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
            [Number.MAX_VALUE, Number.MAX_VALUE]
        ])(
            'given repeatCount %i in SHOW_VIDEO, when initiated, should parse into %i',
            (repeatCount: number, expected: number) => {
                const body: Xip = require('../mock/expectations/Command-with-stop-experience-action.json');
                body.commands[0].data.videoRepeatCount = repeatCount;
                RestApiService.getInstance().getOpportunity = (args: Map<string, string>, exAdId: string) =>
                    Promise.resolve(body);

                executableAd['_getAndParseOpportunity']();
                const [showVideoCommand]: Command[] = executableAd['_commandsArray'];
                showVideoCommand['_playerConfig'] = {
                    minBuffer: 2000,
                    maxBuffer: 2000,
                    bufferForPlayback: 2000,
                    bufferPollInterval: 1000
                };

                const commandModel: CommandModel<CommandData> = showVideoCommand.getCommandModel();
                expect(commandModel.commandName).toBe('SHOW_VIDEO');
                expect(commandModel.id).toBe(1);
                expect(commandModel.data.freeze).not.toBeDefined();

                const xaafVideoData: XaafVideoData = showVideoCommand['_convertToXaafVideoData'](commandModel.data);
                expect(xaafVideoData.url).toBe('http://itvads.dtvcdn.com/itv_csads/A060416901F0.mp4');
                expect(showVideoCommand['_videoRepeatCount']).toBe(expected);
            }
        );

        it('given video options in SHOW_VIDEO, when initiated, should be parsed into xaafVideoData', () => {
            const body: Xip = require('../mock/expectations/Command-with-stop-experience-action.json');
            const videoOptions = ['foo', 'bar', 'baz'];
            body.commands[0].data.videoOptions = videoOptions;
            RestApiService.getInstance().getOpportunity = (args: Map<string, string>, exAdId: string) =>
                Promise.resolve(body);

            executableAd['_getAndParseOpportunity']();
            const [showVideoCommand]: Command[] = executableAd['_commandsArray'];
            showVideoCommand['_playerConfig'] = {
                minBuffer: 2000,
                maxBuffer: 2000,
                bufferForPlayback: 2000,
                bufferPollInterval: 1000
            };

            const commandModel: CommandModel<CommandData> = showVideoCommand.getCommandModel();
            expect(commandModel.commandName).toBe('SHOW_VIDEO');
            expect(commandModel.id).toBe(1);
            expect(commandModel.data.duration).toBeDefined();
            expect(commandModel.data.freeze).not.toBeDefined();

            const xaafVideoData: any = showVideoCommand['_convertToXaafVideoData'](commandModel.data);
            expect(xaafVideoData[videoOptions[0]]).toBe(true);
            expect(xaafVideoData[videoOptions[1]]).toBe(true);
            expect(xaafVideoData[videoOptions[2]]).toBe(true);
        });
    });

    it('given no blacklist, when initiated, should not stop ad', async () => {
        RestApiService.getInstance().getOpportunity = jest.fn();
        ConfigService.getInstance().setContentToggleList([
            {
                mode: 'blacklist',
                channelName: [
                    'Boomerang',
                    'Cartoon Network',
                    'Discovery Familia',
                    'Discovery Family Channel',
                    'Disney Channel HD',
                    'Disney Junior HD',
                    'Disney XD HD',
                    'Nick Jr.',
                    'Nickelodeon East HD',
                    'Nicktoons'
                ],
                contentType: []
            }
        ]);

        // @ts-ignore
        executableAd._loginService.isLoggedIn = true;
        // @ts-ignore
        executableAd._featureFlagsService.isFlagEnabled = () => false;
        // @ts-ignore
        const adInfo = new Map<string, string>([['test', 'abc']]);

        // @ts-ignore
        jest.spyOn(executableAd, '_stopAd');
        await executableAd['initAd']({} as XaafAdContainer, adInfo);

        // @ts-ignore
        expect(executableAd._stopAd).not.toBeCalled();
        expect(RestApiService.getInstance().getOpportunity).toBeCalled();
    });

    it('given channelName in blacklist, when initiated, should stop ad', async () => {
        RestApiService.getInstance().getOpportunity = jest.fn();

        // @ts-ignore
        ConfigService.getInstance().setContentToggleList([
            {
                mode: 'blacklist',
                channelName: [
                    'Boomerang',
                    'Cartoon Network',
                    'Discovery Familia',
                    'Discovery Family Channel',
                    'Disney Channel HD',
                    'Disney Junior HD',
                    'Disney XD HD',
                    'Nick Jr.',
                    'Nickelodeon East HD',
                    'Nicktoons'
                ],
                contentType: []
            }
        ]);

        // @ts-ignore
        executableAd._loginService.isLoggedIn = true;
        // @ts-ignore
        executableAd._featureFlagsService.isFlagEnabled = () => false;
        // @ts-ignore
        const adInfo = new Map<string, string>([['channelName', 'Nicktoons']]);

        // @ts-ignore
        jest.spyOn(executableAd, '_stopAd');
        await executableAd['initAd']({} as XaafAdContainer, adInfo);

        // @ts-ignore
        expect(executableAd._stopAd).toBeCalledWith('AD_ACTION_BLACKLIST');
        expect(RestApiService.getInstance().getOpportunity).not.toBeCalled();
    });

    it('given channelName in blacklist, when initiated, should stop ad', async () => {
        RestApiService.getInstance().getOpportunity = jest.fn();

        // @ts-ignore
        ConfigService.getInstance().setContentToggleList([
            {
                mode: 'blacklist',
                channelName: [
                    'Boomerang',
                    'Cartoon Network',
                    'Discovery Familia',
                    'Discovery Family Channel',
                    'Disney Channel HD',
                    'Disney Junior HD',
                    'Disney XD HD',
                    'Nick Jr.',
                    'Nickelodeon East HD',
                    'Nicktoons'
                ],
                networkName: ['Disney'],
                contentType: []
            }
        ]);

        // @ts-ignore
        executableAd._loginService.isLoggedIn = true;
        // @ts-ignore
        executableAd._featureFlagsService.isFlagEnabled = () => false;
        // @ts-ignore
        const adInfo = new Map<string, string>([['networkName', 'Disney']]);

        // @ts-ignore
        jest.spyOn(executableAd, '_stopAd');
        await executableAd['initAd']({} as XaafAdContainer, adInfo);

        // @ts-ignore
        expect(executableAd._stopAd).toBeCalledWith('AD_ACTION_BLACKLIST');
        expect(RestApiService.getInstance().getOpportunity).not.toBeCalled();
    });
});
