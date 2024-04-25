/**
 *
 * @description XaafVideoPlayer.tsx
 * @version 1.0.0
 * @since 26 January 2023
 *
 */

import React from 'react';
import Video, {LoadError, OnLoadData} from 'react-native-video';

import {toHttps} from '../utils/videoHelpers';
import {VideoPlayerProps} from '../typings/video';

export type Props = VideoPlayerProps;
type State = {
  muted: boolean;
  isPaused: boolean;
};
class XaafVideoPlayer extends React.PureComponent<Props, State> {
  private readonly videoRef = React.createRef<Video>();
  private onLoadCalledOnce;

  constructor(props: Props) {
    super(props);

    this.state = {
      muted: false,
      isPaused: false,
    };
    this.onLoadCalledOnce = React.createRef<boolean>();
  }

  mute = () => {
    this.setState({muted: true});
  };

  unmute = () => {
    this.setState({muted: false});
  };

  play = () => {
    const {onPlaying} = this.props;

    this.setState({isPaused: false});
    onPlaying();
  };

  pause = () => {
    this.setState({isPaused: true});
  };

  stop = () => {
    this.pause();
  };

  seek = (time: number) => {
    this.videoRef.current?.seek(time);
  };

  onReady = (data?: OnLoadData) => {
    const {onCurrentTimeUpdated, onDurationChanged} = this.props;

    onDurationChanged((data?.duration * 1000) || 0);
    onCurrentTimeUpdated((data?.currentTime*1000) || 0);
  };

  onPreparing = () => {
    if (!this.onLoadCalledOnce.current) {
      const {onPreparing} = this.props;
      onPreparing();

      this.onLoadCalledOnce.current = true;
    }
  };

  onReadyForDisplay = () => {
    const {onReady} = this.props;
    this.setState({isPaused: true});
    onReady();
  };

  onError = (error: LoadError) => {
    const {onErrorOccurred} = this.props;
    onErrorOccurred(error.error.errorString);
  };

  render() {
    const {
      source: {uri, type = 'MP4'},
      bufferLength: {maxBufferLength, minBufferLength},
      onBufferingStarted,
      onPlaybackComplete,
      onPlaying,
      onDurationChanged,
      onCurrentTimeUpdated,
    } = this.props;
    return (
      <Video
        repeat={true}
        resizeMode={'contain'}
        controls={this.props.controls}
        ref={this.videoRef}
        style={this.props.style}
        source={{
          uri: toHttps(uri),
          type,
        }}
        muted={this.state.muted}
        bufferConfig={{
          minBufferMs: minBufferLength,
          maxBufferMs: maxBufferLength,
        }}
        onLoad={this.onReady}
        onLoadStart={this.onPreparing}
        onEnd={onPlaybackComplete}
        onError={this.onError}
        paused={this.state.isPaused}
        onProgress={({playableDuration, currentTime, seekableDuration}) => {
          if (playableDuration !== 0 && playableDuration < currentTime) {
            onBufferingStarted();
          }
          onCurrentTimeUpdated(currentTime*1000);
          if (seekableDuration - currentTime < 0.3) {
            this.pause();
            onPlaybackComplete();
          }
        }}
        onReadyForDisplay={() => {
          console.log('onReadyForDisplay');
          this.onReadyForDisplay();
        }}
      />
    );
  }
}

export default XaafVideoPlayer;
