/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import React, { Component, ComponentType, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import {
    XaafAdContainer,
    XaafElementType,
    XaafContainerListener,
    ValidatorService,
    LoggerService
} from '@xaaf/xaaf-js-sdk';
import { XaafVideo } from './xaaf-video';
import { XaafImageAd } from './xaaf-image-ad';
import { XaafDynamicAd } from './xaaf-dynamic-ad';
import { VideoPlayerProps } from '../typings/video';

export interface XaafAdProps {
    style?: StyleProp<ViewStyle>;
    testID?: string;
    children?: (value: VideoPlayerProps) => ReactNode;
}

export interface XaafAdState {
    elementType: XaafElementType;
}

export class XaafAd extends Component<XaafAdProps, XaafAdState> implements XaafAdContainer {
    private _elementRef: unknown;
    private _xaafContainerListener: XaafContainerListener<unknown>;
    private _validatorService: ValidatorService = new ValidatorService();
    private _loggerService = LoggerService.getInstance();

    constructor(props: XaafAdProps) {
        super(props);
    }

    public setElementType(elementType: XaafElementType, xaafContainerListener: XaafContainerListener<unknown>): void {
        if (this._isInvalidXaafContainerListener(xaafContainerListener)) {
            this._loggerService.error(
                "[XaafAd::setElementType()] - element listener is invalid, won't be set, but previous one is cleared"
            );
            this._xaafContainerListener = undefined;
        } else {
            this._loggerService.debug('[XaafAd::setElementType()] - setting element listener');
            this._xaafContainerListener = xaafContainerListener;
        }

        this._loggerService.debug(`[XaafAd::setElementType()] - setting element type ${elementType}`);
        this.setState({ elementType: elementType });
    }

    private _isInvalidXaafContainerListener(xaafContainerListener: XaafContainerListener<unknown>): boolean {
        return !this._validatorService.isAFunction(xaafContainerListener.onElementReady);
    }

    render(): JSX.Element {
        return (
            <View style={this.props.style}>
                {this._isElementTypeVideo() && this._createXaafVideo()}
                {this._isElementTypeImage() && this._createXaafImage()}
                {this._isElementTypeDynanmicView() && this._createXaafDynamicView()}
            </View>
        );
    }

    private _isElementTypeDynanmicView(): boolean {
        return this.state?.elementType === XaafElementType.DynamicView;
    }

    private _isElementTypeVideo(): boolean {
        return this.state?.elementType === XaafElementType.Video;
    }

    private _isElementTypeImage(): boolean {
        return this.state?.elementType === XaafElementType.Image;
    }

    shouldComponentUpdate(_nextProps: Readonly<XaafAdProps>, nextState: Readonly<XaafAdState>): boolean {
        return this._state?.elementType !== nextState?.elementType;
    }

    private _createXaafVideo(): JSX.Element {
        this._loggerService.debug(`[XaafAd::_createXaafVideo()] - creating ${XaafVideo.name}`);
        return (
            <XaafVideo
                style={this.props.style}
                ref={(xaafAdVideo) => {
                    this._setXaafElementRefAndNotifyListener(xaafAdVideo);
                }}
                children={this.props.children}
            />
        );
    }

    private _createXaafDynamicView(): JSX.Element {
        this._loggerService.debug(`[XaafAd::_createXaafDynamicView()] - creating ${XaafDynamicAd.name}`);
        return (
            <XaafDynamicAd
                style={this.props.style}
                ref={(xaafDynamic) => {
                    this._setXaafElementRefAndNotifyListener(xaafDynamic);
                }}
            />
        );
    }

    private _createXaafImage(): JSX.Element {
        this._loggerService.debug(`[XaafAd::_createXaafImage()] - creating ${XaafImageAd.name}`);
        return (
            <XaafImageAd
                style={this.props.style}
                ref={(xaafImage) => {
                    this._setXaafElementRefAndNotifyListener(xaafImage);
                }}
            />
        );
    }

    private _setXaafElementRefAndNotifyListener(xaafElement: unknown): void {
        if (this._isInvalidXaafElement(xaafElement)) {
            this._loggerService.warning(
                '[XaafAd::_setXaafElementRefAndNotifyListener()] - element is undefined or null'
            );
            return;
        }

        /* since the renderer performs lots of renders, we don't want to store the same
        XAAF element and specially notify the listener more than once.
        */
        if (this._isXaafElementAlreadyStored(xaafElement)) {
            this._loggerService.warning(
                `[XaafAd::_setXaafElementRefAndNotifyListener()] - AAF element ${xaafElement} already stored, doing nothing`
            );
            return;
        }

        this._loggerService.debug(
            `[XaafAd::_setXaafElementRefAndNotifyListener()] - storing AAF element ${xaafElement} and notifying listener`
        );
        this._elementRef = xaafElement;
        this._xaafContainerListener?.onElementReady(xaafElement);
    }

    private _isInvalidXaafElement(xaafElement: unknown): boolean {
        return xaafElement === undefined || xaafElement === null;
    }

    private _isXaafElementAlreadyStored(xaafElement: unknown): boolean {
        return this._elementRef === xaafElement;
    }

    public clearElementType(): void {
        this._loggerService.debug('[XaafAd::clearElementType()] - clearing element type and element listener');
        this._xaafContainerListener = undefined;
        this._elementRef = undefined;
        this.setState({ elementType: undefined });
    }
}
