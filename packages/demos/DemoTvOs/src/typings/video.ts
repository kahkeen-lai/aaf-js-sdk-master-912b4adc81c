import {RefObject} from 'react';
import {NativeSyntheticEvent} from 'react-native';

export type BufferLengthType = {
  minBufferLength: number;
  maxBufferLength: number;
};

export type VideoPlayerProps = {
  controls?: boolean;
  ref?: RefObject<VideoPlayerHandle> | null;
  style?: object;
  bufferLength: BufferLengthType;
  source: {
    type: string;
    uri: string;
    drmScheme?: string;
    startTimeMs?: number;
    headers?: object;
    drmInfo?: object;
  };
  onPreparing: () => void;
  onPaused: () => void;
  onFinalized: () => void;
  onPlaying: () => void;
  onErrorOccurred: (errorMessage: string) => void;
  onPlaybackComplete: () => void;
  onDurationChanged: (duration: number) => void;
  onReady: () => void;
  onBufferingStarted: () => void;
  onBufferingEnded: () => void;
  onCurrentTimeUpdated: (currentTime: number) => void;
  onStateChanged: (state: string) => void;
};

export type VideoPlayerHandle = {
  pause: () => void;
  play: () => void;
  seek: (time: number) => void;
};
