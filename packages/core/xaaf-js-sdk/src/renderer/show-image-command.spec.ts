/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import '../mock/mock';
import { CommandEvent, CommandEventType } from '@xaaf/common';
import { ShowImageCommand } from './show-image-command';
import {
    ImageLoadingError,
    XaafAdContainer,
    XaafContainerListener,
    XaafElementType,
    XaafImageData,
    XaafImageElement
} from '../executable-ad/elements';
import { LoggerService } from '../services/logger-service';
import { State, StateType } from '../fsm/state';
import { TriggerType } from '../fsm/trigger';
import { ErrorUtils } from '@xaaf/common';
import * as Core from '@xaaf/common';

describe('ShowImageCommand tests', () => {
    const loggerServiceDebugMethodOriginalImplementation = LoggerService.getInstance().debug;
    const mockedOpportunityJSONResponse = require('../mock/expectations/SHOW_IMAGE.json');
    const mockedOpportunityResponseXaafImageData: XaafImageData = mockedOpportunityJSONResponse.commands[0].data;
    const _httpService = Core.InjectionContainer.resolve<Core.HttpService>(Core.ContainerDef.httpService);

    const status = 200;
    const body = {};
    const httpServiceGetSpy = jest.spyOn(_httpService, 'get').mockImplementation(() =>
        Promise.resolve({
            status,
            body
        })
    );

    beforeEach(() => {
        resetLoggerServiceDebugMethodToOriginalImplementation();
    });

    function resetLoggerServiceDebugMethodToOriginalImplementation(): void {
        LoggerService.getInstance().debug = loggerServiceDebugMethodOriginalImplementation;
    }

    it('init() without XaafAdContainer - error thrown - should notify command event listener with CommandEventType Error', async () => {
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withNoXaafAdContainer(showImageCommandUnderTest);

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('init() with xaafAdContainer - should set XaafElementType.IMAGE element type on XaafAdContainer', async () => {
        const mockedXaafAdContainer = given_mockedDefaultXaafAdContainer();
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setElementTypeIsExecutedOnXaafAdContainer_withXaafElementType(
            mockedXaafAdContainer,
            XaafElementType.Image
        );
        then_CommandEventListenerWasNotNotified(mockedCommandEventListener);
    });

    it('init() with xaafAdContainer - error thrown when XaafImageElement is ready - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_throwingError_whenSetDataIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setElementTypeIsExecutedOnXaafAdContainer_withXaafElementType(
            mockedXaafAdContainer,
            XaafElementType.Image
        );
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('init() with xaafAdContainer - XaafImageElement is ready - should set its data', async () => {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
    });

    it('init() with xaafAdContainer - error thrown when XaafImageElement failed to load - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageLoadingError_whenSetDataIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);
        given_ErrorUtils_throwingErrorOnce_whenExAdErrorIsExecuted();

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('init() with xaafAdContainer - XaafImageElement failed to load - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageLoadingError_whenSetDataIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('init() with xaafAdContainer - error thrown when XaafImageElement is loaded - should notify command event listener with CommandEventType Error', async () => {
        // note: currently this scenario can't be tested since simulating an error for is impossible
        // let mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageLoaded_whenSetDataIsExecuted();
        // let mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(mockedXaafImageElement);
        // const mockedCommandEventListener = given_mockedCommandEventListener();
        // const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);
        //
        // when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        //
        // then_setDataIsExecutedOnXaafImageElement_withXaafImageData(mockedXaafImageElement, xaafImageData);
        // then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('init() with xaafAdContainer - XaafImageElement is ready & loaded but not shown - should not notify command event listener with CommandEventType Handled', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageLoaded_whenSetDataIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Completed
        );
    });

    it('execute() - error thrown - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_throwingError_whenShowIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('execute() - XaafImageElement is not ready - should notify command event listener with CommandEventType Error', async () => {
        const mockedXaafAdContainer = given_mockedDefaultXaafAdContainer();
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('execute() - XaafImageElement is ready - should show XaafImageElement and notify listener with CommandEventType Executed', async () => {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_showIsExecutedOnXaafImageElement(mockedXaafImageElement);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Executed
        );
    });

    it('execute() - error thrown when XaafImageElement is shown - should notify listener with CommandEventType Error', async () => {
        // note: currently this scenario can't be tested since simulating an error for is impossible
        // let mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageLoadedAndShown_whenSetDataAndShowAreExecuted();
        // let mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(mockedXaafImageElement);
        // const mockedCommandEventListener = given_mockedCommandEventListener();
        // const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);
        //
        // when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        // when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        //
        // then_setDataIsExecutedOnXaafImageElement_withXaafImageData(mockedXaafImageElement, mockedOpportunityResponseXaafImageData);
        // then_showIsExecutedOnXaafImageElement(mockedXaafImageElement);
        // then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Executed, CommandEventType.Error);
    });

    it('execute() - XaafImageElement is ready & shown but not loaded - should notify listener with CommandEventType Executed only', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageShown_whenShowIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
        then_showIsExecutedOnXaafImageElement(mockedXaafImageElement);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Executed
        );

        expect(httpServiceGetSpy).toHaveBeenCalledTimes(0);
    });

    it('execute() - XaafImageElement is ready shown and then loaded - should notify listener with CommandEventType Handled', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageShownAndThenLoaded_whenSetDataIsExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
        then_showIsExecutedOnXaafImageElement(mockedXaafImageElement);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Executed,
            CommandEventType.Handled,
            CommandEventType.Completed
        );
        expect(httpServiceGetSpy).toHaveBeenCalledTimes(0);
    });

    it('execute() - XaafImageElement is ready loaded and then shown - should notify listener with CommandEventType Handled', async () => {
        const mockedXaafImageElement = given_mockedXaafImageElement_notifyingOnImageLoadedAndShown_whenSetDataAndShowAreExecuted();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
        then_showIsExecutedOnXaafImageElement(mockedXaafImageElement);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Executed,
            CommandEventType.Handled,
            CommandEventType.Completed
        );
        expect(httpServiceGetSpy).toHaveBeenCalledTimes(1);
    });

    it('stop() - error thrown - should notify listener with CommandEventType Error', async () => {
        // note: currently this scenario can't be tested since simulating an error for is impossible
        // const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        // const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(mockedXaafImageElement);
        // const mockedCommandEventListener = given_mockedCommandEventListener();
        // const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);
        //
        // when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        // when_stopIsExecutedOnShowImageCommand(showImageCommandUnderTest);
        //
        // then_setDataIsExecutedOnXaafImageElement_withXaafImageData(mockedXaafImageElement, mockedOpportunityResponseXaafImageData);
        // then_CommandEventListenerIsNotified_withCommandEventTypesOf(mockedCommandEventListener, CommandEventType.Error);
    });

    it('stop() - XaafImageElement is ready - should hide XaafImageElement, clear element type on XaafAdContainer and notify listener with CommandEventType Stopped', async () => {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        const mockedXaafAdContainer = given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
            mockedXaafImageElement
        );
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const showImageCommandUnderTest = given_ShowImageCommand(mockedCommandEventListener);

        when_initIsExecutedOnShowImageCommand_withXaafAdContainer(showImageCommandUnderTest, mockedXaafAdContainer);
        when_stopIsExecutedOnShowImageCommand(showImageCommandUnderTest);

        then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
            mockedXaafImageElement,
            mockedOpportunityResponseXaafImageData
        );
        then_hideIsExecutedOnXaafImageElement(mockedXaafImageElement);
        then_clearElementTypeIsExecutedOnXaafAdContainer(mockedXaafAdContainer);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            CommandEventType.Stopped
        );
    });

    function given_mockedDefaultXaafAdContainer(): XaafAdContainer {
        return {
            setElementType: jest.fn(),
            clearElementType: jest.fn()
        };
    }

    function given_mockedXaafAdContainer_notifyingXaafElementListenerOnElementReady_whenSetElementTypeIsExecuted(
        mockedXaafImageElement: XaafImageElement
    ): XaafAdContainer {
        return {
            setElementType: jest.fn(
                (_elementType: XaafElementType, xaafContainerListener: XaafContainerListener<unknown>) => {
                    xaafContainerListener.onElementReady(mockedXaafImageElement);
                }
            ),
            clearElementType: jest.fn()
        };
    }

    function given_mockedDefaultXaafImageElement(): XaafImageElement {
        return {
            xaafElementListener: {
                onImageShown(): void {},
                onImageLoaded(): void {},
                onImageLoadingError(_imageLoadingError: ImageLoadingError): void {}
            },
            setData: jest.fn(),
            show: jest.fn(),
            hide: jest.fn()
        };
    }

    function given_mockedXaafImageElement_throwingError_whenSetDataIsExecuted(): XaafImageElement {
        return {
            setData: jest.fn().mockImplementation(() => {
                throw new Error('error');
            }),
            show: jest.fn(),
            hide: jest.fn()
        };
    }

    function given_mockedXaafImageElement_throwingError_whenShowIsExecuted(): XaafImageElement {
        return {
            setData: jest.fn(),
            show: jest.fn().mockImplementation(() => {
                throw new Error('error');
            }),
            hide: jest.fn()
        };
    }

    function given_mockedXaafImageElement_notifyingOnImageLoadingError_whenSetDataIsExecuted(): XaafImageElement {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        mockedXaafImageElement.setData = jest.fn().mockImplementation(() => {
            mockedXaafImageElement.xaafElementListener?.onImageLoadingError({
                message: '',
                errorEndPoint: ''
            });
        });

        return mockedXaafImageElement;
    }

    function given_mockedXaafImageElement_notifyingOnImageLoaded_whenSetDataIsExecuted(): XaafImageElement {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        mockedXaafImageElement.setData = jest.fn().mockImplementation(() => {
            mockedXaafImageElement.xaafElementListener?.onImageLoaded();
        });

        return mockedXaafImageElement;
    }

    function given_mockedXaafImageElement_notifyingOnImageShown_whenShowIsExecuted(): XaafImageElement {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        mockedXaafImageElement.show = jest.fn().mockImplementation(() => {
            mockedXaafImageElement.xaafElementListener?.onImageShown();
        });

        return mockedXaafImageElement;
    }

    function given_mockedXaafImageElement_notifyingOnImageShownAndThenLoaded_whenSetDataIsExecuted(): XaafImageElement {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        mockedXaafImageElement.show = jest.fn().mockImplementation(() => {
            mockedXaafImageElement.xaafElementListener?.onImageShown();
            mockedXaafImageElement.xaafElementListener?.onImageLoaded();
        });

        return mockedXaafImageElement;
    }

    function given_mockedXaafImageElement_notifyingOnImageLoadedAndShown_whenSetDataAndShowAreExecuted(): XaafImageElement {
        const mockedXaafImageElement = given_mockedDefaultXaafImageElement();
        mockedXaafImageElement.setData = jest.fn().mockImplementation(() => {
            mockedXaafImageElement.xaafElementListener?.onImageLoaded();
        });
        mockedXaafImageElement.show = jest.fn().mockImplementation(() => {
            mockedXaafImageElement.xaafElementListener?.onImageShown();
        });

        return mockedXaafImageElement;
    }

    function given_mockedCommandEventListener(): (CommandEvent) => void {
        return jest.fn();
    }

    function given_ShowImageCommand(mockedCommandEventListener: (CommandEvent) => void): ShowImageCommand {
        const showImageCommandUnderTest = new ShowImageCommand(mockedOpportunityJSONResponse.commands[0]);
        showImageCommandUnderTest.commandEventListener = mockedCommandEventListener;
        return showImageCommandUnderTest;
    }

    function given_ErrorUtils_throwingErrorOnce_whenExAdErrorIsExecuted(): void {
        const errorUtilsExAdErrorOriginalImplementation = ErrorUtils.exAdError;

        // note: ts-ignore must be used at the moment, since mocking exAdError is impossible without creating an ErrorUtils class

        // @ts-ignore
        ErrorUtils.exAdError = jest.fn().mockImplementation(() => {
            // @ts-ignore
            ErrorUtils.exAdError = errorUtilsExAdErrorOriginalImplementation;
            throw new Error('error');
        });
    }

    function when_initIsExecutedOnShowImageCommand_withNoXaafAdContainer(showImageCommand: ShowImageCommand): void {
        showImageCommand.init(undefined);
    }

    function when_initIsExecutedOnShowImageCommand_withXaafAdContainer(
        showImageCommand: ShowImageCommand,
        xaafAdContainer: XaafAdContainer
    ): void {
        showImageCommand.init(xaafAdContainer);
    }

    function when_executeIsExecutedOnShowImageCommand_withXaafAdContainer(
        showImageCommand: ShowImageCommand,
        xaafAdContainer: XaafAdContainer
    ): void {
        showImageCommand.execute(xaafAdContainer, State.STATE_STARTING as StateType, new Set<TriggerType>());
    }

    function when_stopIsExecutedOnShowImageCommand(showImageCommand: ShowImageCommand): void {
        showImageCommand.stop();
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

    function then_setDataIsExecutedOnXaafImageElement_withXaafImageData(
        xaafImageElement: XaafImageElement,
        xaafImageData: XaafImageData
    ): void {
        expect(xaafImageElement.setData).toHaveBeenCalledWith(xaafImageData);
    }

    function then_showIsExecutedOnXaafImageElement(xaafImageElement: XaafImageElement): void {
        expect(xaafImageElement.show).toHaveBeenCalledTimes(1);
    }
    function then_hideIsExecutedOnXaafImageElement(xaafImageElement: XaafImageElement): void {
        expect(xaafImageElement.hide).toHaveBeenCalledTimes(1);
    }
});
