/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
import '../mock/mock';
import { InjectionContainer, ContainerDef, AdEvent, AdEventType } from '@xaaf/common';
import { ExecutableAd } from './executable-ad';
import { ReportService, FeatureFlagsService, TokenExpirationStatus, TokenService, RestApiService } from '../services';
import { OpportunityType } from './opportunity';
import { LoginService } from '../services/login-service/login-service';
import { XaafAdContainer } from './elements';
import { ContentToggleListService } from '../services/content-toggle-list-service/content-toggle-list-service';
import { CommandsDataStructuresCreator } from './structures/commands-data-structures-creator';
import { CommandMock } from '../mock';
import { CommandModel, Xip } from '@xaaf/common';

class MockedCommand extends CommandMock {
    constructor(
        commandModel: CommandModel,
        private _delayBeforeHandledNotificationMS: number,
        private _commandsExecutionOrderArray?: Array<number>,
        private _commandsHandlingOrderArray?: Array<number>
    ) {
        super(commandModel);
    }

    init(xaafAdContainer: XaafAdContainer): void {
        super.init(xaafAdContainer);
    }

    execute(xaafAdContainer: XaafAdContainer): void {
        this._commandsExecutionOrderArray?.push(this._commandModel.id);

        // setting timeout to simulate asynchronous execution and handling notification
        setTimeout(() => {
            this._commandsHandlingOrderArray?.push(this._commandModel.id);
            super.execute(xaafAdContainer);
        }, this._delayBeforeHandledNotificationMS);
    }

    notifyCompleted(): void {
        const completedEvent = this._commandEventCreator.createCompletedEvent(this);
        this.commandEventListener && this.commandEventListener(completedEvent);
    }

    stop(): void {
        super.stop();
    }
}

describe('ExecutableAd fire trigger tests', () => {
    let mockedXaafAdContainer;
    let mockedInitAdInfoObject;
    const mockedCommandIdToMockedCommand = new Map<number, MockedCommand>();

    beforeAll(() => {
        mockedXaafAdContainer = given_mockedXaafAdContainer();
        mockedInitAdInfoObject = given_mockedInitAdinfoObject();
    });

    it('initAd() with 200 opportunity response - should create command ID to fire trigger map', (done) => {
        const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(
            '../mock/expectations/fire-triggers/OneCommand_withOneFireTriggerOfEachMode.json'
        );
        const spiedCreateCommandIdToFireTriggerMapFunction = given_commandsDataStructuresCreator_withSpiedCreateCommandIdToFireTriggerMap();
        given_mockedReportService();
        given_sdkLoggedIn(mockedOpportunityXiPResponse);

        const executableAd = given_executableAdUnderTest();

        when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject).then(() => {
            then_createCommandIdToFireTriggerMapWasExecuted_onCommandsDataStructuresCreator(
                spiedCreateCommandIdToFireTriggerMapFunction
            );
            done();
        });
    });

    it('initAd(), startAd() & stopAd() - commands with no fire triggers - should complete ad flow with no errors', (done) => {
        const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(
            '../mock/expectations/fire-triggers/Command_withNoFireTrigger.json'
        );
        given_commandsDataStructuresCreator_withMockedRendererCommandFactory(mockedOpportunityXiPResponse);
        given_mockedReportService();
        given_sdkLoggedIn(mockedOpportunityXiPResponse);

        const executableAd = given_executableAdUnderTest();

        executableAd.executableAdEventListener = (adEvent: AdEvent) => {
            if (adEvent.type === AdEventType.Loaded) {
                when_startAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer);
                return;
            }

            if (adEvent.type === AdEventType.Started) {
                when_stopAdIsExecuted_onExecutableAd(executableAd);
            }

            if (adEvent.type === AdEventType.Stopped) {
                done();
            }
        };

        when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject);
    });

    [
        '../mock/expectations/fire-triggers/Command1_withPREFireTrigger_executesCommand2.json',
        '../mock/expectations/fire-triggers/Command1_withPREFireTrigger_executesCommand2_withPREFireTrigger_executesCommand3.json'
    ].forEach((jsonPath) => {
        it('initAd() & startAd() - command(s) with execution trigger matches other command PRE fire trigger - should execute before the ones with the PRE fire trigger, and move ad to next state without waiting for their handling', (done) => {
            const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(jsonPath);
            const commandsExecutionOrderArray = new Array<number>();
            const commandsHandlingOrderArray = new Array<number>();
            given_commandsDataStructuresCreator_withMockedRendererCommandFactory(
                mockedOpportunityXiPResponse,
                commandsExecutionOrderArray,
                commandsHandlingOrderArray
            );
            given_mockedReportService();
            given_sdkLoggedIn(mockedOpportunityXiPResponse);

            const executableAd = given_executableAdUnderTest();

            executableAd.executableAdEventListener = (adEvent: AdEvent) => {
                if (adEvent.type === AdEventType.Loaded) {
                    when_startAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer);
                    return;
                }

                if (adEvent.type === AdEventType.Started) {
                    then_commandsAreExecutedInTheCorrectOrder_accordingToFireTriggers(
                        commandsExecutionOrderArray,
                        getCommandIdsFromXiPResponseInReversedOrder(mockedOpportunityXiPResponse)
                    );
                    then_stateWasChanged_withoutWaitingForCommandsExecutedByFireTriggeredBeingHandled(
                        commandsHandlingOrderArray
                    );
                    done();
                }
            };

            when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject);
        }, 60000);
    });

    [
        '../mock/expectations/fire-triggers/Command1_withPOSTFireTrigger_executesCommand2.json',
        '../mock/expectations/fire-triggers/Command1_withPOSTFireTrigger_executesCommand2_withPOSTFireTrigger_executesCommand3.json'
    ].forEach((jsonPath) => {
        it('initAd() & startAd() - command(s) with execution trigger matches other command POST fire trigger - should execute after the ones with the POST fire trigger, and move ad to next state without waiting for their handling', (done) => {
            const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(jsonPath);
            const commandsExecutionOrderArray = new Array<number>();
            const commandsHandlingOrderArray = new Array<number>();
            given_commandsDataStructuresCreator_withMockedRendererCommandFactory(
                mockedOpportunityXiPResponse,
                commandsExecutionOrderArray,
                commandsHandlingOrderArray
            );
            given_mockedReportService();
            given_sdkLoggedIn(mockedOpportunityXiPResponse);

            const executableAd = given_executableAdUnderTest();

            executableAd.executableAdEventListener = (adEvent: AdEvent) => {
                if (adEvent.type === AdEventType.Loaded) {
                    when_startAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer);
                    return;
                }

                if (adEvent.type === AdEventType.Started) {
                    then_commandsAreExecutedInTheCorrectOrder_accordingToFireTriggers(
                        commandsExecutionOrderArray,
                        getCommandIdsFromXiPResponseInOriginalOrder(mockedOpportunityXiPResponse)
                    );
                    then_stateWasChanged_withoutWaitingForCommandsExecutedByFireTriggeredBeingHandled(
                        commandsHandlingOrderArray
                    );
                    done();
                }
            };

            when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject);
        }, 60000);
    });

    it('initAd() & startAd() - commands with execution trigger matches other command PRE and POST fire trigger - should execute before/after the one with the PRE/POST fire trigger, and move ad to next state without waiting for their handling', (done) => {
        const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(
            '../mock/expectations/fire-triggers/Command1_withPREandPOSTFireTriggers_executesCommand2AndCommand3.json'
        );
        const commandsExecutionOrderArray = new Array<number>();
        const commandsHandlingOrderArray = new Array<number>();
        given_commandsDataStructuresCreator_withMockedRendererCommandFactory(
            mockedOpportunityXiPResponse,
            commandsExecutionOrderArray,
            commandsHandlingOrderArray
        );
        given_mockedReportService();
        given_sdkLoggedIn(mockedOpportunityXiPResponse);

        const executableAd = given_executableAdUnderTest();

        executableAd.executableAdEventListener = (adEvent: AdEvent) => {
            if (adEvent.type === AdEventType.Loaded) {
                when_startAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer);
                return;
            }

            if (adEvent.type === AdEventType.Started) {
                then_commandsAreExecutedInTheCorrectOrder_accordingToFireTriggers(commandsExecutionOrderArray, [
                    2,
                    1,
                    3
                ]);
                then_stateWasChanged_withoutWaitingForCommandsExecutedByFireTriggeredBeingHandled(
                    commandsHandlingOrderArray
                );
                done();
            }
        };

        when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject);
    }, 60000);

    it('initAd() & startAd() - commands with execution trigger matches other command COMPLETED fire trigger - should execute after the one with the COMPLETED fire trigger notifies COMPLETED, and move ad to next state without waiting for its handling', (done) => {
        const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(
            '../mock/expectations/fire-triggers/Command1_withCOMPLETEDFireTrigger_executesCommand2.json'
        );
        const commandsExecutionOrderArray = new Array<number>();
        const commandsHandlingOrderArray = new Array<number>();
        given_commandsDataStructuresCreator_withMockedRendererCommandFactory(
            mockedOpportunityXiPResponse,
            commandsExecutionOrderArray,
            commandsHandlingOrderArray
        );
        given_mockedReportService();
        given_sdkLoggedIn(mockedOpportunityXiPResponse);

        const executableAd = given_executableAdUnderTest();

        executableAd.executableAdEventListener = (adEvent: AdEvent) => {
            if (adEvent.type === AdEventType.Loaded) {
                when_startAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer);
                return;
            }

            if (adEvent.type === AdEventType.Started) {
                then_stateWasChanged_withoutWaitingForCommandsExecutedByFireTriggeredBeingHandled(
                    commandsHandlingOrderArray
                );
                when_commandNotifiesCompletion(1);
                then_commandsAreExecutedInTheCorrectOrder_accordingToFireTriggers(commandsExecutionOrderArray, [1, 2]);
                done();
            }
        };

        when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject);
    }, 60000);

    function given_mockedOpportunityXiPResponse(mockedOpportunityJSONResponse: string): any {
        return require(mockedOpportunityJSONResponse);
    }

    function given_mockedReportService(): void {
        jest.spyOn(ReportService.getInstance(), 'report').mockImplementation(async () => {});
        jest.spyOn(ReportService.getInstance(), 'setupAdSessionMetricsParams').mockImplementation(async () => {});
    }

    function given_commandsDataStructuresCreator_withSpiedCreateCommandIdToFireTriggerMap(): any {
        InjectionContainer.registerSingleton(ContainerDef.commandsDataStructuresCreator, CommandsDataStructuresCreator);
        const commandsDataStructuresCreator: CommandsDataStructuresCreator = InjectionContainer.resolve(
            ContainerDef.commandsDataStructuresCreator
        );
        return jest.spyOn(commandsDataStructuresCreator, 'createCommandIdToFireTriggerMap');
    }

    function given_commandsDataStructuresCreator_withMockedRendererCommandFactory(
        opportunityXiPResponse: any,
        commandsExecutionOrderArray?: Array<number>,
        commandsHandlingOrderArray?: Array<number>
    ): void {
        InjectionContainer.registerSingleton(ContainerDef.commandsDataStructuresCreator, CommandsDataStructuresCreator);
        const commandsDataStructuresCreator: CommandsDataStructuresCreator = InjectionContainer.resolve(
            ContainerDef.commandsDataStructuresCreator
        );
        commandsDataStructuresCreator['_commandFactory'].createCommand = jest
            .fn()
            .mockImplementation((commandModel) => {
                // the first command (with id = 1) in each JSON used in this test file is the only one triggered by state trigger,
                // therefore we want it to notify being handled to executable-ad ASAP to allow executable-ad to move to the next state.
                // other commands in JSON files are the ones being triggered by fire triggers, and we want them to notify their handling after some timeout,
                // to be able to verify that executable-ad state is changed WITHOUT waiting for their handling
                const commandTimeoutBeforeNotifyingHandled = commandModel.id === 1 ? 0 : 1000;

                const mockedCommand = new MockedCommand(
                    commandModel,
                    commandTimeoutBeforeNotifyingHandled,
                    commandsExecutionOrderArray,
                    commandsHandlingOrderArray
                );
                mockedCommandIdToMockedCommand.set(commandModel.id, mockedCommand);
                return mockedCommand;
            });
    }

    function given_sdkLoggedIn(opportunityXiPResponse: Xip): void {
        jest.spyOn(FeatureFlagsService.getInstance(), 'adStartHintEnabled', 'get').mockImplementation(() => false);
        LoginService.getInstance().isFailed = false;
        LoginService.getInstance().isLoggedIn = true;
        jest.spyOn(TokenService.getInstance(), 'getTokenExpirationStatus').mockImplementation(
            () => TokenExpirationStatus.VALID
        );
        jest.spyOn(ContentToggleListService.getInstance(), 'isContentValid').mockImplementation(() => true);
        jest.spyOn(RestApiService.getInstance(), 'getOpportunity').mockImplementation(
            async () => opportunityXiPResponse
        );
    }

    function given_mockedXaafAdContainer(): XaafAdContainer {
        return {
            setElementType: jest.fn(),
            clearElementType: jest.fn()
        };
    }

    function given_mockedInitAdinfoObject(): Map<string, string> {
        const mockedInitAdinfoObject = new Map<string, string>();
        return mockedInitAdinfoObject;
    }

    function given_executableAdUnderTest(): ExecutableAd {
        return new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>([
                ['channelName', 'espn'],
                ['expType', 'out_of_stream'],
                ['isDuringAd', 'true'],
                ['networkName', 'abc'],
                ['programmerName', 'disney'],
                ['programName', 'game_of_throne'],
                ['adStartDelayHint', '30'],
                ['channelId', '12345'],
                ['contentType', 'vod'],
                ['context', 'pause'],
                ['opportunityType', 'screensaver']
            ])
        });
    }

    async function when_initAdIsExecuted_onExecutableAd(
        executableAd: ExecutableAd,
        mockedXaafAdContainer: XaafAdContainer, // NOSONAR (false positive)
        mockedInitAdinfoObject: Map<string, string>
    ): Promise<void> {
        return executableAd.initAd(mockedXaafAdContainer, mockedInitAdinfoObject);
    }

    function when_startAdIsExecuted_onExecutableAd(
        executableAd: ExecutableAd,
        mockedXaafAdContainer: XaafAdContainer // NOSONAR (false positive)
    ): void {
        return executableAd.startAd(mockedXaafAdContainer);
    }

    function when_stopAdIsExecuted_onExecutableAd(executableAd: ExecutableAd): void {
        return executableAd.stopAd();
    }

    function when_commandNotifiesCompletion(commandId: number): void {
        const mockedCommand = mockedCommandIdToMockedCommand.get(commandId);
        mockedCommand.notifyCompleted();
    }

    function then_createCommandIdToFireTriggerMapWasExecuted_onCommandsDataStructuresCreator(
        spiedCreateCommandIdToFireTriggerMapFunction: any
    ): void {
        expect(spiedCreateCommandIdToFireTriggerMapFunction).toHaveBeenCalled();
    }

    function then_stateWasChanged_withoutWaitingForCommandsExecutedByFireTriggeredBeingHandled(
        commandsHandlingOrderArray: Array<number>
    ): void {
        // the first command (with id = 1) in each JSON used in this test file is the only one triggered by state trigger
        expect(commandsHandlingOrderArray.length).toEqual(1);
        expect(commandsHandlingOrderArray[0]).toEqual(1);
    }

    function getCommandIdsFromXiPResponseInOriginalOrder(mockedOpportunityXiPResponse: any): Array<number> {
        return mockedOpportunityXiPResponse.commands.map((command) => command.id);
    }

    function getCommandIdsFromXiPResponseInReversedOrder(mockedOpportunityXiPResponse: any): Array<number> {
        return mockedOpportunityXiPResponse.commands.map((command) => command.id).reverse();
    }

    function then_commandsAreExecutedInTheCorrectOrder_accordingToFireTriggers(
        commandsExecutionOrderArray: Array<number>,
        expectedCommandsExecutionOrderArray: Array<number>
    ): void {
        expect(commandsExecutionOrderArray.length).toEqual(expectedCommandsExecutionOrderArray.length);
        for (let index = 0; index < commandsExecutionOrderArray.length; ++index) {
            expect(commandsExecutionOrderArray[index]).toEqual(expectedCommandsExecutionOrderArray[index]);
        }
    }
});
