import { XaafError } from '../../models/error';

export enum AdEventType {
    Loaded = 'Loaded',
    Started = 'Started',
    Paused = 'Paused',
    Resumed = 'Resumed',
    Stopped = 'Stopped',
    Warning = 'Warning',
    ExperienceInfo = 'ExperienceInfo',
    Error = 'Error'
}

export interface AdEvent {
    type: AdEventType;
    reason?: AdEventReason;
    info?: string;
}

export enum AdEventReason {
    NA = 'NA',
    NOT_LOGGED_IN = 'NOT_LOGGED_IN',
    NO_AD = 'NO_AD',
    AD_ACTION_BLACKLIST = 'AD_ACTION_BLACKLIST',
    USER_INTERACTION = 'USER_INTERACTION',
    NOT_AVAILABLE = 'NOT_AVAILABLE',
    AD_STOPPED = 'AD_STOPPED',
    SELF_DISMISS = 'SELF_DISMISS'
}

export type AdError = string | Error | XaafError;

export type LoadedAdEvent = AdEvent;
export type StartedAdEvent = AdEvent;
export type PausedAdEvent = AdEvent;
export type ResumedAdEvent = AdEvent;

export interface WarningAdEvent extends AdEvent {
    error?: AdError;
}

export interface ErrorAdEvent extends AdEvent {
    error?: AdError;
}
