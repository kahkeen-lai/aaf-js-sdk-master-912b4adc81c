import { MockedReportServiceDelegate, MockedXaafAdContainer, MockedXaafVideoElement } from '../../mock';
import {
  AdEventType,
  UuidGenerator,
  XaafAdContainer,
  XaafEvent,
  ExecutableAd,
  XaafVideoElement,
  ErrorAdEvent,
  InjectionContainer,
  ContainerDef
} from '@xaaf/xaaf-js-sdk';
import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setMockServerResponse,
  InitializeSDKParams,
  setXaafJsSdkServiceMockDelegates,
  JEST_TIMEOUT_MS
} from '../../utils';
import mockLoginResponse from '../../apis/login-200-response';
import stop_command_xip from './apis/command-with-stop-experience-action';
import non_stop_command_xip from './apis/command-without-stop-experience-action';

let platformAdvId: string = 'platformAdvId:e2eTest-measurement-200-response';

/*
 * Helper function which manages initialization of the SDK and the ExecutableAd
 * @param a platform advertising id for new relic debugging
 * @param a higher order function which creates a listener for the executable ad
 * */
type GenericAdEvent = ErrorAdEvent;

type AdEventListener = (event: GenericAdEvent) => Promise<void>;

interface MockData {
  exAd: ExecutableAd;
  videoPlayerMock: XaafVideoElement;
}

const exAdRunner = async (
  platformAdvId: string, // NOSONAR
  adEventListenerCreator: (mockSpiesAndStubs: MockData) => AdEventListener
): Promise<void> => {
  const videoPlayerMock: XaafVideoElement = new MockedXaafVideoElement();
  const xaafAdMock: XaafAdContainer = new MockedXaafAdContainer(videoPlayerMock);
  const { opportunityInfo, sdk, configMap: defaultSdkArguments, initAdinfo } = InitializeSDKParams(platformAdvId);
  sdk.xaafInitListener = async (): Promise<void> => {
    const exAd: ExecutableAd = sdk.getExecutableAd(opportunityInfo);
    exAd.executableAdEventListener = adEventListenerCreator({ exAd, videoPlayerMock });
    exAd.initAd(xaafAdMock, initAdinfo);
  };
  const sdkArguments: Map<string, string> = new Map([...defaultSdkArguments, ['platformAdvId', platformAdvId]]);
  sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, sdkArguments);
};

const startAdLoadedRunner = async (
  platformAdvId: string, // NOSONAR
  onAdLoadedCreator: (mockSpiesAndStubs: MockData) => AdEventListener
): Promise<void> => {
  exAdRunner(platformAdvId, mockSpiesAndStubs => async (event: GenericAdEvent): Promise<void> => {
    if (event.type === AdEventType.Loaded) {
      onAdLoadedCreator(mockSpiesAndStubs)(event);
    }
  });
};

describe('impression tests', () => {
  jest.setTimeout(JEST_TIMEOUT_MS * 2);

  beforeEach(() => {
    platformAdvId = UuidGenerator.generate();
  });

  it('given mock video player and self-dismissing ad, when started, video player should play', done => {
    const videoPlayerMock: XaafVideoElement = {
      setData: jest.fn(),
      play: done,
      pause: jest.fn(),
      stop: jest.fn(),
      rewind: jest.fn(),
      getCurrentBuffer: async () => Promise.resolve(0)
    };
    const xaafAdMock: XaafAdContainer = new MockedXaafAdContainer(videoPlayerMock);

    // set mocks
    const { opportunityInfo, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvId);
    InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new MockedReportServiceDelegate());

    setXaafJsSdkServiceMockDelegates(['measurementsImpressionsErrorReportEnabled']);

    setMockServerResponse([mockLoginResponse, stop_command_xip], platformAdvId);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent): Promise<void> => {
      expect(xaafEvent.type).toEqual('SUCCESS');

      // get executable ad
      const executableAd: ExecutableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');

      executableAd.executableAdEventListener = async (event: GenericAdEvent): Promise<void> => {
        switch (event.type) {
          case AdEventType.Error: {
            fail(event.error);
            break;
          }
          case AdEventType.Loaded: {
            // set autostart on loaded
            const [showVideoCommand] = executableAd['_commandsArray'];
            showVideoCommand['_isBufferForPlaybackReached'] = () => Promise.resolve(true);
            executableAd.startAd(videoPlayerMock);
            break;
          }
        }
      };

      executableAd.initAd(xaafAdMock, initAdinfo);
    };

    // initialize SDK
    configMap.set('platformAdvId', platformAdvId);
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });

  describe('player lifecycle impressions', () => {
    let videoPlayerMock: XaafVideoElement;
    let videoProviderUrlsWithTime: string[];
    let videoProviderUrls: string[];
    let httpGetSpy;
    let reportCommandsUrls: string[];
    let firstQuartileUrl: string, secondQuartileUrl: string, thirdQuartileUrl: string, fourthQuartileUrl: string;

    beforeAll(() => {
      jest.spyOn(Date, 'now').mockImplementation((): number => 14052020140158);
      jest.spyOn(Xaaf.DateHelper, 'calcDuration').mockImplementation((): string => '2977');

      const videoCommand: Xaaf.CommandModel = stop_command_xip.data.commands[0] as Xaaf.CommandModel;
      const reportCommand: Xaaf.CommandModel = stop_command_xip.data.commands[2] as Xaaf.CommandModel;

      const xipEvents: Xaaf.XipEvent[] = videoCommand.report.providers.reduce(
        (acc, provider: Xaaf.XipProvider) => [...acc, ...provider.events],
        []
      );
      videoProviderUrls = xipEvents.map((event: Xaaf.XipEvent) => event.url);
      videoProviderUrlsWithTime = videoProviderUrls.map(url => `${url}&ClientTime=${Xaaf.DateHelper.clientTime()}`);

      const playbackReportProviders: Xaaf.XipProvider[] = videoCommand.playback_reports.reduce(
        (acc, report: Xaaf.CommandPlaybackReport) => [...acc, ...report.providers],
        []
      );
      const playbackReportProviderEvents: Xaaf.XipEvent[] = playbackReportProviders.reduce(
        (acc, provider: Xaaf.XipProvider) => [...acc, ...provider.events],
        []
      );
      [firstQuartileUrl, secondQuartileUrl, thirdQuartileUrl, fourthQuartileUrl] = playbackReportProviderEvents.map(
        (providerEvent: Xaaf.XipEvent) => providerEvent.url
      );

      const reportCommandProviderEvents = reportCommand.report.providers.reduce(
        (acc, provider) => [...acc, ...provider.events],
        []
      );
      reportCommandsUrls = reportCommandProviderEvents.map(event => event.url);
    });

    beforeEach(() => {
      videoPlayerMock = new MockedXaafVideoElement();
      // set mocks
      const httpService = Xaaf.InjectionContainer.resolve<Xaaf.HttpService>(Xaaf.ContainerDef.httpService);
      httpGetSpy = jest.spyOn(httpService, 'get');
    });

    it('given mock video player and self-dismissing ad, when started, should report to providers', done => {
      setMockServerResponse([mockLoginResponse, stop_command_xip], platformAdvId);
      setXaafJsSdkServiceMockDelegates(['measurementsImpressionsErrorReportEnabled']);
      expect(videoProviderUrlsWithTime[0]).toBe(videoProviderUrls[0] + '&ClientTime=17042415055540+180');

      exAdRunner(platformAdvId, ({ exAd }) => async (event: GenericAdEvent): Promise<void> => {
        switch (event.type) {
          case AdEventType.Error: {
            fail(event.error);
            break;
          }
          case AdEventType.Loaded: {
            // set autostart on loaded
            const [showVideoCommand] = exAd['_commandsArray'];
            showVideoCommand['_isBufferForPlaybackReached'] = () => Promise.resolve(true);
            exAd.startAd(videoPlayerMock);
            break;
          }
          case AdEventType.Started: {
            setTimeout(() => {
              expect(httpGetSpy).toHaveBeenNthCalledWith(2, videoProviderUrlsWithTime[0]);
              expect(httpGetSpy).toHaveBeenNthCalledWith(3, videoProviderUrlsWithTime[1]);
              expect(httpGetSpy).toHaveBeenNthCalledWith(4, videoProviderUrlsWithTime[2]);
              expect(httpGetSpy).toHaveBeenNthCalledWith(5, videoProviderUrls[3]); // no time is sent
              done();
            }, 3000);
          }
        }
      });
    });

    it('given mock video player and self-dismissing ad, when completed, should trigger report command and SELF_DISMISS event', done => {
      setMockServerResponse([mockLoginResponse, stop_command_xip], platformAdvId);
      setXaafJsSdkServiceMockDelegates(['measurementsImpressionsErrorReportEnabled']);
      expect(videoProviderUrlsWithTime[0]).toBe(videoProviderUrls[0] + '&ClientTime=17042415055540+180');

      exAdRunner(platformAdvId, ({ exAd, videoPlayerMock }) => async (event: GenericAdEvent): Promise<void> => { // NOSONAR
        switch (event.type) {
          case AdEventType.Error: {
            fail(event.error);
            break;
          }
          case AdEventType.Loaded: {
            // set autostart on loaded
            const [showVideoCommand] = exAd['_commandsArray'];
            showVideoCommand['_isBufferForPlaybackReached'] = () => Promise.resolve(true);
            exAd.startAd(videoPlayerMock);
            setTimeout(() => videoPlayerMock.xaafElementListener['_onCommandCompleted'](), 3000); // simulates end of ad
            break;
          }
          case AdEventType.ExperienceInfo: {
            expect(event.reason).toBe('SELF_DISMISS');
            break;
          }
          case AdEventType.Stopped: {
            expect(event.reason).toBe('SELF_DISMISS');
            // report command
            expect(httpGetSpy).toHaveBeenNthCalledWith(
              6,
              reportCommandsUrls[0] + '&ClientTime=17042415055540+180&Duration=2977'
            );
            expect(httpGetSpy).toHaveBeenNthCalledWith(
              7,
              reportCommandsUrls[1] + '&ClientTime=17042415055540+180&Duration=2977'
            );

            // 4th quartile
            expect(httpGetSpy).toHaveBeenNthCalledWith(8, fourthQuartileUrl + '&ClientTime=17042415055540+180');
            done();
          }
        }
      });
    });

    it('given mock video player and *non* self-dismissing ad, when completed, should not trigger SELF_DISMISS', done => {
      setMockServerResponse([mockLoginResponse, non_stop_command_xip], platformAdvId);
      setXaafJsSdkServiceMockDelegates(['measurementsImpressionsErrorReportEnabled']);
      expect(videoProviderUrlsWithTime[0]).toBe(videoProviderUrls[0] + '&ClientTime=17042415055540+180');

      exAdRunner(platformAdvId, ({ exAd, videoPlayerMock }) => async (event: GenericAdEvent): Promise<void> => { // NOSONAR
        switch (event.type) {
          case AdEventType.Error: {
            fail(event.error);
            break;
          }
          case AdEventType.Loaded: {
            // set autostart on loaded
            const [showVideoCommand] = exAd['_commandsArray'];
            showVideoCommand['_isBufferForPlaybackReached'] = () => Promise.resolve(true);
            exAd.startAd(videoPlayerMock);
            // simulates end of ad (nothing should happen)
            setTimeout(() => videoPlayerMock.xaafElementListener['_onCommandCompleted'](), 3000);
            setTimeout(() => {
              // expect 4th quartile
              expect(httpGetSpy).toHaveBeenNthCalledWith(6, fourthQuartileUrl + '&ClientTime=17042415055540+180');
            }, 4000);
            // simulates host stop
            setTimeout(() => exAd.stopAd(), 5000);
            break;
          }
          case AdEventType.ExperienceInfo: {
            fail('ExperienceInfo sent without SELF_DISMISS');
            break;
          }
          case AdEventType.Stopped: {
            expect(event.reason).not.toBe('SELF_DISMISS');
            expect(event.reason).toBe('AD_STOPPED');
            // report command
            expect(httpGetSpy).toHaveBeenNthCalledWith(
              7,
              reportCommandsUrls[0] + '&ClientTime=17042415055540+180&Duration=2977'
            );
            expect(httpGetSpy).toHaveBeenNthCalledWith(
              8,
              reportCommandsUrls[1] + '&ClientTime=17042415055540+180&Duration=2977'
            );

            done();
          }
        }
      });
    });

    it('given mock video player and self-dismissing ad, when advances, should report quartiles', done => {
      setMockServerResponse([mockLoginResponse, mockLoginResponse, stop_command_xip], platformAdvId);
      setXaafJsSdkServiceMockDelegates(['measurementsImpressionsErrorReportEnabled']);
      expect(videoProviderUrlsWithTime[0]).toBe(videoProviderUrls[0] + '&ClientTime=17042415055540+180');

      startAdLoadedRunner(platformAdvId, ({ videoPlayerMock }) => async (event: GenericAdEvent): Promise<void> => { // NOSONAR
        expect(event.type).toBe('Loaded');

        // emulate video playing...
        videoPlayerMock.xaafElementListener.onDurationChanged(90_000);
        let videoPosition: number = 0;
        const positionInterval: number = setInterval(() => {
          videoPlayerMock.xaafElementListener.onCurrentTimeUpdated((videoPosition += 1000));
          switch (true) {
            case videoPosition === 24_000: {
              expect(httpGetSpy).toHaveBeenNthCalledWith(2, firstQuartileUrl + '&ClientTime=17042415055540+180');
              break;
            }
            case videoPosition === 46_000: {
              expect(httpGetSpy).toHaveBeenNthCalledWith(3, secondQuartileUrl + '&ClientTime=17042415055540+180');
              break;
            }
            case videoPosition === 69_000: {
              expect(httpGetSpy).toHaveBeenNthCalledWith(4, thirdQuartileUrl + '&ClientTime=17042415055540+180');
              done();
              break;
            }
            case videoPosition === 90_000: {
              done();
              clearInterval(positionInterval);
              break;
            }
          }
        }, 1);
      });
    });

    it('given mock video player and *non* self-dismissing ad, when advances, should report quartiles', done => {
      setMockServerResponse([mockLoginResponse, mockLoginResponse, non_stop_command_xip], platformAdvId);
      setXaafJsSdkServiceMockDelegates(['measurementsImpressionsErrorReportEnabled']);
      expect(videoProviderUrlsWithTime[0]).toBe(videoProviderUrls[0] + '&ClientTime=17042415055540+180');

      startAdLoadedRunner(platformAdvId, ({ videoPlayerMock }) => async (event: GenericAdEvent): Promise<void> => { // NOSONAR
        expect(event.type).toBe('Loaded');

        // emulate video playing...
        videoPlayerMock.xaafElementListener.onDurationChanged(90_000);
        let videoPosition: number = 0;
        const positionInterval: number = setInterval(() => {
          videoPlayerMock.xaafElementListener.onCurrentTimeUpdated((videoPosition += 1000));
          switch (true) {
            case videoPosition === 24_000: {
              expect(httpGetSpy).toHaveBeenNthCalledWith(2, firstQuartileUrl + '&ClientTime=17042415055540+180');
              break;
            }
            case videoPosition === 46_000: {
              expect(httpGetSpy).toHaveBeenNthCalledWith(3, secondQuartileUrl + '&ClientTime=17042415055540+180');
              break;
            }
            case videoPosition === 69_000: {
              expect(httpGetSpy).toHaveBeenNthCalledWith(4, thirdQuartileUrl + '&ClientTime=17042415055540+180');
              done();
              break;
            }
            case videoPosition === 90_000: {
              done();
              clearInterval(positionInterval);
              break;
            }
          }
        }, 1);
      });
    });
  });
});
