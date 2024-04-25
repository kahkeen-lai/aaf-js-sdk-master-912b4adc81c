/* eslint-disable unicorn/string-content */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import React, { Component } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, NativeSyntheticEvent, ImageErrorEventData } from 'react-native';
import * as Xaaf from '@xaaf/xaaf-js-sdk';

export interface XaafImageAdProps {
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

export interface XaafImageAdState extends Xaaf.XaafImageData {
    isDisplayed: boolean;
    url: string;
}

export class XaafImageAd extends Component<XaafImageAdProps, XaafImageAdState> implements Xaaf.XaafImageElement {
    private imageRef: React.RefObject<Image>;
    public xaafElementListener: Xaaf.XaafImageListener;
    private _loggerService = Xaaf.LoggerService.getInstance();

    constructor(props: XaafImageAdProps) {
        super(props);

        this.state = {
            url: '',
            isDisplayed: false
        };

        this.imageRef = React.createRef<Image>();
    }

    setData(data: XaafImageAdState): void {
        this.setState({
            ...data
        });
    }

    updateData(data: Partial<XaafImageAdState>): void {
        this.setState({
            ...this.state,
            ...data
        });
    }

    show(): void {
        this.setState({ isDisplayed: true });
        //TODO Royi - async?
        this._handleImageShown();
    }

    hide(): void {
        this.setState({ isDisplayed: false });
        this._reset();
    }

    private _reset(): void {
        this.setData({
            url: '',
            isDisplayed: false
        });
    }

    render(): JSX.Element {
        return (
            <View testID={'e2e_view_XAAF'} style={this.props.style}>
                <>
                    <Image
                        ref={this.imageRef}
                        style={this.state.isDisplayed ? styles.showImage : styles.hideImage}
                        source={{ uri: this.state.url }}
                        onError={this._handleImageError}
                        onLoad={this._handleImageLoaded}
                    />
                    {this.state.isDisplayed && this._handleImageLoaded()}
                </>
            </View>
        );
    }

    private _handleImageError = (error: NativeSyntheticEvent<ImageErrorEventData>): void => {
        this._loggerService?.error(`[XaafImageAd::_handleImageError] - ${error}`);
        if (this.xaafElementListener) {
            this.xaafElementListener.onImageLoadingError({
                message: error?.nativeEvent?.error?.toString(),
                errorEndPoint: this.state.url
            });
        }
    };

    private _handleImageLoaded = (): void => {
        this._loggerService?.debug('[XaafImageAd::_handleImageLoaded]');
        if (this.xaafElementListener) {
            this.xaafElementListener.onImageLoaded();
        }
    };

    private _handleImageShown = (): void => {
        this._loggerService?.debug('[XaafImageAd::_handleImageShown]');
        if (this.xaafElementListener) {
            this.xaafElementListener.onImageShown();
        }
    };
}

const styles = StyleSheet.create({
    showImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    hideImage: {
        width: '0.1%',
        height: '0.1%',
        resizeMode: 'contain'
    }
});
