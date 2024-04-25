/* eslint-disable @typescript-eslint/no-var-requires */
import { resetMocks } from '../mock/mock';
import { ReportCommand } from './report-command';
const opportunityWithCondition = require('../mock/expectations/REPORT_COMMAND.json');
const opportunityWithoutCondition = require('../mock/expectations/SHOW_VIDEO.json');
import { XaafVideoElement } from '../executable-ad/elements';
import { TriggerType } from '../fsm/trigger';

describe('ReportCommand functions', () => {
    let reportCommandUnderTest: ReportCommand;
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
        reportCommandUnderTest = new ReportCommand(opportunityWithCondition.commands[1]);
        reportCommandUnderTest.commandEventListener = mockedCommandEventListener;
        // reportCommandUnderTest['_commandsConditionsMap'].set('STATE_STOPPING', ['STATE_PLAYING']);
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_PLAYING');
        await reportCommandUnderTest.execute(xaafAdContainerMock, 'STATE_STOPPING', _stateInstanceHistory);
        expect(reportCommandUnderTest.reportExecutionFlag).toEqual(true);
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(2);
        done();
    });

    it('test command with conditions - conditions do not meet - command is not performed', async (done) => {
        reportCommandUnderTest = new ReportCommand(opportunityWithCondition.commands[1]);
        reportCommandUnderTest.commandEventListener = mockedCommandEventListener;
        // reportCommandUnderTest['_commandsConditionsMap'].set('STATE_STOPPING', ['STATE_STARTED']);
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_INITIATING');
        await reportCommandUnderTest.execute(xaafAdContainerMock, 'STATE_STOPPING', _stateInstanceHistory);
        expect(reportCommandUnderTest.reportExecutionFlag).toEqual(false);
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(0);
        done();
    });

    it('test command without conditions - condition met - command is performed', async (done) => {
        reportCommandUnderTest = new ReportCommand(opportunityWithoutCondition.commands[0]);
        reportCommandUnderTest.commandEventListener = mockedCommandEventListener;
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_STARTING');
        await reportCommandUnderTest.execute(xaafAdContainerMock, 'STATE_STARTING', _stateInstanceHistory);
        expect(reportCommandUnderTest.reportExecutionFlag).toEqual(true);
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(2);
        done();
    });

    it('should report the duration measurements', async (done) => {
        reportCommandUnderTest = new ReportCommand(opportunityWithCondition.commands[1]);
        reportCommandUnderTest.commandEventListener = mockedCommandEventListener;
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_STOPPING');
        _stateInstanceHistory.add('STATE_PLAYING');
        // @ts-ignore
        jest.spyOn(reportCommandUnderTest, '_reportEvent');
        // @ts-ignore
        jest.spyOn(reportCommandUnderTest, 'condition').mockReturnValue(true);
        await reportCommandUnderTest.execute(xaafAdContainerMock, 'STATE_STOPPING', _stateInstanceHistory);
        // @ts-ignore
        expect(reportCommandUnderTest['_reportEvent']).toHaveBeenCalledTimes(3);
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(2);
        done();
    });
});
