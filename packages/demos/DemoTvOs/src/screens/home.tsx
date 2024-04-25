/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import {
  AdEventType,
  ExecutableAd,
  XaafEvent,
  YouIXaafSDK,
  AdEvent,
  XaafElement,
  UuidGenerator,
  AttributeNames,
  OpportunityType,
} from '@xaaf/aaf-rn-sdk';

type Video = any; // FIXME Video
type VideoError = any; // FIXME VideoError

import { ApiKeyConfig } from '../config/api-key-config';
import { BingeAdStep, Experiences } from '../config/experiences-config';
import {
  videoContainer,
  adStartDelayHint,
  projectId,
} from './xaaf-ad-video-params';
import { MockServerAPI } from './mock-server-api';
import { XaafDemoTitle } from '../components/xaaf-demo-title';
import { styles } from '../styles/styles';
import ConfigurationScreen from '../components/configuration-screen';
import PlayerView from '../components/player-view';
import ApiButtons from '../components/api-buttons';
import LogsPanel from '../components/logs-panel';
import PanelSeparator from '../components/panel-separator';
import { ApiKey, UUID } from './types';
import { XaafContext } from './xaaf-context';
import BingeApiButtons from '../components/binge-api-buttons';
const OPPORTUNITY_BINGE = 'binge';
const OPPORTUNITY_SCREENSAVER = 'screensaver';

import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';

interface HomeProps {
  focusKey: string;
}
const Home = ({ focusKey: focusKeyParam }: HomeProps) => {
  const {
    ref,
    focusSelf,
    hasFocusedChild,
    focusKey
    // setFocus, -- to set focus manually to some focusKey
    // navigateByDirection, -- to manually navigate by direction
    // pause, -- to pause all navigation events
    // resume, -- to resume all navigation events
    // updateAllLayouts, -- to force update all layouts when needed
    // getCurrentFocusKey -- to get the current focus key
  } = useFocusable({
    focusable: true,
    saveLastFocusedChild: false,
    trackChildren: true,
    autoRestoreFocus: true,
    isFocusBoundary: false,
    focusKey: focusKeyParam,
    preferredChildFocusKey: "",
    onEnterPress: () => { },
    onEnterRelease: () => { },
    onArrowPress: () => true,
    onFocus: () => { },
    onBlur: () => { },
    extraProps: { foo: 'bar' }
  });

  useEffect(() => {
    focusSelf();
  }, [focusSelf]);

  const _videoRef = React.useRef<Video>();
  const _squeezeRef = React.createRef<any>(); // FIXME XaafAdExtension
  const _xaafAdContainerRef = React.createRef<XaafElement>();

  const [platformAdvId, setPlatformAdvId] = useState<'optout' | UUID>('optout');
  const [adRequestId, setAdRequestId] = useState<UUID>(
    UuidGenerator.generate(),
  );
  const [loginRequestId, setLoginRequestId] = useState<UUID>(
    UuidGenerator.generate(),
  );
  const [adStartTimeout, setAdStartTimeout] = useState<number>(5000);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [initAdInfoMapper, setInitAdInfoMapper] = useState<Map<string, string>>(
    videoContainer[0].initAdInfoMapper,
  );
  const [isConfigDisplayed, setConfigDisplayed] = useState<boolean>(true);
  const [isSdkInitialized, setSdkInitialized] = useState<boolean>(false);
  const [customAdStartDelayHint, setCustomAdStartDelayHint] = useState<number>(
    adStartDelayHint,
  );
  const [customProjectId, setCustomProjectId] = useState<number>(projectId);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey>(
    ApiKeyConfig.getDefaultKey(),
  );
  const [selectedExperience, setSelectedExperience] = useState(
    Experiences.getDefaultTitle(),
  );
  const [executableAd, setExecutableAd] = useState<ExecutableAd>();
  const [isHostVisible, setHostVisible] = useState(true);
  const [event, setEvent] = useState<string>('Start by clicking create');
  const [executableAdAttributeEvent, setExecutableAdAttributeEvent] = useState<
    string
  >('');
  const [executableAdAction, setExecutableAdAction] = useState<
    string | undefined
  >('');
  const [hostRequestStatus, setHostRequestStatus] = useState<'SUCCESS' | 'N/A'>(
    'N/A',
  );
  const [hostRequestType, setHostRequestType] = useState<string>('N/A');
  const [adLifeCycleProjectId, setAdLifeCycleProjectId] = useState<string>('');
  const [
    adLifeCycleProjectBuildNumber,
    setAdLifeCycleProjectBuildNumber,
  ] = useState<string>('');
  const [loginEventType, setLoginEventType] = useState<string>('N/A');
  const [isPlayPauseAdFlow, setIsPlayPauseAdFlow] = useState<boolean>(false);
  const [isAdVisible, setAdVisible] = useState<boolean>(false);
  const bingeAdStepsArray = [
    BingeAdStep.PRE_ROLL,
    BingeAdStep.MID_ROLL,
    BingeAdStep.POST_ROLL,
  ];
  const MAX_OF_BINGE_ADS = bingeAdStepsArray.length;
  const [bingeCounter, setBingeCounter] = useState<number>(0);
  const [opportunityType, setOpportunityType] = useState<string>(
    OPPORTUNITY_SCREENSAVER,
  );
  const [isAdLoaded, setIsAdLoaded] = useState<boolean>(false);
  const [isAdStopped, setIsAdStopped] = useState<boolean>(false);
  const [requestParameters, setRequestParameters] = useState<
    Map<string, string>
  >(new Map([]));

  // FIXME AdvertisingInfo
  // AdvertisingInfo.getAdvertisingId()
  //   .then((advertisingId: string) => setPlatformAdvId(advertisingId))
  //   .catch(() => setPlatformAdvId('optout'));

  const _initXaaf = (): void => {
    const xaafSdk = YouIXaafSDK.getInstance();
    xaafSdk.xaafInitListener = _onXaafEvent;
    const newLoginRequestId = UuidGenerator.generate();
    xaafSdk.initialize(
      ApiKeyConfig.getApiKeyByKey(selectedApiKey),
      new Map([
        ['platform', 'dfw'],
        ['deviceType', 'tvos'],
        ['deviceAdId', 'aaec17dc-ec32-517b-8f34-074db4c9f5d5'],
        ['userAdvrId', 'fVxL8dkHB10Exi1+/kjYhQ=='],
        ['fwSUSSId', 'fVxL8dkHB10Exi1+/kjYhQ=='],
        ['householdId', 'fVxL8dkHB10Exi1+/kjYhQ=='],
        ['deviceAdvrId', '198e6038-1ef7-45b0-99c0-81fac6348b2e'],
        ['userType', '2'],
        [
          'deviceFWAdId',
          '7112e70355377c66a6bec1b723cd5588e88315a311756bc5bf15d7291f3b9a8b',
        ],
        ['tenantName', 'directv'],
        ['appName', 'Sample App'],
        ['appVersion', '3.0.21105.01005'],
        ['consoleLogger', 'true'],
        ['platformAdvId', platformAdvId],
        ['loggerLevel', 'debug'],
        ['hostRequestId', newLoginRequestId],
        ['appMode', 'debug'],
      ]),
    );
    setLoginRequestId(newLoginRequestId);
    setSdkInitialized(true);
  };

  const _onChangeProgramPress = (): void => {
    setBingeCounter(0);
    setCurrentVideoIndex((currentVideoIndex + 1) % videoContainer.length);
    setInitAdInfoMapper(videoContainer[currentVideoIndex].initAdInfoMapper);
  };

  const _goToNextEpisode = (): void => {
    console.log(`[goToNextEpisode]: ${bingeCounter}`);
    setBingeCounter(bingeCounter + 1);
    if (bingeCounter < MAX_OF_BINGE_ADS) {
      _onCreatePress();
    } else {
      console.log(`[goToNextEpisode]: No more AD thanks to Binge reward !!`);
    }
  };

  const setProjectId = (exAd: ExecutableAd): void => {
    // TODO: create public interface for adLifeCyle info
    const { adLifeCycle } =
      exAd?.['_commandsArray'][0]['_commandModel'].report ?? {};
    if (adLifeCycle) {
      const { paramName: projectId } =
        adLifeCycle.find(({ paramType }) => paramType === 'projectId') ?? {};
      const { paramName: projectBuildNumber } =
        adLifeCycle.find(({ paramType }) => paramType === 'projectBuildNumber') ??
        {};
      setAdLifeCycleProjectId(`${projectId ?? ''}`);
      setAdLifeCycleProjectBuildNumber(`${projectBuildNumber ?? ''}`);
    }
  };

  const _onAdEvent = (exAd: ExecutableAd) => (adEvent: AdEvent): void => {
    const { Loaded, Started, Warning, Error, Stopped } = AdEventType;

    setEvent(
      `executableAdEventListener: ${adEvent.reason ? adEvent.reason : adEvent.type
      }`,
    );
    setExecutableAdAttributeEvent(
      `${exAd?.getAttribute(AttributeNames.STATE)}`,
    );

    switch (adEvent.type) {
      case Loaded:
        setExecutableAdAction(exAd?.getAttribute(AttributeNames.ACTION));
        setProjectId(exAd);
        setIsAdLoaded(true);
        setIsAdStopped(false);
        break;
      case Started:
        if (
          !selectedExperience.includes('Squeeze') &&
          !selectedExperience.includes('Dynamic')
        ) {
          console.log(
            `[AdStarted] [selectedExperience] ${selectedExperience}, NOT Squeeze AND NOT Dynamic`,
          );
          setHostVisible(false);
          _pauseMovie();
        }
        setAdVisible(true);
        setExecutableAdAttributeEvent(
          `${exAd?.getAttribute(AttributeNames.STATE)}`,
        );
        setIsPlayPauseAdFlow(false);
        setIsAdLoaded(false);
        setIsAdStopped(false);
        break;
      case Stopped:
        if (
          !selectedExperience.includes('Squeeze') &&
          !selectedExperience.includes('Dynamic')
        ) {
          console.log(
            `[AdStopped] [selectedExperience] ${selectedExperience}, NOT Squeeze AND NOT Dynamic`,
          );
          setHostVisible(true);
          _playMovie();
        }
        setIsAdStopped(true);
        setAdVisible(false);
        setExecutableAdAttributeEvent(
          `${exAd?.getAttribute(AttributeNames.STATE)}`,
        );
        setIsPlayPauseAdFlow(false);
        setExecutableAdAction('');
        setIsAdLoaded(false);
        setAdLifeCycleProjectId('');
        setAdLifeCycleProjectBuildNumber('');
        break;
      case Error:
      case Warning:
        console.log(
          `[ClientApp::_onAdEvent] Host notified of $${adEvent.type} Event`,
          adEvent,
        );
        break;
    }
  };

  const _onCreatePress = (): void => {
    console.log('[ClientApp::_onCreatePress]');
    const newAdRequestId = UuidGenerator.generate();
    const xaafSdk = YouIXaafSDK.getInstance();
    const opportunityInfo = {
      arguments: new Map([
        ['context', 'pause'],
        ['hostRequestId', newAdRequestId],
        ['sdkName', 'js-sdk-youi'],
        ['platformName', 'firetv'],
        ['opportunityType', opportunityType],
      ]),
      opportunity: OpportunityType.Pause,
    };

    if (OPPORTUNITY_BINGE === opportunityType) {
      opportunityInfo.arguments.set(
        'bingeAdStep',
        bingeAdStepsArray[bingeCounter],
      );
      opportunityInfo.arguments.set('episodeName', 'dummy_episode_name');
      opportunityInfo.arguments.set('episodeNumber', 'dummy_episode_number');
      opportunityInfo.arguments.set('seasonName', 'dummy_season_name');
      opportunityInfo.arguments.set('seasonNumber', 'dummy_season_number');
    }
    setRequestParameters(opportunityInfo.arguments);

    const exAd: ExecutableAd = xaafSdk.getExecutableAd(opportunityInfo);

    exAd.executableAdEventListener = _onAdEvent(exAd);
    exAd.executableAdHostHandlerListener = (
      request: string,
      requestArguments: Map<string, unknown>,
      callback: (errorEvent?: Error) => void,
    ) => {
      // TODO: should it always be SUCCESS?
      setHostRequestStatus('SUCCESS');
      setHostRequestType(request);
      callback();
    };

    setExecutableAd(exAd);
    setAdRequestId(newAdRequestId);
  };

  const _onXaafEvent = ({ type, error }: XaafEvent): void => {
    console.log(`[ClientApp::_onXaafEvent] ${type} received in callback`);
    setLoginEventType(type);
    if (error) {
      console.error(error);
    }
  };

  const pauseAd = (): void => {
    setIsPlayPauseAdFlow(true);
    _stopAd();
  };

  const playAd = (): void => {
    setIsPlayPauseAdFlow(true);
    _onCreatePress();
  };

  const _playMovie = (): void => _videoRef.current?.play();

  const _pauseMovie = (): void => _videoRef.current?.pause();

  const _failAd = (): void => {
    if (!isHostVisible) {
      executableAd?.['_failAd']('player error', {
        name: 'general error',
        message: 'sample ad general error',
      });
    }
  };

  const _initAd = (): void => {
    initAdInfoMapper.set('hostRequestId', adRequestId);
    executableAd?.initAd(
      _xaafAdContainerRef.current,
      initAdInfoMapper,
      _squeezeRef.current,
    );
  };

  const _onStartPress = (): void => {
    console.log(
      `[ClientApp::_onStartPress] will start ad... (adStartTimeout: ${adStartTimeout}ms)`,
    );
    if (selectedExperience.includes('Squeeze')) {
      console.log(
        `[ClientApp::_onStartPress] [selectedExperience] ${selectedExperience}, is Squeeze`,
      );
    }

    setAdVisible(true);
    setExecutableAdAttributeEvent(
      `${executableAd?.getAttribute(AttributeNames.STATE)}`,
    );
    setIsPlayPauseAdFlow(false);
    _startAd();
  };

  const _startAd = (): void => {
    setTimeout(() => {
      console.log('[ClientApp::_startAd] starting ad');
      executableAd?.startAd(_xaafAdContainerRef.current);
    }, adStartTimeout);
  };

  const _onReady = (): void => {
    if (OPPORTUNITY_BINGE === opportunityType) {
      _goToNextEpisode();
    } else {
      _playMovie();
    }
  };

  useEffect(() => {
    if (isPlayPauseAdFlow) {
      _initAd();
    }
    if (
      OPPORTUNITY_BINGE === opportunityType &&
      bingeCounter < MAX_OF_BINGE_ADS + 1
    ) {
      _initAd();
    }
    setExecutableAdAttributeEvent(`${executableAd?.currentState}`);
  }, [executableAd]);

  useEffect(() => {
    if (isPlayPauseAdFlow) {
      _onStartPress();
    }
  }, [adLifeCycleProjectId]);

  const _stopAd = (): void => executableAd?.stopAd();

  const _stopAdWithAction = (): void => executableAd?.stopAd('', true);

  useEffect(() => {
    setOpportunityType(
      selectedExperience.includes('Binge')
        ? OPPORTUNITY_BINGE
        : OPPORTUNITY_SCREENSAVER,
    );
  }, [selectedExperience]);

  useEffect(() => {
    if (OPPORTUNITY_BINGE === opportunityType && isAdLoaded) {
      _startAd();
    }
  }, [isAdLoaded]);

  useEffect(() => {
    if (OPPORTUNITY_BINGE === opportunityType && isAdStopped) {
      _playMovie();
    }
  }, [isAdStopped]);

  return (
    <FocusContext.Provider value={focusKey}>
      <XaafContext.Provider
        value={{ selectedApiKey, loginRequestId, adRequestId, platformAdvId }}
      >
        <SafeAreaView>
          <View style={styles.title}>
            <XaafDemoTitle />
          </View>
          <View style={styles.contentContainer}>
            {isConfigDisplayed ? (
              <ConfigurationScreen
                onApiKeyChange={(newApiKey: ApiKey): void => {
                  setSdkInitialized(false);
                  setSelectedApiKey(newApiKey);
                }}
                customAdStartDelayHint={customAdStartDelayHint}
                adStartDelayHintChanged={(text: string): void => {
                  const customAdStartDelayHint = Number.parseInt(text);
                  setCustomAdStartDelayHint(customAdStartDelayHint);
                }}
                adStartDelayHintEndEditing={(): void => {
                  initAdInfoMapper.set(
                    'adStartDelayHint',
                    customAdStartDelayHint.toString(),
                  );
                  setAdStartTimeout(customAdStartDelayHint);
                }}
                customProjectId={customProjectId}
                projectIdChanged={(text: string): void => {
                  const customProjectId = Number.parseInt(text);
                  setCustomProjectId(customProjectId);
                }}
                projectIdEndEditing={(): void => {
                  initAdInfoMapper.set('projectId', customProjectId.toString());
                  setCustomProjectId(customProjectId);
                }}
                selectedExperience={selectedExperience}
                onExperienceChange={(newExperience: string): void => {
                  console.log(
                    `[ClientApp::onExperienceChange] selected ${newExperience} experience`,
                  );
                  MockServerAPI.selectExperience(newExperience);
                  setSelectedExperience(newExperience);
                }}
                onSavePress={(): void => {
                  if (!isSdkInitialized) {
                    _initXaaf();
                  }
                  setConfigDisplayed(false);
                  if (OPPORTUNITY_BINGE === opportunityType) {
                    setHostVisible(false);
                    setAdVisible(true);
                  }
                }}
              />
            ) : (
              <React.Fragment>
                {OPPORTUNITY_SCREENSAVER === opportunityType ? (
                  <ApiButtons
                    onConfigPress={(): void => setConfigDisplayed(true)}
                    onCreatePress={_onCreatePress}
                    onInitPress={(): void => _initAd()}
                    onStartPress={_onStartPress}
                    onStopPress={(): void => {
                      setHostRequestStatus('N/A');
                      setHostRequestType('N/A');
                      _stopAd();
                    }}
                    executableAdAction={executableAdAction}
                    onStopPressWithAction={(): void => {
                      setHostRequestStatus('N/A');
                      setHostRequestType('N/A');
                      _stopAdWithAction();
                    }}
                  />
                ) : (
                  <BingeApiButtons
                    onConfigPress={(): void => setConfigDisplayed(true)}
                  />
                )}
                <PanelSeparator />
                <PlayerView
                  isAdVisible={isAdVisible}
                  onChangeProgramPress={_onChangeProgramPress}
                  onGoToNextEpisodePress={_goToNextEpisode}
                  onPlayPress={playAd}
                  onPausePress={pauseAd}
                  onErrorPress={_failAd}
                  isHostVisible={isHostVisible}
                  squeezeRef={_squeezeRef}
                  ref={_videoRef}
                  xaafAdContainerRef={_xaafAdContainerRef}
                  onReady={_onReady}
                  onErrorOccurred={(error: VideoError) => console.error(error)}
                  source={videoContainer[currentVideoIndex].video}
                  experienceName={selectedExperience}
                />
                <PanelSeparator />
                <LogsPanel
                  event={event}
                  loginEventType={loginEventType}
                  executableAdAttributeEvent={executableAdAttributeEvent}
                  adLifeCycleProjectId={adLifeCycleProjectId}
                  adLifeCycleProjectBuildNumber={adLifeCycleProjectBuildNumber}
                  hostRequestStatus={hostRequestStatus}
                  hostRequestType={hostRequestType}
                  requestParameters={requestParameters}
                />
              </React.Fragment>
            )}
          </View>
        </SafeAreaView>
      </XaafContext.Provider>
    </FocusContext.Provider>

  );
};

export default Home;
