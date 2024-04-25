/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { resetMocks } from '../mock/mock';
import { XaafAdContainer } from '../executable-ad/elements/elements';
import opportunity from '../mock/expectations/REPORT_COMMAND.json';
import { XaafVideoElement, XaafVideoData } from '../executable-ad/elements';
import { TriggerType } from '../fsm/trigger';
import { ShowVideoCommand } from './show-video-command';
import { CommandModel, XipEvent, XipProvider } from '@xaaf/common';

describe('ShowVideoCommand functions', () => {
    jest.setTimeout(20 * 1000);
    let showVideoCommandUnderTest: ShowVideoCommand;
    let xaafAdContainerMock: XaafAdContainer;
    let xaafVideoElementMock: XaafVideoElement;
    let videoData: XaafVideoData;
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

    it('given showVideoCommand with loops, on playing to completed events, should report command first frame, measurements, and quartiles', async (done) => {
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
        showVideoCommandUnderTest['_isBufferForPlaybackReached'] = jest.fn(async () => true);
        showVideoCommandUnderTest.execute(xaafAdContainerMock, 'STATE_STARTED', _stateInstanceHistory);

        expect(showVideoCommandUnderTest['_quartilesArray']).toHaveLength(4);

        showVideoCommandUnderTest['_videoRepeatCount'] = 10;
        showVideoCommandUnderTest['_remainingRepeatCount'] = 10;

        // playing + completed
        showVideoCommandUnderTest.onDurationChanged(1_000);
        await showVideoCommandUnderTest.onPlaying();
        let time: number = 0;
        const interval = setInterval(async () => {
            time += 100;
            const currentVideoTime: number = time % 1_000;
            showVideoCommandUnderTest.onCurrentTimeUpdated(currentVideoTime);
            if (currentVideoTime === 0) {
                showVideoCommandUnderTest.onPlaybackComplete();
            }
            if (time % 10_000 === 0) {
                clearInterval(interval);
                time = 0;
                expect(showVideoCommandUnderTest['_reportEvent']).toHaveBeenCalledTimes(7);
                expect(showVideoCommandUnderTest['_xaafElement']).toBeDefined();
                done();
            }
        }, 1);
    });
});
