/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
    CommandEvent,
    CommandEventType,
    ErrorCommandEvent,
    StopExperienceCommandEvent,
    StoppedCommandEvent,
    StoppedCommandEventReason,
    ErrorCode,
    XaafError
} from '@xaaf/common';
import { CommandEventCreator } from './command-event-creator';
import { Command } from '../../commands';
import { CommandMock } from '../../../mock';

describe('CommandEventCreator tests', () => {
    it('createLoadedEvent() - should return CommandEvent with Loaded type and no command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();

        const loadedCommandEvent = when_createLoadedEventIsExecuted_onCommandEventCreator(commandEventCreator);

        then_commandEventType_isAsExpected(loadedCommandEvent, CommandEventType.Loaded);
        then_commandEventCommand_isAsExpected(loadedCommandEvent, undefined);
    });

    it('createExecutedEvent() - should return CommandEvent with Executed type and no command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();

        const executedCommandEvent = when_createExecutedEventIsExecuted_onCommandEventCreator(commandEventCreator);

        then_commandEventType_isAsExpected(executedCommandEvent, CommandEventType.Executed);
        then_commandEventCommand_isAsExpected(executedCommandEvent, undefined);
    });

    it('createHandledEvent() - should return CommandEvent with Handled type and correct command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();
        const mockedCommand = given_mockedCommand();

        const handledCommandEvent = when_createHandledEventIsExecuted_onCommandEventCreator(
            commandEventCreator,
            mockedCommand
        );

        then_commandEventType_isAsExpected(handledCommandEvent, CommandEventType.Handled);
        then_commandEventCommand_isAsExpected(handledCommandEvent, mockedCommand);
    });

    it('createCompletedEvent() - should return CommandEvent with Completed type and correct command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();
        const mockedCommand = given_mockedCommand();

        const completedCommandEvent = when_createCompletedEventIsExecuted_onCommandEventCreator(
            commandEventCreator,
            mockedCommand
        );

        then_commandEventType_isAsExpected(completedCommandEvent, CommandEventType.Completed);
        then_commandEventCommand_isAsExpected(completedCommandEvent, mockedCommand);
    });

    it('createErrorEvent() - should return ErrorCommandEvent with Error type, correct error and no command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();
        const mockedXaafError = given_mockedXaafError();

        const errorCommandEvent = when_createErrorEventIsExecuted_onCommandEventCreator(
            commandEventCreator,
            mockedXaafError
        );

        then_commandEventType_isAsExpected(errorCommandEvent, CommandEventType.Error);
        then_commandEventCommand_isAsExpected(errorCommandEvent, undefined);
        then_errorCommandEventError_isAsExpected(errorCommandEvent, mockedXaafError);
    });

    it('createStoppedEvent() - should return StoppedCommandEvent with Stopped type, correct StoppedCommandEventReason and no command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();

        const stoppedCommandEvent = when_createStoppedEventIsExecuted_onCommandEventCreator(
            commandEventCreator,
            StoppedCommandEventReason.COMMAND_STOPPED
        );

        then_commandEventType_isAsExpected(stoppedCommandEvent, CommandEventType.Stopped);
        then_commandEventCommand_isAsExpected(stoppedCommandEvent, undefined);
        then_stoppedCommandEventReason_isAsExpected(stoppedCommandEvent, StoppedCommandEventReason.COMMAND_STOPPED);
    });

    it('createStopExperienceEvent() - should return StopExperienceCommandEvent with StopExperience type, correct reason and isNotifyHost and no command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();

        const stopExperienceCommandEvent = when_createStopExperienceEventIsExecuted_onCommandEventCreator(
            commandEventCreator,
            'mockedReason',
            false
        );

        then_commandEventType_isAsExpected(stopExperienceCommandEvent, CommandEventType.StopExperience);
        then_commandEventCommand_isAsExpected(stopExperienceCommandEvent, undefined);
        then_stopExperienceCommandEventReasonAndIsNotifyHost_areAsExpected(
            stopExperienceCommandEvent,
            'mockedReason',
            false
        );
    });

    it('createHostRequestEvent() - should return CommandEvent with HostRequest type and correct command', () => {
        const commandEventCreator = given_commandEventCreatorUnderTest();
        const mockedCommand = given_mockedCommand();

        const hostRequestCommmandEvent = when_hostRequestEventIsExecuted_onCommandEventCreator(
            commandEventCreator,
            mockedCommand
        );

        then_commandEventType_isAsExpected(hostRequestCommmandEvent, CommandEventType.HostRequest);
        then_commandEventCommand_isAsExpected(hostRequestCommmandEvent, mockedCommand);
    });

    function given_commandEventCreatorUnderTest(): CommandEventCreator {
        return new CommandEventCreator();
    }

    function given_mockedCommand(): Command {
        // command model is irrelevant
        return new CommandMock(undefined);
    }

    function given_mockedXaafError(): XaafError {
        return {
            errorCode: ErrorCode.NA,
            httpErrorCode: 'mockedHttpErrorCode',
            name: 'mockedName',
            message: 'mockedMessage',
            comment: 'mockedComment'
        };
    }

    function when_createLoadedEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator
    ): CommandEvent {
        return commandEventCreator.createLoadedEvent();
    }

    function when_createExecutedEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator
    ): CommandEvent {
        return commandEventCreator.createExecutedEvent();
    }

    function when_createHandledEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator,
        command: Command
    ): CommandEvent {
        return commandEventCreator.createHandledEvent(command);
    }

    function when_createCompletedEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator,
        command: Command
    ): CommandEvent {
        return commandEventCreator.createCompletedEvent(command);
    }

    function when_createErrorEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator,
        error: XaafError
    ): CommandEvent {
        return commandEventCreator.createErrorEvent(error);
    }

    function when_createStoppedEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator,
        stoppedCommandEventReason: StoppedCommandEventReason
    ): CommandEvent {
        return commandEventCreator.createStoppedEvent(stoppedCommandEventReason);
    }

    function when_createStopExperienceEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator,
        reason: string,
        isNotifyHost: boolean
    ): CommandEvent {
        return commandEventCreator.createStopExperienceEvent(reason, isNotifyHost);
    }

    function when_hostRequestEventIsExecuted_onCommandEventCreator(
        commandEventCreator: CommandEventCreator,
        command: Command
    ): CommandEvent {
        return commandEventCreator.createHostRequestEvent(command);
    }

    function then_commandEventType_isAsExpected(
        commandEvent: CommandEvent,
        expectedCommandEventType: CommandEventType
    ): void {
        expect(commandEvent.type).toEqual(expectedCommandEventType);
    }

    function then_commandEventCommand_isAsExpected(commandEvent: CommandEvent, expectedCommand: Command): void {
        expect(commandEvent.command).toEqual(expectedCommand);
    }

    function then_errorCommandEventError_isAsExpected(
        errorCommandEvent: ErrorCommandEvent,
        expectedError: XaafError
    ): void {
        expect(errorCommandEvent.error).toEqual(expectedError);
    }

    function then_stoppedCommandEventReason_isAsExpected(
        stoppedCommandEvent: StoppedCommandEvent,
        expectedStoppedCommandEventReason: StoppedCommandEventReason
    ): void {
        expect(stoppedCommandEvent.reason).toEqual(expectedStoppedCommandEventReason);
    }

    function then_stopExperienceCommandEventReasonAndIsNotifyHost_areAsExpected(
        stopExperienceCommandEvent: StopExperienceCommandEvent,
        expectedReason: string,
        expectedIsNotifyHost: boolean
    ): void {
        expect(stopExperienceCommandEvent.reason).toEqual(expectedReason);
        expect(stopExperienceCommandEvent.isNotifyHost).toEqual(expectedIsNotifyHost);
    }
});
