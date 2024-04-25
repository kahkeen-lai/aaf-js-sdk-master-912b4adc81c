import React, { ForwardedRef } from "react";
import Video, { LoadError, OnLoadData } from "react-native-video";
import { styles } from "../styles/styles";
import XaafVideoPlayer, { Props } from "./xaaf-video-player";
import {toHttps} from '../utils/videoHelpers';

const VideoComponent = React.forwardRef<any, Props>((props, ref) => {
//  const videoRef = React.useRef<Video | null>(null);
  const [muted, setMuted] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const onLoadCalledOnce = React.useRef<boolean>(false);

  const mute = () => {
    setMuted(true);
  };

  const unmute = () => {
    setMuted(false);
  };

  const play = () => {
    const { onPlaying } = props;
    setIsPaused(false);
    onPlaying();
  };

  const pause = () => {
    setIsPaused(true);
  };

  const stop = () => {
    pause();
  };

  const seek = (time: number) => {
    videoRef.current?.seek(time);
  };

  const onReady = (data?: OnLoadData) => {
    const { onCurrentTimeUpdated, onDurationChanged } = props;
    onDurationChanged((data?.duration || 0) * 1000);
    onCurrentTimeUpdated((data?.currentTime || 0) * 1000);
  };

  const onPreparing = () => {
    if (!onLoadCalledOnce.current) {
      const { onPreparing } = props;
      onPreparing();
      onLoadCalledOnce.current = true;
    }
  };

  const onReadyForDisplay = () => {
    const { onReady } = props;
    setIsPaused(true);
    onReady();
  };

  const onError = (error: LoadError) => {
    const { onErrorOccurred } = props;
    onErrorOccurred(error.error.errorString);
  };

  return (
    <Video
      repeat={true}
      resizeMode={'contain'}
      controls={props.controls}
      ref={ref}
      style={props.style}
      source={{
        uri: toHttps(props.source.uri),
        type: props.source.type,
      }}
      muted={muted}
      bufferConfig={{
        minBufferMs: props.bufferLength.minBufferLength,
        maxBufferMs: props.bufferLength.maxBufferLength,
      }}
      onLoad={onReady}
      onLoadStart={onPreparing}
      onEnd={props.onPlaybackComplete}
      onError={onError}
      paused={isPaused}
      onProgress={({ playableDuration, currentTime, seekableDuration }) => {
        if (playableDuration !== 0 && playableDuration < currentTime) {
          props.onBufferingStarted();
        }
        props.onCurrentTimeUpdated(currentTime * 1000);
        if (seekableDuration - currentTime < 0.3) {
          pause();
          props.onPlaybackComplete();
        }
      }}
      onReadyForDisplay={() => {
        onReadyForDisplay();
      }}
    />
  );
});

const XaafAdVideo = React.forwardRef<any, Props>((props, ref) => {
  return <VideoComponent ref={ref} {...props} />;
});

export default XaafAdVideo;