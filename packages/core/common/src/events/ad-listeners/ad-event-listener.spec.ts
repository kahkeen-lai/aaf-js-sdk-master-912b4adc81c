import { CommandEventType } from '../command-events';
import { AdEventListener } from './ad-event-listener';
import { AdEvent, AdEventType, AdEventReason } from '../ad-events';

const commandEventType = CommandEventType;
beforeEach(() => {});

describe('enums and models ', () => {
    it('CommandEventType should be defined', () => {
        expect(commandEventType).toBeDefined();
    });

    it('execute listener function', () => {
        const listener: AdEventListener = (adEvent: AdEvent) => {
            expect(adEvent.type).toEqual(AdEventType.Started);
        };
        listener({
            type: AdEventType.Started,
            reason: AdEventReason.NA
        });
        expect(commandEventType).toBeDefined();
    });
});
