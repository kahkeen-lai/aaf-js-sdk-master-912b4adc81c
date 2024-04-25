import { CircularLogContainer } from './circular-log-container';
import { LogTimeCapsule } from './log-time-capsule';

describe('circular logger container', () => {
    test('Fill a logger container and empty it', async () => {
        const container = new CircularLogContainer(3);
        container.push(new LogTimeCapsule('debug', 'stam'));
        container.push(new LogTimeCapsule('info', 'shtuyot'));
        container.push(new LogTimeCapsule('error', 'balog'));
        container.push(new LogTimeCapsule('warning', 'ze lo'));
        container.push(new LogTimeCapsule('verbose', 'tov'));
        expect(container.clear().length).toBe(3);
        expect(container.isEmpty).toBeTruthy();
    });
});
