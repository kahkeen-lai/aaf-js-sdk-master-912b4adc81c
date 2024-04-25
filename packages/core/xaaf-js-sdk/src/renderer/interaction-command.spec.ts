/* eslint-disable @typescript-eslint/no-var-requires */
import { resetMocks } from '../mock/mock';
import { InteractionCommand } from './interaction-command';
const opportunityWithCondition = require('../mock/expectations/INTERACTION_COMMAND.json');
import { XaafVideoElement } from '../executable-ad/elements';
import { TriggerType } from '../fsm/trigger';

describe('InteractionCommand functions', () => {
    let interactionCommandUnderTest: InteractionCommand;
    let mockedCommandEventListener: (CommandEvent) => void;
    let xaafVideoElementMock: XaafVideoElement;
    let xaafAdContainerMock;

    beforeEach(() => {
        resetMocks();
        mockedCommandEventListener = jest.fn();

        xaafAdContainerMock = {
            setElementType: jest.fn((_elementType, xaafElementListener) => {
                xaafElementListener.onElementReady(xaafVideoElementMock);
            }),
            clearElementType: jest.fn()
        };

        xaafVideoElementMock = {
            setData: jest.fn(),
            play: jest.fn(),
            pause: jest.fn(),
            stop: jest.fn(),
            rewind: jest.fn(),
            getCurrentBuffer: jest.fn()
        };
    });

    it('test command with conditions - conditions met - command is performed', async (done) => {
        interactionCommandUnderTest = new InteractionCommand(opportunityWithCondition.commands[0]);
        interactionCommandUnderTest.commandEventListener = mockedCommandEventListener;
        // interactionCommandUnderTest['_commandsConditionsMap'].set('STATE_INTERACTION', ['STATE_STARTED']);
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_STARTED');
        await interactionCommandUnderTest.execute(xaafAdContainerMock, 'STATE_INTERACTION', _stateInstanceHistory);
        expect(interactionCommandUnderTest.interactionExecutionFlag).toEqual(true);
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(2);
        done();
    });

    it('test command with conditions - conditions do not meet - command is not performed', async (done) => {
        interactionCommandUnderTest = new InteractionCommand(opportunityWithCondition.commands[0]);
        interactionCommandUnderTest.commandEventListener = mockedCommandEventListener;
        // interactionCommandUnderTest['_commandsConditionsMap'].set('STATE_INTERACTION', ['STATE_INITIATING']);
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_STOPPING');
        await interactionCommandUnderTest.execute(xaafAdContainerMock, 'STATE_INTERACTION', _stateInstanceHistory);
        expect(interactionCommandUnderTest.interactionExecutionFlag).toEqual(false);
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(0);
        done();
    });
});
