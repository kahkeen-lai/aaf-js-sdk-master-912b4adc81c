import { BaseXaafElement } from '@xaaf/common';

export interface XaafVideoData {
    url: string;
    urlType?: string;
    muted?: boolean;
    preload?: boolean;
    autoplay?: boolean;
    transparent?: boolean;
    videoRepeatCount?: number;
    buffer?: VideoBuffer;
    zOrder?: ZOrder;
}

export type BooleanVideoOptions = Pick<XaafVideoData, 'transparent' | 'autoplay' | 'muted' | 'preload'>;

export interface VideoBuffer {
    minBuffer: number;
    maxBuffer: number;
}

export interface XaafVideoElement extends BaseXaafElement<XaafVideoListener, XaafVideoData> {
    play(): void;
    pause(): void;
    stop(): void;
    getCurrentBuffer(): Promise<number>;
    rewind(): void;
}

export interface XaafVideoListener {
    onPlayerError(playerError: PlayerError): void;
    onPlaybackComplete(): void;
    onBufferingStarted(): void;
    onBufferingEnded(): void;
    onPlaying(): void;
    onFinalized(): void;
    onCurrentTimeUpdated(time: Miliseconds): void;
    onDurationChanged(duration: Miliseconds): void;
}

export interface PlayerError {
    message: string;
    errorEndPoint: string;
}

export enum ZOrder {
    background = 'background',
    foreground = 'foreground'
}

export type Miliseconds = number;
export type Seconds = number;
