/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import '../mock/mock';
import { CommandEvent, CommandEventType } from '@xaaf/common';
import { XaafAdContainer, XaafContainerListener, XaafElementType } from '../executable-ad/elements';
import { LoggerService } from '../services/logger-service';
import { State, StateType } from '../fsm/state';
import { TriggerType } from '../fsm/trigger';
import { ShowDynamicViewCommand } from './show-dynamic-view-command';
import { XaafError, ErrorUtils, XaafDynamicElement, XaafDynamicViewData } from '@xaaf/common';

describe('ShowDynamicViewCommand tests', () => {
    const loggerServiceDebugMethodOriginalImplementation = LoggerService.getInstance().debug;
    // note: must be replaced with SHOW_VIEW.json when mocked json is available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockedOpportunityJSONResponse = require('../mock/expectations/SHOW_DYNAMIC_COMMAND.json');
    const mockedOpportunityResponseXaafDynamicElementData: XaafDynamicViewData =
        mockedOpportunityJSONResponse.commands[0].data;

    beforeEach(() => {
        resetLoggerServiceDebugMethodToOriginalImplementation();
    });

    function resetLoggerServiceDebugMethodToOriginalImplementation(): void {
        LoggerService.getInstance().debug = loggerServiceDebugMethodOriginalImplementation;
    }

    it('init() without XaafAdContainer - error thrown - should notify command event listener with CommandEventType Error', async () => {
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withNoXaafAdContainer(showDynamicViewCommandUnderTest);

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('init() with xaafAdContainer - should set XaafElementType.DYNAMIC element type on XaafAdContainer', async () => {
        const mockedXaafAdContainer = given_mockedDefaultXaafAdContainer();
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        then_setElementTypeIsExecutedOnXaafAdContainer_withXaafElementType(
            mockedXaafAdContainer,
            XaafElementType.DynamicView
        );
        then_CommandEventListenerWasNotNotified(mockedCommandEventListener);
    });

    it('init() with xaafAdContainer - error thrown when XaafDynamicViewElement is ready - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafDynamicElement = given_mockedXaafDynamicElement_throwingError_whenSetDataIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafDynamicElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        then_setElementTypeIsExecutedOnXaafAdContainer_withXaafElementType(
            mockedXaafAdContainer,
            XaafElementType.DynamicView
        );
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('init() with xaafAdContainer - XaafDynamicElement is ready - should set its data', async () => {
        const mockedXaafDynamicElement = given_mockedDefaultXaafDynamicElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafDynamicElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        then_setDataIsExecutedOnXaafDynamicElement_withXaafDynamicElementData(
            mockedXaafDynamicElement,
            mockedOpportunityResponseXaafDynamicElementData
        );
    });

    it('execute() - error thrown - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafDynamicElement = given_mockedXaafDynamicElement_throwingError_whenShowIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafDynamicElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );
        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it.skip('execute() - XaafDynamicElement is not ready - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafAdContainer = given_mockedDefaultXaafAdContainer();
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );
        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('execute() - XaafDynamicElement is ready - should show XaafDynamicElement and notify listener with CommandEventType Executed', async () => {
        const mockedXaafDynamicElement = given_mockedDefaultXaafDynamicElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafDynamicElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );
        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        then_showIsExecutedOnXaafDynamicElement(mockedXaafDynamicElement);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Executed
        );
    });

    it('should test the onLoad function', () => {
        const showDynamicViewCommandUnderTest = new ShowDynamicViewCommand(mockedOpportunityJSONResponse.commands[0]);
        const _notifyHandledIsCalled = jest.spyOn<ShowDynamicViewCommand, any>(
            showDynamicViewCommandUnderTest,
            '_notifyHandled'
        );
        showDynamicViewCommandUnderTest.onLoad();
        expect(_notifyHandledIsCalled).toBeCalled();
    });

    it('should test the onError function with error', () => {
        const showDynamicViewCommandUnderTest = new ShowDynamicViewCommand(mockedOpportunityJSONResponse.commands[0]);
        const _notifyErrorIsCalled = jest.spyOn<ShowDynamicViewCommand, any>(
            showDynamicViewCommandUnderTest,
            '_notifyError'
        );
        const error: XaafError = ErrorUtils.xaafError(null, '', null, '');
        showDynamicViewCommandUnderTest.onError(error);
        expect(_notifyErrorIsCalled).toBeCalled();
    });

    it.skip('stop() - error thrown - should notify listener with CommandEventType Error', async () => {
        // note: currently this scenario can't be tested since simulating an error for is impossible
        const mockedXaafDynamicElement = given_mockedDefaultXaafDynamicElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafDynamicElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );
        // when_stopIsExecutedOnShowVDynamiciewCommand(showDynamicViewCommandUnderTest);

        then_setDataIsExecutedOnXaafDynamicElement_withXaafDynamicElementData(
            mockedXaafDynamicElement,
            mockedOpportunityResponseXaafDynamicElementData
        );
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('stop() - XaafDynamicElement is ready - should hide XaafDynamicElement, clear element type on XaafAdContainer and notify listener with CommandEventType Stopped', async () => {
        const mockedXaafDynamicElement = given_mockedDefaultXaafDynamicElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafDynamicElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        when_stopIsExecutedOnShowDynamicViewCommand(showDynamicViewCommandUnderTest);

        then_setDataIsExecutedOnXaafDynamicElement_withXaafDynamicElementData(
            mockedXaafDynamicElement,
            mockedOpportunityResponseXaafDynamicElementData
        );
        then_hideIsExecutedOnXaafDynamicElement(mockedXaafDynamicElement);
    });

    it('complete() - XaafDynamicElement is ready - should hide XaafDynamicElement, clear element type on XaafAdContainer and notify listener with CommandEventTypes Stopped and Completed', async () => {
        const mockedXaafDynamicElement = given_mockedDefaultXaafDynamicElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafDynamicElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showDynamicViewCommandUnderTest = given_ShowDynamicViewCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
            showDynamicViewCommandUnderTest,
            mockedXaafAdContainer
        );

        when_onCompleteIsExecutedOnShowDynamicViewCommand(mockedXaafDynamicElement, showDynamicViewCommandUnderTest);

        then_setDataIsExecutedOnXaafDynamicElement_withXaafDynamicElementData(
            mockedXaafDynamicElement,
            mockedOpportunityResponseXaafDynamicElementData
        );
        then_clearElementTypeIsExecutedOnXaafAdContainer(mockedXaafAdContainer);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Stopped,
            CommandEventType.Executed
        );
    });

    function given_mockedDefaultXaafAdContainer(): XaafAdContainer {
        return {
            setElementType: jest.fn(),
            clearElementType: jest.fn()
        };
    }

    function given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
        mockedXaafDynamicElement: XaafDynamicElement
    ): XaafAdContainer {
        return {
            setElementType: jest.fn(
                (_elementType: XaafElementType, xaafContainerListener: XaafContainerListener<unknown>) => {
                    xaafContainerListener.onElementReady(mockedXaafDynamicElement);
                }
            ),
            clearElementType: jest.fn()
        };
    }

    function given_mockedDefaultXaafDynamicElement(): XaafDynamicElement {
        return {
            // note: XaafDynamicElement mocked listener implementation should be added instead of empty implementation
            // xaafElementListener: {},
            setData: jest.fn(),
            show: jest.fn(),
            hide: jest.fn()
        };
    }

    function given_mockedXaafDynamicElement_throwingError_whenSetDataIsExecuted(): XaafDynamicElement {
        return {
            setData: jest.fn().mockImplementation(() => {
                throw new Error('error');
            }),
            show: jest.fn(),
            hide: jest.fn()
        };
    }

    function given_mockedXaafDynamicElement_throwingError_whenShowIsExecuted(): XaafDynamicElement {
        return {
            setData: jest.fn(),
            show: jest.fn().mockImplementation(() => {
                throw new Error('error');
            }),
            hide: jest.fn()
        };
    }

    function given_mockedCommandEventListener(): (CommandEvent) => void {
        return jest.fn();
    }

    function given_ShowDynamicViewCommand(mockedCommandEventListener: (CommandEvent) => void): ShowDynamicViewCommand {
        const showDynamicViewCommandUnderTest = new ShowDynamicViewCommand(mockedOpportunityJSONResponse.commands[0]);
        showDynamicViewCommandUnderTest.commandEventListener = mockedCommandEventListener;
        return showDynamicViewCommandUnderTest;
    }

    function when_initIsExecutedOnShowDynamicViewCommand_withNoXaafAdContainer(
        showDynamicViewCommand: ShowDynamicViewCommand
    ): void {
        showDynamicViewCommand.init(undefined);
        showDynamicViewCommand.execute(given_mockedDefaultXaafAdContainer(), State.STATE_STARTING as any, {} as any);
    }

    function when_initIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
        showDynamicViewCommand: ShowDynamicViewCommand,
        xaafAdContainer: XaafAdContainer
    ): void {
        showDynamicViewCommand.init(xaafAdContainer);
    }

    function when_executeIsExecutedOnShowDynamicViewCommand_withXaafAdContainer(
        showDynamicViewCommand: ShowDynamicViewCommand,
        xaafAdContainer: XaafAdContainer
    ): void {
        showDynamicViewCommand.execute(xaafAdContainer, State.STATE_STARTING as StateType, new Set<TriggerType>());
    }

    function when_stopIsExecutedOnShowDynamicViewCommand(showDynamicViewCommand: ShowDynamicViewCommand): void {
        showDynamicViewCommand.stop();
    }

    function when_onCompleteIsExecutedOnShowDynamicViewCommand(
        xaafDynamicElement: XaafDynamicElement,
        showDynamicViewCommand: ShowDynamicViewCommand
    ): void {
        showDynamicViewCommand.onCompleted(true);
    }

    function then_CommandEventListenerIsNotified_withCommandEventTypesOf(
        mockedCommandEventListener,
        ...commandEventTypes: CommandEventType[]
    ): void {
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(commandEventTypes.length);

        const reverseMockedCommandEventListenerCalls = mockedCommandEventListener.mock.calls.reverse();
        for (let _index = 0; _index < commandEventTypes.length; _index++) {
            const mockedCommandEventListenerExecutionParameters = reverseMockedCommandEventListenerCalls[_index];
            const commandEvent: CommandEvent = mockedCommandEventListenerExecutionParameters[0];
            expect(commandEvent.type).toEqual(commandEventTypes[_index]);
        }
    }

    function then_CommandEventListenerWasNotNotified(mockedCommandEventListener: (CommandEvent) => void): void {
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(0);
    }

    function then_setElementTypeIsExecutedOnXaafAdContainer_withXaafElementType(
        mockedXaafAdContainer: XaafAdContainer,
        xaafElementType: XaafElementType
    ): void {
        expect(mockedXaafAdContainer.setElementType).toHaveBeenCalledWith(xaafElementType, expect.anything());
    }

    function then_clearElementTypeIsExecutedOnXaafAdContainer(mockedXaafAdContainer: XaafAdContainer): void {
        expect(mockedXaafAdContainer.clearElementType).toHaveBeenCalledWith();
    }

    function then_setDataIsExecutedOnXaafDynamicElement_withXaafDynamicElementData(
        xaafDynamicElement: XaafDynamicElement,
        xaafDynamicElementDataData: XaafDynamicViewData
    ): void {
        expect(xaafDynamicElement.setData).toHaveBeenCalledWith(xaafDynamicElementDataData);
    }

    function then_showIsExecutedOnXaafDynamicElement(xaafDynamicElement: XaafDynamicElement): void {
        expect(xaafDynamicElement.show).toHaveBeenCalledTimes(1);
    }

    function then_hideIsExecutedOnXaafDynamicElement(xaafDynamicElement: XaafDynamicElement): void {
        expect(xaafDynamicElement.hide).toHaveBeenCalledTimes(1);
    }
});
