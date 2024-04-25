/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import '../mock/mock';
import { SqueezeCommand } from './squeeze-command';
import { XaafSqueezeData, XaafSqueezeElement, SqueezeError } from '../executable-ad/elements';

import { SqueezeCommandData } from '../executable-ad/commands';
import * as Core from '@xaaf/common';

describe('SqueezeCommand test', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockedOpportunityJSONResponse = require('../mock/expectations/SQUEEZE_SHOW_IMAGE.json');
    let squeezeData: XaafSqueezeData;

    beforeEach(() => {
        const mockedOpportunityResponseXaafCommandData = filterSqueezeCommandData();
        squeezeData = given_convertedSqueezeData(mockedOpportunityResponseXaafCommandData);
    });

    function filterSqueezeCommandData(): SqueezeCommandData {
        return mockedOpportunityJSONResponse.commands.filter((command) => command.commandName === 'SQUEEZE')[0].data;
    }

    function given_convertedSqueezeData(mockedData: SqueezeCommandData): XaafSqueezeData {
        return {
            duration: 1000,
            videoScale: {
                scaleX: mockedData.videoScale.scale_x,
                scaleY: mockedData.videoScale.scale_y,
                pivotX: mockedData.videoScale.pivot_x,
                pivotY: mockedData.videoScale.pivot_y
            },
            videoMargin: mockedData.videoMargin,
            videoBorder: mockedData.videoBorder
        };
    }

    it('execute() without HostContainer - notify on error', async () => {
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const squeezeCommandUnderTest = given_SqueezeCommand(mockedCommandEventListener);
        when_executeIsExecuted_withNoHostContainer(squeezeCommandUnderTest);
        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            Core.CommandEventType.Error
        );
    });

    it('execute() with HostContainer - expect onSqueezeStarted and onSqueezeEnded', async () => {
        const mockedHostContainer = given_mockedXaafSqueeze_notifyingOnSqueezeStartedAndSqueezeEnded_whenSqueezeIsExecuted();
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const squeezeCommandUnderTest = given_SqueezeCommand(mockedCommandEventListener);
        Core.InjectionContainer.registerInstance(Core.ContainerDef.squeezeCommandService, mockedHostContainer);
        const spySqueezeStarted = jest
            .spyOn(squeezeCommandUnderTest['_xaafSqueezeListener'], 'onSqueezeStarted')
            .mockImplementation(() => ({
                onSqueezeStarted: jest.fn()
            }));
        const spySqueezeEnded = jest.spyOn(squeezeCommandUnderTest['_xaafSqueezeListener'], 'onSqueezeEnded');

        when_executeIsExecutedOnSqueezeCommand(squeezeCommandUnderTest);
        then_setDataIsExecutedOnXaafSqueezeElement_withXaafSqueezeData(mockedHostContainer, squeezeData);
        expect(spySqueezeStarted).toHaveBeenCalled();
        await new Promise((resolve) => {
            setTimeout(() => {
                expect(spySqueezeEnded).toHaveBeenCalled();

                resolve({});
            }, 600);
        });

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            Core.CommandEventType.Completed,
            Core.CommandEventType.Handled
        );
    });

    it('execute() with error in animation', async () => {
        const mockedHostContainer = given_mockedXaafSqueeze_notifyingOnError_whenSqueezeIsExecuted();
        const mockedCommandEventListener = given_mockedCommandEventListener();
        const squeezeCommandUnderTest = given_SqueezeCommand(mockedCommandEventListener);
        Core.InjectionContainer.registerInstance(Core.ContainerDef.squeezeCommandService, mockedHostContainer);
        const spyOnError = jest.spyOn(squeezeCommandUnderTest['_xaafSqueezeListener'], 'onError');
        when_executeIsExecutedOnSqueezeCommand(squeezeCommandUnderTest);

        then_setDataIsExecutedOnXaafSqueezeElement_withXaafSqueezeData(mockedHostContainer, squeezeData);

        expect(spyOnError).toHaveBeenCalled();

        then_CommandEventListenerIsNotified_withCommandEventTypesOf(
            mockedCommandEventListener,
            Core.CommandEventType.Error
        );
    });

    function given_mockedCommandEventListener(): (CommandEvent) => void {
        return jest.fn();
    }

    function given_SqueezeCommand(mockedCommandEventListener: (CommandEvent) => void): SqueezeCommand {
        const squeezeCommandUnderTest = new SqueezeCommand(
            mockedOpportunityJSONResponse.commands.filter((command) => command.commandName === 'SQUEEZE')[0]
        );
        squeezeCommandUnderTest.commandEventListener = mockedCommandEventListener;
        return squeezeCommandUnderTest;
    }

    function given_mockedDefaultHostContainer(): XaafSqueezeElement {
        return {
            xaafElementListener: {
                onSqueezeStarted: jest.fn(),
                onSqueezeEnded: jest.fn(),
                onError: jest.fn().mockImplementation((_squeezeError: SqueezeError) => {})
            },
            setData: jest.fn(),
            squeeze: jest.fn()
        };
    }

    function given_mockedXaafSqueeze_notifyingOnSqueezeStartedAndSqueezeEnded_whenSqueezeIsExecuted(): XaafSqueezeElement {
        const mockedXaafSqueezeElement = given_mockedDefaultHostContainer();
        jest.spyOn(mockedXaafSqueezeElement, 'squeeze').mockImplementation(() => {
            mockedXaafSqueezeElement.xaafElementListener?.onSqueezeStarted();
            setTimeout(() => {
                mockedXaafSqueezeElement.xaafElementListener?.onSqueezeEnded();
            }, 5);
        });

        return mockedXaafSqueezeElement;
    }

    function given_mockedXaafSqueeze_notifyingOnError_whenSqueezeIsExecuted(): XaafSqueezeElement {
        const mockedXaafSqueezeElement = given_mockedDefaultHostContainer();

        jest.spyOn(mockedXaafSqueezeElement, 'squeeze').mockImplementation(() => {
            mockedXaafSqueezeElement.xaafElementListener?.onError({
                message: '',
                errorEndPoint: ''
            });
        });

        return mockedXaafSqueezeElement;
    }

    function when_executeIsExecutedOnSqueezeCommand(squeezeCommand: SqueezeCommand): void {
        squeezeCommand.execute();
    }

    function when_executeIsExecuted_withNoHostContainer(squeezeCommand: SqueezeCommand): void {
        squeezeCommand.execute();
    }

    function then_CommandEventListenerIsNotified_withCommandEventTypesOf(
        mockedCommandEventListener,
        ...commandEventTypes: Core.CommandEventType[]
    ): void {
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(commandEventTypes.length);

        const reverseMockedCommandEventListenerCalls = mockedCommandEventListener.mock.calls.reverse();
        for (let _index = 0; _index < commandEventTypes.length; _index++) {
            const mockedCommandEventListenerExecutionParameters = reverseMockedCommandEventListenerCalls[_index];
            const commandEvent: Core.CommandEvent = mockedCommandEventListenerExecutionParameters[0];
            expect(commandEvent.type).toEqual(commandEventTypes[_index]);
        }
    }

    function then_CommandEventListenerWasNotNotified(mockedCommandEventListener: (CommandEvent) => void): void {
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(0);
    }

    function then_setDataIsExecutedOnXaafSqueezeElement_withXaafSqueezeData(xaafSqueezeElement, xaafSqueezeData): void {
        expect(xaafSqueezeElement.setData).toHaveBeenCalledWith(xaafSqueezeData);
    }
});
