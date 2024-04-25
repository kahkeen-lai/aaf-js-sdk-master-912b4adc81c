// @ts-nocheck
import React, { Component, ComponentType, ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { VideoPlayerProps } from '../typings/video';
import { useFetcher } from 'react-router-dom';

export interface XaafVideoProps {
    style?: StyleProp<ViewStyle>;
    testID?: string;
    children?: (value: VideoPlayerProps) => ReactNode;
}

export interface XaafVideoState extends Xaaf.XaafVideoData {
    isReady?: boolean;
    bufferLengthMs?: number;
}

const styles = StyleSheet.create({
    video: { ...StyleSheet.absoluteFillObject }
});

export class XaafVideo extends Component<XaafVideoProps, XaafVideoState> implements Xaaf.XaafVideoElement {
    xaafElementListener: Xaaf.XaafVideoListener;

    private readonly _loggerService = Xaaf.LoggerService.getInstance();
    private readonly _videoRef: any;
    private readonly _defaultState: XaafVideoState = {
        url: '',
        urlType: 'MP4',
        buffer: {
            maxBuffer: 0,
            minBuffer: 0
        },
        isReady: false
    };

    constructor(props: XaafVideoProps) {
        super(props);
        this.state = this._defaultState;
        this._videoRef = React.createRef();
    }

    shouldComponentUpdate(_nextProps: Readonly<XaafVideoProps>, nextState: Readonly<XaafVideoState>): boolean {
        return this.state.url !== nextState.url;
    }

    setData = (data: XaafVideoState): void => {
        this.setState({
            ...data
        });
    };

    updateData = (data: Partial<XaafVideoState>): void => {
        this.setState({
            ...this.state,
            ...data
        });
    };

    play = (): void => {
        this._videoRef.current?.play();
        this._loggerService.info('onPlaying called.');
    };

    stop = (): void => {
        this._videoRef.current?.stop();
        this._loggerService.info('stop called.');
        this._reset();
    };

    pause = (): void => {
        this._videoRef.current?.pause();
        this._loggerService.info('onPaused called.');
    };

    rewind = (): void => {
        this._videoRef.current?.seek(0,true);
        this._loggerService.info('rewind called.');
    };

    async getCurrentBuffer(): Promise<number> {
        if (!this.state.isReady) {
            return 0;
        }
        return this.state.buffer.maxBuffer;
    }

    private _toHttps(url: string): string {
        return url ? url.replace('http://', 'https://') : '';
    }

    private _reset = (): void => {
        this.setData(this._defaultState);
    };

    private _onErrorOccurred = (errorMessage: string): void => {
        this._loggerService.info(`[xaaf-ad::_onErrorOccurred] ${errorMessage}`);
        if (this.xaafElementListener) {
            this.xaafElementListener.onPlayerError({
                message: errorMessage,
                errorEndPoint: this.state.url
            });
        }
        this._reset();
    };

    private _onCurrentTimeUpdated(currentTime: number): void {
        this.xaafElementListener?.onCurrentTimeUpdated(currentTime);
    }

    private _onReady = (): void => {
        this._loggerService.info('[xaaf-ad::_onReady]');
        this.updateData({ isReady: true });
        // this._videoRef.current?.getPlayerInformation().then(({ name, version }) => {
        //     this._loggerService.info(`[xaaf-ad::_onReady] player: ${name} ${version}`);
        // });
    };

    private _handleOnPreparing = () => {
        this._loggerService.info('onPreparing called.');
    };

    private _handleOnPaused = () => {
        this._loggerService.info('onPaused called.');
    };

    private _handleOnFinalized = () => {
        this.xaafElementListener?.onFinalized();
    };

    private _handleOnPlaying = () => {
        this.xaafElementListener?.onPlaying();
    };

    private _handleOnDurationChanged = (duration: number) => {
        if(duration>0) this.xaafElementListener?.onDurationChanged(duration);
    };

    private _handleOnCurrentTimeUpdated = (currentTime: number) => {
        if(currentTime>0) this._onCurrentTimeUpdated(currentTime);
    };

    private _handleOnBufferingStarted = () => {
        this.xaafElementListener?.onBufferingStarted();
    };

    private _handleOnBufferingEnded = () => {
        this.xaafElementListener?.onBufferingEnded();
    };

    private _handleOnPlaybackComplete = () => {
        this._loggerService.info(`[xaaf-ad::_PlaybackComplete]`);
        this.xaafElementListener?.onPlaybackComplete();
    };

    private _handleOnStateChanged = (state: string) => {
        this._loggerService.info(`[xaaf-ad::_onStateChanged] playback: ${state}`);
    };

    // eslint-disable-next-line @typescript-eslint/member-ordering
    render(): JSX.Element {
        if (!this.state.url) {
            return null;
        }

        return (
            <View testID={'e2e_view_XAAF'} style={this.props.style}>
                {this.props.children({
                    ref: this._videoRef,
                    source: {
                        uri: this._toHttps(this.state.url),
                        type: this.state.urlType
                    },
                    bufferLength: {
                        minBufferLength: this.state.buffer.minBuffer,
                        maxBufferLength: this.state.buffer.maxBuffer
                    },
                    onReady: this._onReady,
                    onPreparing: this._handleOnPreparing,
                    onPaused: this._handleOnPaused,
                    onFinalized: this._handleOnFinalized,
                    onPlaying: this._handleOnPlaying,
                    onDurationChanged: this._handleOnDurationChanged,
                    onCurrentTimeUpdated: this._handleOnCurrentTimeUpdated,
                    onBufferingStarted: this._handleOnBufferingStarted,
                    onBufferingEnded: this._handleOnBufferingEnded,
                    onPlaybackComplete: this._handleOnPlaybackComplete,
                    onStateChanged: this._handleOnStateChanged,
                    onErrorOccurred: this._onErrorOccurred
                })}
            </View>
        );
    }
}
