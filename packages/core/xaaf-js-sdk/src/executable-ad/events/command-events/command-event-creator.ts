import {
    LoadedCommandEvent,
    CommandEventType,
    ErrorCommandEvent,
    StoppedCommandEvent,
    CommandEvent,
    StoppedCommandEventReason,
    ExecutedCommandEvent,
    HandledCommandEvent,
    StopExperienceCommandEvent,
    CompletedCommandEvent,
    InteractiveCommandEvent,
    XaafError,
    HostRequestCommandEvent
} from '@xaaf/common';
import { Command } from '../../commands';

export class CommandEventCreator {
    createLoadedEvent(): LoadedCommandEvent {
        return this._create(CommandEventType.Loaded);
    }

    createExecutedEvent(): ExecutedCommandEvent {
        return this._create(CommandEventType.Executed);
    }

    createHandledEvent(command: Command): HandledCommandEvent {
        return {
            type: CommandEventType.Handled,
            command
        };
    }

    createInteractiveEvent(command: Command): InteractiveCommandEvent {
        return {
            type: CommandEventType.Interactive,
            command
        };
    }

    createCompletedEvent(command: Command): CompletedCommandEvent {
        return {
            type: CommandEventType.Completed,
            command
        };
    }

    createHostRequestEvent(command: Command): HostRequestCommandEvent {
        return {
            type: CommandEventType.HostRequest,
            command
        };
    }

    createWarningEvent(error: XaafError): ErrorCommandEvent {
        return {
            type: CommandEventType.Warning,
            error
        };
    }

    createErrorEvent(error: XaafError): ErrorCommandEvent {
        return {
            type: CommandEventType.Error,
            error
        };
    }

    createStoppedEvent(reason: StoppedCommandEventReason): StoppedCommandEvent {
        return {
            type: CommandEventType.Stopped,
            reason
        };
    }

    createStopExperienceEvent(reason: string, isNotifyHost: boolean): StopExperienceCommandEvent {
        return {
            type: CommandEventType.StopExperience,
            reason,
            isNotifyHost
        };
    }

    private _create(type: CommandEventType): CommandEvent {
        return { type };
    }
}
