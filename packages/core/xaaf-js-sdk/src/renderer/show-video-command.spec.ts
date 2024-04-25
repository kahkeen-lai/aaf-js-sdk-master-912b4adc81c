/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { resetMocks } from '../mock/mock';
import { XaafAdContainer, XaafElementType } from '../executable-ad/elements/elements';
import opportunity from '../mock/expectations/REPORT_COMMAND.json';
import { XaafVideoElement, XaafVideoData } from '../executable-ad/elements';
import { TriggerType } from '../fsm/trigger';
import { ShowVideoCommand } from './show-video-command';
import { CommandModel, XipEvent, XipProvider } from '@xaaf/common';
import { VideoCommandData } from '../executable-ad/commands/show-video-command';
import * as Core from '@xaaf/common';

describe('ShowVideoCommand functions', () => {
    jest.setTimeout(20 * 1000);
    let showVideoCommandUnderTest: ShowVideoCommand;
    let xaafAdContainerMock: XaafAdContainer;
    let xaafVideoElementMock: XaafVideoElement;
    let videoData: XaafVideoData;
    const xaafVideoData: XaafVideoData = {
        url: 'https://d1zocn0wsme2cv.cloudfront.net/A060416901F0.mp4',
        autoplay: true,
        preload: false,
        transparent: true,
        muted: true,
        buffer: {
            minBuffer: 6,
            maxBuffer: 6
        },
        zOrder: undefined
    };
    let playerConfigMock;
    let playerServiceMock;

    beforeEach(() => {
        resetMocks();
        xaafAdContainerMock = {
            setElementType: jest.fn((_elementType, xaafElementListener) => {
                xaafElementListener.onElementReady(xaafVideoElementMock);
            }) as any,
            clearElementType: jest.fn()
        };

        xaafVideoElementMock = {
            setData: jest.fn().mockImplementation((data) => {
                videoData = data; // NOSONAR
            }),
            play: jest.fn(),
            pause: jest.fn(),
            stop: jest.fn(),
            rewind: jest.fn(),
            getCurrentBuffer: jest.fn()
        };

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
    it('ShowVideoCommand should be defined', () => {
        expect(showVideoCommandUnderTest).toBeDefined();
    });

    it('init() without XaafAdContainer - error thrown - should notify command event listener with ErrorCommandEvent upon error', async () => {
        const mockedCommandEventListener: (CommandEvent) => void = jest.fn();
        showVideoCommandUnderTest.commandEventListener = mockedCommandEventListener;

        showVideoCommandUnderTest.init(null);

        thenCommandEventListenerWasNotifiedWithErrorCommandEvent(mockedCommandEventListener);
    });

    it('init(xaafAdContainerMock) - should set XaafElementType.VIDEO element type on XaafAdContainer and set XaafVideoElement data when it is ready', async () => {
        showVideoCommandUnderTest.init(xaafAdContainerMock);
        expect(xaafAdContainerMock.setElementType).toHaveBeenCalledWith(XaafElementType.Video, expect.anything());
        expect(xaafVideoElementMock.setData).toHaveBeenCalledWith(xaafVideoData);
    });

    it('init(xaafAdContainerMock) - showvideoCommand should contain videoRepeatCount property', async () => {
        showVideoCommandUnderTest.init(xaafAdContainerMock);
        expect(xaafAdContainerMock.setElementType).toHaveBeenCalledWith(XaafElementType.Video, expect.anything());
        expect(xaafVideoElementMock.setData).toHaveBeenCalledWith(xaafVideoData);
        expect(showVideoCommandUnderTest).toHaveProperty('_videoRepeatCount');
        expect(showVideoCommandUnderTest['_videoRepeatCount']).toEqual(1);
    });

    it('init(xaafAdContainerMock) - error thrown when XaafVideoElement is ready - should set XaafElementType.VIDEO element type on XaafAdContainer, set XaafVideoElement data when it is ready and notify command event listener with ErrorCommandEvent upon error', async () => {
        xaafVideoElementMock.setData = jest.fn().mockImplementation(() => {
            throw new Error('error');
        });
        const mockedCommandEventListener: (CommandEvent) => void = jest.fn();
        showVideoCommandUnderTest.commandEventListener = mockedCommandEventListener;

        showVideoCommandUnderTest.init(xaafAdContainerMock);

        expect(xaafAdContainerMock.setElementType).toHaveBeenCalledWith(XaafElementType.Video, expect.anything());
        expect(xaafVideoElementMock.setData).toHaveBeenCalledWith(xaafVideoData);

        thenCommandEventListenerWasNotifiedWithErrorCommandEvent(mockedCommandEventListener);
    });

    it('execute() - no video element exists - should notify command event listener with ErrorCommandEvent', async () => {
        const mockedCommandEventListener: (CommandEvent) => void = jest.fn();
        showVideoCommandUnderTest.commandEventListener = mockedCommandEventListener;
        const _stateInstanceHistory: Set<TriggerType> = new Set();
        _stateInstanceHistory.add('STATE_STARTED');
        showVideoCommandUnderTest.execute(xaafAdContainerMock, 'STATE_STARTED', _stateInstanceHistory);

        thenCommandEventListenerWasNotifiedWithErrorCommandEvent(mockedCommandEventListener);
    });

    it('stop() when XaafAdContainer and XaafVideoElement exist - should stop XaafVideoElement and clear element type on XaafAdContainer', async () => {
        showVideoCommandUnderTest.init(xaafAdContainerMock);
        showVideoCommandUnderTest.stop();

        expect(xaafVideoElementMock.stop).toHaveBeenCalled();
        expect(xaafAdContainerMock.clearElementType).toHaveBeenCalled();
    });

    function thenCommandEventListenerWasNotifiedWithErrorCommandEvent(mockedCommandEventListener): void {
        expect(mockedCommandEventListener).toHaveBeenCalledTimes(1);
        const mockedCommandEventListenerExecutionParameters = mockedCommandEventListener.mock.calls[0];
        const errorCommandEvent: Core.ErrorCommandEvent = mockedCommandEventListenerExecutionParameters[0];
        expect(errorCommandEvent.type).toEqual(Core.CommandEventType.Error);
    }

    it('given showVideoCommand, on playing to completed events, should report command first frame, measurements, and quartiles', async (done) => {
        const _stateInstanceHistory: Set<TriggerType> = new Set(['STATE_STARTED']);
        jest.spyOn<ShowVideoCommand, any>(showVideoCommandUnderTest, '_reportEvent').mockImplementation(
            (provider: XipProvider, event: XipEvent, retryCount = 0) => {
                expect(provider.name).toBeDefined();
                expect(provider.events).toBeDefined();
                expect(event.url).toBeDefined();
            }
        );
        jest.spyOn<ShowVideoCommand, any>(showVideoCommandUnderTest, '_getQuartiles');

        // init + execute
        showVideoCommandUnderTest.init(xaafAdContainerMock);
        await showVideoCommandUnderTest.execute(xaafAdContainerMock, 'STATE_STARTED', _stateInstanceHistory);
        expect(showVideoCommandUnderTest['_quartilesArray']).toHaveLength(4);

        // playing + completed
        showVideoCommandUnderTest.onDurationChanged(90_000);
        await showVideoCommandUnderTest.onPlaying();
        let time = 0;
        const interval = setInterval(() => {
            time += 1000;
            showVideoCommandUnderTest.onCurrentTimeUpdated(time);
        }, 1000);
        setTimeout(async () => {
            clearInterval(interval);
            time = 0;
            showVideoCommandUnderTest.onPlaybackComplete();
            expect(showVideoCommandUnderTest['_reportEvent']).toHaveBeenCalledTimes(7);
            expect(showVideoCommandUnderTest['_xaafElement']).toBeDefined();
            done();
        }, 10_000);
    });

    it('should test the onBufferingStarted function', async (done) => {
        jest.useFakeTimers();
        const _markBufferingStartTimeIsCalled = jest.spyOn<ShowVideoCommand, any>(
            showVideoCommandUnderTest,
            '_markBufferingStartTime'
        );
        showVideoCommandUnderTest.onBufferingStarted();
        expect(_markBufferingStartTimeIsCalled).toBeCalled();
        done();
    });

    it('should test the onBufferingEnded function', async (done) => {
        const _clearBufferTimeoutIsCalled = jest.spyOn<ShowVideoCommand, any>(
            showVideoCommandUnderTest,
            '_clearBufferTimeout'
        );
        showVideoCommandUnderTest.onBufferingEnded();
        expect(_clearBufferTimeoutIsCalled).toBeCalled();
        done();
    });

    it('should test the onFinalized function', async (done) => {
        const _clearBufferTimeoutIsCalled = jest.spyOn<ShowVideoCommand, any>(
            showVideoCommandUnderTest,
            '_clearBufferTimeout'
        );
        showVideoCommandUnderTest.onFinalized();
        expect(_clearBufferTimeoutIsCalled).toBeCalled();
        done();
    });

    it('should test the onPlayerError function', () => {
        const _notifyErrorIsCalled = jest.spyOn<ShowVideoCommand, any>(showVideoCommandUnderTest, '_notifyError');
        showVideoCommandUnderTest.onPlayerError({ message: 'test', errorEndPoint: 'test' });
        expect(_notifyErrorIsCalled).toBeCalled();
    });

    it('should test the onPlayerError function with error', () => {
        showVideoCommandUnderTest['_notifyError'] = jest.fn(() => {
            throw new Error('error');
        });
        const _notifyErrorIsCalled = jest.spyOn<ShowVideoCommand, any>(showVideoCommandUnderTest, '_notifyError');
        showVideoCommandUnderTest.onPlayerError({ message: 'test', errorEndPoint: 'test' });
        expect(_notifyErrorIsCalled).toBeCalled();
    });

    it('should test the onPlaybackComplete function with error', async () => {
        showVideoCommandUnderTest['_notifyCompleted'] = jest.fn(() => {
            throw new Error('error');
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const loggerToCheck = showVideoCommandUnderTest._loggerService;
        const _logErrorIsCalled = jest.spyOn(loggerToCheck, 'error');
        showVideoCommandUnderTest.onPlaybackComplete();
        expect(_logErrorIsCalled).toBeCalled();
    });

    // it('should test the onPlaybackComplete function', async () => {
    //     showVideoCommandUnderTest['_commandModel'].playback_reports = null;
    //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //     // @ts-ignore
    //     const loggerToCheck = showVideoCommandUnderTest._loggerService;
    //     const _logErrorIsCalled = jest.spyOn(loggerToCheck, 'error');
    //     await showVideoCommandUnderTest.onPlaybackComplete();
    //     expect(_logErrorIsCalled).toBeCalled();
    // });

    it('should test the onBufferingStarted function', async () => {
        showVideoCommandUnderTest['_commandModel'].playback_reports = null;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const loggerToCheck = showVideoCommandUnderTest._loggerService;
        loggerToCheck.warning = jest.fn(() => {
            throw new Error('error');
        });
        const _logErrorIsCalled = jest.spyOn(loggerToCheck, 'error');
        showVideoCommandUnderTest.onBufferingStarted();
        expect(_logErrorIsCalled).toBeCalled();
    });

    it('should test isOnPlayingReported', async () => {
        jest.spyOn<ShowVideoCommand, any>(showVideoCommandUnderTest, '_reportEvent');

        expect(showVideoCommandUnderTest['_isOnPlayingReported']).toBeFalsy();
        await showVideoCommandUnderTest.onPlaying();
        expect(showVideoCommandUnderTest['_isOnPlayingReported']).toBeTruthy();
        await showVideoCommandUnderTest.onPlaying();
        expect(showVideoCommandUnderTest['_reportEvent']).toHaveBeenCalledTimes(3);
    });

    it('onPlaybackComplete() - should notify listener with completed event', async () => {
        showVideoCommandUnderTest['_commandModel'].playback_reports = null;
        const mockedCommandEventListener: (CommandEvent) => void = jest.fn();
        showVideoCommandUnderTest.commandEventListener = mockedCommandEventListener;

        showVideoCommandUnderTest.onPlaybackComplete();

        expect(mockedCommandEventListener).toHaveBeenCalled();
    }, 1000);

    it.each([
        // currentTime | videoDuration | videoRepeatCount | remainingRepeatCount | expected
        [0, 30, 3, 3, 0],
        [1, 30, 3, 3, 1],
        [2, 30, 3, 3, 2],
        [3, 30, 3, 3, 3],
        [4, 30, 3, 3, 4],
        [5, 30, 3, 3, 5],
        [0, 30, 3, 2, 30],
        [1, 30, 3, 2, 31],
        [2, 30, 3, 2, 32],
        [3, 30, 3, 2, 33],
        [4, 30, 3, 2, 34],
        [0, 30, 3, 1, 60],
        [1, 30, 3, 1, 61],
        [2, 30, 3, 1, 62],
        [3, 30, 3, 1, 63],
        [4, 30, 3, 1, 64]
    ])(
        'given currentTime %i, when duration %i, videoRepeatCount %i remainingRepeatCount %i, should result in %i',
        (
            currentTime: number,
            videoDuration: number,
            videoRepeatCount: number,
            remainingRepeatCount: number,
            expected: number
        ) => {
            showVideoCommandUnderTest['_videoRepeatCount'] = videoRepeatCount;
            showVideoCommandUnderTest['_remainingRepeatCount'] = remainingRepeatCount;
            showVideoCommandUnderTest['_videoDuration'] = videoDuration;
            expect(showVideoCommandUnderTest['_getCommandPlayedTime'](currentTime)).toBe(expected);
        }
    );

    it.each([
        // id | transparent | autoplay | muted | preload | videoOptions
        [0, true, false, false, false, undefined],
        [1, true, true, false, false, []],
        [2, true, true, true, false, []],
        [3, true, false, false, false, ['transparent']],
        [4, false, false, false, false, ['autoplay']],
        [5, true, false, false, false, ['muted']],
        [6, true, false, false, true, ['autoplay', 'muted']],
        [7, true, false, false, false, ['autoplay', 'preload']]
    ])(
        'given a XiP above version 5.0.0, should correctly parse boolean video options %i',
        (id, transparent, autoplay, muted, preload, videoOptions) => { // NOSONAR
            const booleanVideoOption = ShowVideoCommand['_parseBooleanVideoOptions']({
                transparent,
                autoplay,
                muted,
                preload,
                videoOptions
            } as VideoCommandData);

            const isVideoOptionsTransparent = videoOptions?.includes('transparent') ?? false;
            const isVideoOptionsAutoplay = videoOptions?.includes('autoplay') ?? false;
            const isVideoOptionsMuted = videoOptions?.includes('muted') ?? false;
            const isVideoOptionsPreload = videoOptions?.includes('preload') ?? false;

            expect(booleanVideoOption).toBeDefined();
            expect(booleanVideoOption.transparent).toBe(transparent || isVideoOptionsTransparent);
            expect(booleanVideoOption.autoplay).toBe(autoplay || isVideoOptionsAutoplay);
            expect(booleanVideoOption.muted).toBe(muted || isVideoOptionsMuted);

            if (isVideoOptionsTransparent) {
                expect(booleanVideoOption.transparent).toBe(true);
            } else if (transparent) {
                expect(booleanVideoOption.transparent).toBe(true);
            } else {
                expect(booleanVideoOption.transparent).toBe(false);
            }

            if (isVideoOptionsAutoplay) {
                expect(booleanVideoOption.autoplay).toBe(true);
            } else if (autoplay) {
                expect(booleanVideoOption.autoplay).toBe(true);
            } else {
                expect(booleanVideoOption.autoplay).toBe(false);
            }

            if (isVideoOptionsMuted) {
                expect(booleanVideoOption.muted).toBe(true);
            } else if (muted) {
                expect(booleanVideoOption.muted).toBe(true);
            } else {
                expect(booleanVideoOption.muted).toBe(false);
            }

            if (isVideoOptionsPreload) {
                expect(booleanVideoOption.preload).toBe(true);
            } else if (preload) {
                expect(booleanVideoOption.preload).toBe(true);
            } else {
                expect(booleanVideoOption.preload).toBe(false);
            }
        }
    );
});
