/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
import '../mock/mock';
import { InjectionContainer, ContainerDef, AdEvent, AdEventType, ErrorUtils, ErrorCode } from '@xaaf/common';
import { ExecutableAd } from './executable-ad';
import { ReportService, FeatureFlagsService, TokenExpirationStatus, TokenService, RestApiService } from '../services';
import { OpportunityType } from './opportunity';
import { LoginService } from '../services/login-service/login-service';
import { XaafAdContainer } from './elements';
import { ContentToggleListService } from '../services/content-toggle-list-service/content-toggle-list-service';
import { CommandsDataStructuresCreator } from './structures/commands-data-structures-creator';
import { CommandMock } from '../mock';
import { CommandModel, Xip } from '@xaaf/common';
import { StateType } from '../fsm/state';
import { TriggerType } from '../fsm/trigger';

class MockedCommand extends CommandMock {
    constructor(commandModel: CommandModel) {
        super(commandModel);
    }

    init(xaafAdContainer: XaafAdContainer): void {
        super.init(xaafAdContainer);
    }

    execute(xaafAdContainer: XaafAdContainer): void {
        super.execute(xaafAdContainer);
    }

    _notifyHandled = (): void => {
        // simulating async command handled event
        setTimeout(() => {
            this._notify(this._commandEventCreator.createHandledEvent(this));
        }, 0);
    };

    handleAction(action: string, state: StateType, stateInstanceHistory: Set<TriggerType>): void {
        switch (action) {
            case 'PRE_ACTION':
            case 'POST_ACTION':
            case 'COMPLETED_ACTION': {
                this._loggerService.verbose(
                    `state: ${state}, stateInstanceHistory: ${JSON.stringify(stateInstanceHistory)}`
                );

                return;
            }
            default: {
                const unsupportedAction = ErrorUtils.exAdError(
                    ErrorCode.MissingResource,
                    `action ${action} is not supported in MockedCommand`,
                    null
                );
                this._loggerService.error(`[MockedCommand::handleAction] action ${action} is not supported`);
                this._notifyError(unsupportedAction);
                break;
            }
        }
    }

    stop(): void {
        super.stop();
    }
}

describe('ExecutableAd fire action tests', () => {
    let mockedXaafAdContainer: XaafAdContainer;
    let mockedInitAdInfoObject: Map<string, string>;
    let mockedCommandIdToMockedCommand: Map<number, MockedCommand>;

    beforeAll(() => {
        mockedCommandIdToMockedCommand = new Map<number, MockedCommand>();
        mockedXaafAdContainer = given_mockedXaafAdContainer();
        mockedInitAdInfoObject = given_mockedInitAdinfoObject();
    });

    it('initAd() with 200 opportunity response - should create command ID to fire action map', (done) => {
        const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(
            '../mock/expectations/fire-actions/one-command-with-one-fire-action-for-each-mode.json'
        );
        const spiedCreateCommandIdToFireActionMapFunction = given_commandsDataStructuresCreator_withSpiedCreateCommandIdToFireActionMap();
        given_mockedReportService();
        given_sdkLoggedIn(mockedOpportunityXiPResponse);

        const executableAd = given_executableAdUnderTest();

        when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject).then(() => {
            then_createCommandIdToFireActionMapWasExecuted_onCommandsDataStructuresCreator(
                spiedCreateCommandIdToFireActionMapFunction
            );
            done();
        });
    });

    it('initAd(), startAd() & stopAd() - commands with no action triggers - should complete ad flow with no errors', (done) => {
        const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(
            '../mock/expectations/fire-actions/command-with-no-fire-action.json'
        );
        given_commandsDataStructuresCreator_withMockedRendererCommandFactory();
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

    it('initAd() & startAd() - commands with fire actions - should trigger hanldeAction method of the given command id', (done) => {
        jest.setTimeout(10_000);
        const mockedOpportunityXiPResponse = given_mockedOpportunityXiPResponse(
            '../mock/expectations/fire-actions/command1-with-PRE-fire-action-executes-command2-with-PRE-fire-action-executes-command3.json'
        );
        given_commandsDataStructuresCreator_withMockedRendererCommandFactory();
        given_mockedReportService();
        given_sdkLoggedIn(mockedOpportunityXiPResponse);

        const executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>([
                ['channelName', 'espn'],
                ['expType', 'out_of_stream'],
                ['isDuringAd', 'true'],
                ['networkName', 'abc'],
                ['opportunityType', 'screensaver'],
                ['programmerName', 'disney'],
                ['programName', 'game_of_throne'],
                ['adStartDelayHint', '30'],
                ['channelId', '12345'],
                ['contentType', 'vod'],
                ['context', 'pause']
            ])
        });

        executableAd.executableAdEventListener = (adEvent: AdEvent) => {
            switch (adEvent.type) {
                case AdEventType.Loaded:
                    executableAd['_commandsArray'][0]['_isBufferForPlaybackReached'] = jest.fn(async () => true);
                    executableAd.startAd(mockedXaafAdContainer);
                    break;
                case AdEventType.Started:
                    const command1 = mockedCommandIdToMockedCommand.get(1);
                    const command2 = mockedCommandIdToMockedCommand.get(2);
                    const command3 = mockedCommandIdToMockedCommand.get(3);
                    expect(command1.handleAction).not.toBeCalled();
                    expect(command2.handleAction).toBeCalled();
                    expect(command3.handleAction).toBeCalled();
                    done();
                    break;
            }
        };

        when_initAdIsExecuted_onExecutableAd(executableAd, mockedXaafAdContainer, mockedInitAdInfoObject);
    });

    function given_mockedOpportunityXiPResponse(mockedOpportunityJSONResponse: string): any {
        return require(mockedOpportunityJSONResponse);
    }

    function given_mockedReportService(): void {
        jest.spyOn(ReportService.getInstance(), 'report').mockImplementation(async () => {});
        jest.spyOn(ReportService.getInstance(), 'setupAdSessionMetricsParams').mockImplementation(async () => {});
    }

    function given_commandsDataStructuresCreator_withSpiedCreateCommandIdToFireActionMap(): jest.SpyInstance {
        InjectionContainer.registerSingleton(ContainerDef.commandsDataStructuresCreator, CommandsDataStructuresCreator);
        const commandsDataStructuresCreator: CommandsDataStructuresCreator = InjectionContainer.resolve(
            ContainerDef.commandsDataStructuresCreator
        );
        return jest.spyOn(commandsDataStructuresCreator, 'createCommandIdToFireActionMap');
    }

    function given_commandsDataStructuresCreator_withMockedRendererCommandFactory(): void {
        InjectionContainer.registerSingleton(ContainerDef.commandsDataStructuresCreator, CommandsDataStructuresCreator);
        const commandsDataStructuresCreator: CommandsDataStructuresCreator = InjectionContainer.resolve(
            ContainerDef.commandsDataStructuresCreator
        );
        commandsDataStructuresCreator['_commandFactory'].createCommand = jest
            .fn()
            .mockImplementation((commandModel) => {
                const mockedCommand = new MockedCommand(commandModel);
                jest.spyOn(mockedCommand, 'handleAction');
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
        mockedXaafAdContainer: XaafAdContainer, // NOSONAR (false negative)
        mockedInitAdinfoObject: Map<string, string>
    ): Promise<void> {
        return executableAd.initAd(mockedXaafAdContainer, mockedInitAdinfoObject);
    }

    function when_startAdIsExecuted_onExecutableAd(
        executableAd: ExecutableAd,
        mockedXaafAdContainer: XaafAdContainer // NOSONAR (false negative)
    ): void {
        return executableAd.startAd(mockedXaafAdContainer);
    }

    function when_stopAdIsExecuted_onExecutableAd(executableAd: ExecutableAd): void {
        return executableAd.stopAd();
    }

    function then_createCommandIdToFireActionMapWasExecuted_onCommandsDataStructuresCreator(
        spiedCreateCommandIdToFireTriggerMapFunction: any
    ): void {
        expect(spiedCreateCommandIdToFireTriggerMapFunction).toHaveBeenCalled();
    }
});
