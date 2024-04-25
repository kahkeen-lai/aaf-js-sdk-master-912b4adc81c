import { CommandEventType, StoppedCommandEventReason } from '../events/command-events';
import { XaafError } from '../models/error';
import { CommandContract } from './command';

export interface CommandEvent {
    type: CommandEventType;
    command?: CommandContract;
}

export type LoadedCommandEvent = CommandEvent;
export type ExecutedCommandEvent = CommandEvent;
export type PausedCommandEvent = CommandEvent;
export type ResumedCommandEvent = CommandEvent;
export type HandledCommandEvent = CommandEvent;
export type CompletedCommandEvent = CommandEvent;
export type HostRequestCommandEvent = CommandEvent;
export interface StoppedCommandEvent extends CommandEvent {
    reason?: StoppedCommandEventReason;
}
export interface ErrorCommandEvent extends CommandEvent {
    error?: XaafError;
}

export interface StopExperienceCommandEvent extends CommandEvent {
    reason?: string;
    isNotifyHost?: boolean;
}

export interface InteractiveCommandEvent extends CommandEvent {
    args?: unknown[];
}
