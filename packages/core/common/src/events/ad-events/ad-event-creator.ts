import {
    AdEventType,
    AdError,
    LoadedAdEvent,
    StartedAdEvent,
    PausedAdEvent,
    ResumedAdEvent,
    AdEventReason,
    WarningAdEvent,
    ErrorAdEvent,
    AdEvent
} from './ad-events';

export class AdEventCreator {
    createLoadedEvent(): LoadedAdEvent {
        return this._create(AdEventType.Loaded);
    }

    createStartedEvent(): StartedAdEvent {
        return this._create(AdEventType.Started);
    }

    createPausedEvent(): PausedAdEvent {
        return this._create(AdEventType.Paused);
    }

    createResumedEvent(): ResumedAdEvent {
        return this._create(AdEventType.Resumed);
    }

    createStoppedEvent(reason: AdEventReason): AdEvent {
        return {
            type: AdEventType.Stopped,
            reason
        };
    }

    createExperienceInfoEvent(adInfo: string): AdEvent {
        const reason = AdEventReason.SELF_DISMISS;
        return {
            type: AdEventType.ExperienceInfo,
            reason,
            info: adInfo
        };
    }

    createWarningEvent(error: AdError): WarningAdEvent {
        return {
            type: AdEventType.Warning,
            error
        };
    }

    createErrorEvent(error: AdError): ErrorAdEvent {
        return {
            type: AdEventType.Error,
            error
        };
    }

    private _create(type: AdEventType): AdEvent {
        return { type };
    }
}
