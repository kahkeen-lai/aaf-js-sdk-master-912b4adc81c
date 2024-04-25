import { resetMocks } from '../mock/mock';
import opportunity from '../mock/expectations/REPORT_COMMAND.json';
import { ShowVideoCommand } from './show-video-command';
import { CommandModel } from '@xaaf/common';

describe('ShowVideoCommand functions', () => {
    jest.setTimeout(20 * 1000);
    let showVideoCommandUnderTest: ShowVideoCommand;

    let playerConfigMock;
    let playerServiceMock;

    beforeEach(() => {
        resetMocks();

        playerConfigMock = {
            _id: '123',
            minBuffer: 6,
            maxBuffer: 6
        };

        playerServiceMock = {
            onStartRequested: jest.fn(),
            onStopRequested: jest.fn(),
            isReady: jest.fn(),
            whenReady: jest.fn(),
            resetState: jest.fn(),
            onReady: jest.fn()
        };

        showVideoCommandUnderTest = new ShowVideoCommand(<CommandModel>opportunity.commands[0], playerConfigMock);
        showVideoCommandUnderTest['_playerService'] = playerServiceMock;
    });

    it('given 1 loop, when onPlaybackComplete called, should call _onCommandCompleted', async () => {
        // @ts-ignore
        jest.spyOn(showVideoCommandUnderTest, '_onCommandCompleted');
        // @ts-ignore
        showVideoCommandUnderTest['_xaafVideoElement'] = {
            rewind: jest.fn(),
            play: jest.fn()
        };

        showVideoCommandUnderTest['_remainingRepeatCount'] = 1;
        showVideoCommandUnderTest.onPlaybackComplete();
        expect(showVideoCommandUnderTest['_onCommandCompleted']).toHaveBeenCalled();
    });

    it('given many loops, when onPlaybackComplete called, should call not _onCommandCompleted', async () => {
        // @ts-ignore
        jest.spyOn(showVideoCommandUnderTest, '_onCommandCompleted');
        showVideoCommandUnderTest['_remainingRepeatCount'] = 2;
        showVideoCommandUnderTest.onPlaybackComplete();
        expect(showVideoCommandUnderTest['_onCommandCompleted']).not.toHaveBeenCalled();
    });

    it('isBufferForPlaybackReached should return true when current buffer >  requiredBuffer  ', async () => {
        // @ts-ignore
        showVideoCommandUnderTest['_xaafVideoElement'] = {
            getCurrentBuffer: jest.fn(async () => 3_000)
        };
        showVideoCommandUnderTest['_videoDuration'] = 50_000;
        showVideoCommandUnderTest['_bufferForPlayback'] = 2500;
        const isBufferReached = await showVideoCommandUnderTest['_isBufferForPlaybackReached']();
        expect(isBufferReached).toBe(true);
    });

    it('isBufferForPlaybackReached should return false  when current buffer < requiredBuffer', async () => {
        // @ts-ignore
        showVideoCommandUnderTest['_xaafVideoElement'] = {
            getCurrentBuffer: jest.fn(async () => 2_000)
        };
        showVideoCommandUnderTest['_videoDuration'] = 50_000;
        showVideoCommandUnderTest['_bufferForPlayback'] = 2500;
        const isBufferReached = await showVideoCommandUnderTest['_isBufferForPlaybackReached']();
        expect(isBufferReached).toBe(false);
    });

    it('given videoDuration shorter than bufferForPlayback, isBufferForPlaybackReached should return true  when current buffer < requiredBuffer', async () => {
        // @ts-ignore
        showVideoCommandUnderTest['_xaafVideoElement'] = {
            getCurrentBuffer: jest.fn(async () => 2_000)
        };
        showVideoCommandUnderTest['_videoDuration'] = 1500;
        showVideoCommandUnderTest['_bufferForPlayback'] = 2500;
        const isBufferReached = await showVideoCommandUnderTest['_isBufferForPlaybackReached']();
        expect(isBufferReached).toBe(true);
    });

    it('awaitBufferForPlaybackReached should define interval and not call setTimeout when timeoutEnabled = false ', async () => {
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        showVideoCommandUnderTest['_isBufferForPlaybackReached'] = jest.fn(async () => true);
        showVideoCommandUnderTest['_bufferPollInterval'] = 1000;

        expect(showVideoCommandUnderTest['_bufferIntervalId']).not.toBeDefined();
        await showVideoCommandUnderTest['_awaitBufferForPlaybackReached'](1000, false);
        expect(showVideoCommandUnderTest['_bufferIntervalId']).toBeDefined();
        expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('awaitBufferForPlaybackReached should reject with time out when awaitBufferForPlaybackReached return false', async () => {
        showVideoCommandUnderTest['_isBufferForPlaybackReached'] = jest.fn(async () => true);
        showVideoCommandUnderTest['_bufferPollInterval'] = 1000;
        await expect(showVideoCommandUnderTest['_awaitBufferForPlaybackReached'](0, true)).rejects.toEqual('timeout');
    });

    it('awaitBufferForPlaybackReached should resolve when awaitBufferForPlaybackReached return true', async () => {
        // @ts-ignore
        jest.spyOn(showVideoCommandUnderTest, '_isBufferForPlaybackReached').mockReturnValue(Promise.resolve(true));
        showVideoCommandUnderTest['_bufferPollInterval'] = 1;
        await expect(showVideoCommandUnderTest['_awaitBufferForPlaybackReached'](5000, true)).resolves.toEqual(
            undefined
        );
    });
});
