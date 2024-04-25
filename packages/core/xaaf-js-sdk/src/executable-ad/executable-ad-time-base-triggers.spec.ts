/* eslint-disable @typescript-eslint/no-var-requires */
import { resetMocks } from '../mock/mock';
import { AdEventReason } from '@xaaf/common';
import { CommandTriggeredBy, ExecutableAd } from './executable-ad';
import { OpportunityType } from './opportunity';
import { Xip } from '@xaaf/common';
import { State, StateType } from '../fsm/state';

describe('Time based triggers', () => {
    const opportunity: Xip = require('../mock/expectations/TIME_BASED_TRIGGERS.json');
    let executableAd: ExecutableAd;
    let triggerToCommandMap;
    beforeEach(() => {
        resetMocks();
        executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });
        triggerToCommandMap = executableAd.parseCommands(opportunity.commands);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    const sleep = (ms): Promise<void> => new Promise((res) => setTimeout(() => res(), ms));
    it('2 commands on one trigger: use executeTriggeredCommands function with TIME_BASED_TRIGGERS_WITH_MULTIPLE_TIMERS.json to validate timers set size when more then one command on same trigger with different timeouts test', async () => {
        jest.setTimeout(15000);
        const opportunity: Xip = require('../mock/expectations/TIME_BASED_TRIGGERS_WITH_MULTIPLE_TIMERS.json'); // NOSONAR
        const executableAd = new ExecutableAd({ // NOSONAR (false positive)
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });
        const triggerToCommandMap = executableAd.parseCommands(opportunity.commands); // NOSONAR (false positive)

        const state = State.STATE_STARTING as StateType;
        const commands = triggerToCommandMap.get(state);
        const stopExperienceCommand = commands[1];
        jest.spyOn(stopExperienceCommand, 'execute');
        const showVideoCommand = commands[0];
        jest.spyOn(showVideoCommand, 'execute');
        executableAd.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
        expect(executableAd.getSizeOfDelayExecutionTimerSet()).toEqual(2);
        await sleep(10000);
        expect(showVideoCommand.execute).toBeCalled();
        expect(stopExperienceCommand.execute).toBeCalled();
    });

    it('parseCommands should parse commands with executionTrigger data section', () => {
        expect(executableAd).toBeDefined();
        const triggerToCommandMap = executableAd.parseCommands(opportunity.commands); // NOSONAR (false positive)
        expect(triggerToCommandMap).not.toBeNull();
        const state = State.STATE_STARTING as StateType;
        expect(triggerToCommandMap.get(state)).toBeDefined();
        const commands = triggerToCommandMap.get(state);
        expect(commands).not.toBeNull();
        let command = commands[0];
        expect(command).not.toBeNull();
        expect(command.getCommandModel().commandName).toEqual('SHOW_VIDEO');
        let commandTriggersDataMap = command.getCommandTriggersData();
        expect(commandTriggersDataMap.get(state)['delay']).toEqual(1000);

        command = commands[1];
        expect(command).not.toBeNull();
        expect(command.getCommandModel().commandName).toEqual('REPORT_COMMAND');
        commandTriggersDataMap = command.getCommandTriggersData();
        expect(commandTriggersDataMap.size).toEqual(0);
    });

    it('SHOW_VIDEO: Get command delay execution value for state STATE_STARTING test', () => {
        const state = State.STATE_STARTING as StateType;
        const commands = triggerToCommandMap.get(state);
        const showVideoCommand = commands[0];
        expect(showVideoCommand.getCommandModel().commandName).toEqual('SHOW_VIDEO');
        const delayValue = executableAd.getCommandTriggerDelayValue(showVideoCommand, state);
        expect(delayValue).toEqual(1000);
    });

    it('validate that there are no available commands of no trigger states test', () => {
        let state = State.STATE_STARTED as StateType;
        let commands = triggerToCommandMap.get(state);
        expect(commands).toBeUndefined();

        state = State.STATE_LOADED as StateType;
        commands = triggerToCommandMap.get(state);
        expect(commands).toBeUndefined();

        state = State.STATE_STOPPED as StateType;
        commands = triggerToCommandMap.get(state);
        expect(commands).toBeUndefined();

        state = State.STATE_STOPPING as StateType;
        commands = triggerToCommandMap.get(state);
        expect(commands).toBeUndefined();
    });

    it('STOP_EXPERIENCE: Get command delay execution value for state STATE_PLAYING test', () => {
        const state = State.STATE_PLAYING as StateType;
        const commands = triggerToCommandMap.get(state);
        const stopExpCommand = commands[0];
        expect(stopExpCommand.getCommandModel().commandName).toEqual('STOP_EXPERIENCE');
        const delayValue = executableAd.getCommandTriggerDelayValue(stopExpCommand, state);
        expect(delayValue).toEqual(4000);
    });

    it('SHOW_VIDEO: Get delay execution value return value 0 when delay value is not a number', () => {
        const state = State.STATE_STARTING as StateType;
        const commands = triggerToCommandMap.get(state);
        const showVideoCommand = commands[0];
        showVideoCommand.getCommandModel().executionTriggers[0].data['delay'] = '1000';
        const delayValue = executableAd.getCommandTriggerDelayValue(showVideoCommand, state);
        expect(delayValue).toEqual(0);
    });

    it('REPORT_COMMAND: Get delay execution value return value 0 when trigger data is undefined', () => {
        const state = State.STATE_STARTING as StateType;
        const commands = triggerToCommandMap.get(state);
        const reportCommand = commands[0];
        reportCommand.getCommandModel().executionTriggers[0].data = null;
        const delayValue = executableAd.getCommandTriggerDelayValue(reportCommand, state);
        expect(delayValue).toEqual(0);
    });

    it('execute() on SHOW_VIDEO: executeTriggeredCommand function call to command.execute() function test', () => {
        const state = State.STATE_STARTING as StateType;
        const commands = triggerToCommandMap.get(state);
        const showVideoCommand = commands[0];
        jest.spyOn(showVideoCommand, 'execute');
        executableAd.executeTriggeredCommand(showVideoCommand, state, CommandTriggeredBy.StateTrigger);
        expect(showVideoCommand.execute).toBeCalled();
    });

    it('execute() on REPORT_COMMAND: executeTriggeredCommand function call to command.execute() function test', () => {
        const state = State.STATE_STARTING as StateType;
        const commands = triggerToCommandMap.get(state);
        const reportCommand = commands[1];
        jest.spyOn(reportCommand, 'execute');
        executableAd.executeTriggeredCommand(reportCommand, state, CommandTriggeredBy.StateTrigger);
        expect(reportCommand.execute).toBeCalled();
    });

    it('execute() on STOP_EXPERIENCE: executeTriggeredCommand function call to command.execute() function test', () => {
        const state = State.STATE_PLAYING as StateType;
        const commands = triggerToCommandMap.get(state);
        const stopExpCommand = commands[0];
        jest.spyOn(stopExpCommand, 'execute');
        executableAd.executeTriggeredCommand(stopExpCommand, state, CommandTriggeredBy.StateTrigger);
        expect(stopExpCommand.execute).toBeCalled();

        // @ts-ignore
        jest.spyOn(executableAd, '_handleStopExperienceEvent');
        // @ts-ignore
        jest.spyOn(executableAd, '_notify');
        // @ts-ignore
        stopExpCommand.commandEventListener = executableAd._commandEventListener(
            stopExpCommand._commandEventCreator.createStopExperienceEvent('SELF_DISMISS', true)
        );
        // @ts-ignore
        expect(executableAd._handleStopExperienceEvent).toBeCalled(); // toHaveBeenCalled();

        expect(executableAd.currentState).toEqual(State.STATE_STOPPED);
        // @ts-ignore
        expect(executableAd._stoppingReason).toEqual(AdEventReason.SELF_DISMISS);
        // @ts-ignore
        expect(executableAd._notify).toBeCalledTimes(2);
        // @ts-ignore
        expect(executableAd._notify).nthCalledWith(1, { reason: 'SELF_DISMISS', type: 'Stopped' });
        // @ts-ignore
        expect(executableAd._notify).nthCalledWith(2, {
            info: 'SELF_DISMISS',
            reason: 'SELF_DISMISS',
            type: 'ExperienceInfo'
        });
    });
});
