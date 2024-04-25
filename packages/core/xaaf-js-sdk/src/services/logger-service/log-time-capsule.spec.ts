import { LogTimeCapsule } from './log-time-capsule';

test('instantiate log time capsule and get things', () => {
    const ltc = new LogTimeCapsule('debug', 'test');
    expect(ltc.localTimeStamp).toBeDefined();
    expect(ltc.logLevel).toBe('debug');
    expect(ltc.message).toBe('test');
});
