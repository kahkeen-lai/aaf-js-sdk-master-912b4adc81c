import { AdEventCreator, AdEventType, AdEventReason } from './index';

let adEventCreatorUnderTest: AdEventCreator;

beforeEach(() => {
    adEventCreatorUnderTest = new AdEventCreator();
});

describe('AdEventCreator functions', () => {
    it('AdEventCreator should be defined', () => {
        expect(adEventCreatorUnderTest).toBeDefined();
    });

    it('should return Loaded event type', () => {
        const returnedEvent = adEventCreatorUnderTest.createLoadedEvent();
        const eventType = AdEventType.Loaded;
        expect(returnedEvent).toEqual({ type: eventType });
    });

    it('should return Started event type', () => {
        const returnedEvent = adEventCreatorUnderTest.createStartedEvent();
        const eventType = AdEventType.Started;
        expect(returnedEvent).toEqual({ type: eventType });
    });

    it('should return Paused event type', () => {
        const returnedEvent = adEventCreatorUnderTest.createPausedEvent();
        const eventType = AdEventType.Paused;
        expect(returnedEvent).toEqual({ type: eventType });
    });

    it('should return Resumed event type', () => {
        const returnedEvent = adEventCreatorUnderTest.createResumedEvent();
        const eventType = AdEventType.Resumed;
        expect(returnedEvent).toEqual({ type: eventType });
    });

    it('should return Stopped event type', () => {
        const reason = AdEventReason.AD_STOPPED;
        const returnedEvent = adEventCreatorUnderTest.createStoppedEvent(reason);
        const eventType = AdEventType.Stopped;
        expect(returnedEvent).toEqual({ type: eventType, reason });
    });

    it('should return Warning event type', () => {
        const error = 'my warning';
        const returnedEvent = adEventCreatorUnderTest.createWarningEvent(error);
        const eventType = AdEventType.Warning;
        expect(returnedEvent).toEqual({ type: eventType, error });
    });

    it('should return Error event type', () => {
        const error = 'my error';
        const returnedEvent = adEventCreatorUnderTest.createErrorEvent(error);
        const eventType = AdEventType.Error;
        expect(returnedEvent).toEqual({ type: eventType, error });
    });
});
