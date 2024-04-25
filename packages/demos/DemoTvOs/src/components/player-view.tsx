/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable-next-line unicorn/filename-case */
import React, {
  forwardRef,
  RefObject,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {StyleSheet, View} from 'react-native';
import {XaafText} from './xaaf-text';
import {XaafAd, XaafAdExtension, XaafElement} from '@xaaf/aaf-rn-sdk';
import {XaafButton} from './xaaf-button';
import {styles} from '../styles/styles';
import {formatAssetsPath} from '../utils/formatAssetsPath';
import Video, {LoadError} from 'react-native-video';
import XaafVideoPlayer from './xaaf-video-player';
import {VideoPlayerProps} from '../typings/video';
import XaafAdVideo from './xaaf-ad-video';

export interface PlayerViewProps {
  isAdVisible: boolean;
  onChangeProgramPress: () => void;
  onGoToNextEpisodePress: () => void;
  onPlayPress: () => void;
  onPausePress: () => void;
  onErrorPress: () => void;
  isHostVisible: boolean;
  squeezeRef: React.RefObject<any>;
  xaafAdContainerRef: React.RefObject<XaafElement>;
  onReady: () => void;
  onErrorOccurred: (error: LoadError) => void;
  source: {
    uri: string;
    type: string;
  };
  experienceName: string;
}

export type PlayerViewRef = Partial<
  Video & {play: () => void; pause: () => void}
>;

const PlayerView = forwardRef<PlayerViewRef, PlayerViewProps>(
  (
    {
      isAdVisible,
      onChangeProgramPress,
      onGoToNextEpisodePress,
      onPlayPress,
      onPausePress,
      onErrorPress,
      isHostVisible,
      squeezeRef,
      xaafAdContainerRef,
      onReady,
      onErrorOccurred,
      source,
      experienceName,
    },
    ref,
  ) => {
    const [isMuted, setMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const videoRef = useRef<Video>(null);

    const BUTTON_WIDTH = 200;

    useImperativeHandle(ref, () => ({
      ...(videoRef.current ?? {}),
      play,
      pause,
    }));

    const play = () => {
      if ((ref as RefObject<Video>)?.current) {
        setIsPaused(false);
      }
    };

    const pause = () => {
      if ((ref as RefObject<Video>)?.current) {
        setIsPaused(true);
      }
    };

    return (
      <View testID={'e2e_view_app_root'}>
        <View style={styles.main}>
          <View style={styles.panelTitle}>
            <XaafText value={'Demo Video'} />
            <XaafText value={experienceName} />
          </View>
          <View testID={'e2e_view_HOST'} style={styles.viewHost}>
            {/* TODO in dynamic view video should not be removed <View style={styles.video}>*/}
            <View style={isHostVisible ? styles.video : styles.removeElement}>
              {/* @ts-ignore */}
              <XaafAdExtension ref={squeezeRef}>
                <Video
                  style={styles.videoView}
                  source={source}
                  onError={onErrorOccurred}
                  onLoad={onReady}
                  muted={isMuted}
                  paused={isPaused}
                  ref={videoRef}
                  bufferConfig={{
                    minBufferMs: 50000,
                    maxBufferMs: 50000,
                  }}
                />
              </XaafAdExtension>
            </View>
            <View style={isAdVisible ? styles.adVisible : styles.adHidden}>
              {/* @ts-ignore */}
              {/* <XaafAd style={styles.xaafAdView} ref={xaafAdContainerRef}>
                {(props) => <XaafAdVideo {...props} />}
              </XaafAd> */}
              <XaafAd style={styles.xaafAdView} ref={xaafAdContainerRef}>
                {({
                  bufferLength,
                  onBufferingEnded,
                  onBufferingStarted,
                  onCurrentTimeUpdated,
                  onDurationChanged,
                  onErrorOccurred,
                  onFinalized,
                  onPaused,
                  onPlaybackComplete,
                  onPlaying,
                  onPreparing,
                  onReady,
                  onStateChanged,
                  source,
                  ...rest
                }: VideoPlayerProps) => (
                  <XaafVideoPlayer
                    // @ts-ignore
                    ref={ref}
                    controls={false}
                    style={videoStyles.video}
                    onReady={onReady}
                    onBufferingEnded={onBufferingEnded}
                    onBufferingStarted={onBufferingStarted}
                    onCurrentTimeUpdated={onCurrentTimeUpdated}
                    onDurationChanged={onDurationChanged}
                    onErrorOccurred={onErrorOccurred}
                    onFinalized={onFinalized}
                    onPaused={onPaused}
                    onStateChanged={onStateChanged}
                    onPlaybackComplete={onPlaybackComplete}
                    onPlaying={onPlaying}
                    onPreparing={onPreparing}
                    bufferLength={bufferLength}
                    source={source}
                    {...rest}
                  />
                )}
              </XaafAd>
            </View>
          </View>
          <View style={styles.horizontalPanel}>
            <XaafButton
              title="CHANGE PROGRAM"
              onPress={onChangeProgramPress}
              width={BUTTON_WIDTH}
            />
            <XaafButton
              title="NEXT EPISODE"
              imageSource={{uri: formatAssetsPath('next-episode.png')}}
              onPress={onGoToNextEpisodePress}
            />
            <XaafButton
              title={isHostVisible ? 'PLAY' : 'PAUSE'}
              onPress={isHostVisible ? onPlayPress : onPausePress}
              width={BUTTON_WIDTH}
            />
            <XaafButton
              title={isMuted ? 'UNMUTE' : 'MUTE'}
              onPress={() => setMuted(!isMuted)}
              width={BUTTON_WIDTH}
            />
            <XaafButton
              title="ERROR"
              onPress={onErrorPress}
              width={BUTTON_WIDTH}
            />
          </View>
        </View>
      </View>
    );
  },
);

const videoStyles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
});

export default PlayerView;
