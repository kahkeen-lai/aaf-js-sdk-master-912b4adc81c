/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import React, { Component } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { youiRenderer } from '../renderer/youi-renderer';
import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { AnimatedLoader } from '../renderer/youi-types';
import { ErrorCode } from '@xaaf/common';

export interface XaafDynamicAdProps {
    style?: StyleProp<ViewStyle>;
}

export interface XaafDynamicAdState {
    content: JSX.Element;
    visible: boolean;
}

export interface XaafDynamicAdElement {
    start(): void;
    setData(data: Xaaf.XaafDynamicViewData): void;
    stop(): void;
}

const styles = StyleSheet.create({
    removeElement: {
        opacity: 0
    },
    showElement: {
        opacity: 1
    }
});
export class XaafDynamicAd extends Component<XaafDynamicAdProps, XaafDynamicAdState>
    implements Xaaf.XaafDynamicElement {
    xaafElementListener: Xaaf.XaafDynamicElementListener;
    private _loggerService = Xaaf.LoggerService.getInstance();
    private _animationLoadersCount = 0;
    private _loadElementsCompletedCount = 0;
    private _timeOutToClear;
    private _showElement = false;
    private _elementReady = false;

    constructor(props: XaafDynamicAdProps) {
        super(props);

        this.state = {
            content: <></>,
            visible: false
        };
    }

    private _resetElementsData(): void {
        youiRenderer.resetElementsData();
        this._animationLoadersCount = 0;
        this._loadElementsCompletedCount = 0;
    }

    setTimer(): void {
        this._timeOutToClear = setTimeout(() => {
            this._loggerService.info('[xaaf-ad::timeout error::element load timeout]');
            this._callErrorListenerAndResetData();
        }, youiRenderer.timeout);
    }

    setData(dynamicView: Xaaf.XaafDynamicViewData): void {
        this._resetElementsData();
        youiRenderer.onLoad = this._onElementsLoadListener;
        youiRenderer.onError = this._onElementsErrorListener;
        youiRenderer.onClicked = this._onElementClickedListener;
        const content = youiRenderer.render(dynamicView);
        this.setState({
            content: content
        });
        if (youiRenderer.loadElementsTargetCount === 0) {
            this._elementReady = true;
        } else {
            this.setTimer();
        }
    }

    show(): void {
        this._showElement = true;
        if (this._elementReady) {
            this._loadElement();
        }
    }

    hide(): void {
        this._animationLoadersCount = youiRenderer.animationElements.length;
        this._checkIfAnimationFinishedAndCallOnCompleted();
        youiRenderer.animationElements.forEach((element) => {
            ((element as unknown) as AnimatedLoader).fadeOut(() => {
                this._animationLoadersCount--;
                this._checkIfAnimationFinishedAndCallOnCompleted();
            });
        });
    }

    private _checkIfAnimationFinishedAndCallOnCompleted(): void {
        if (this._animationLoadersCount === 0) {
            this.setState({
                visible: false
            });
            this.xaafElementListener.onCompleted(true);
        }
    }

    private _onElementClickedListener = (): void => {
        this.xaafElementListener.onCompleted(false);
    };

    private _onElementsLoadListener = (): void => {
        this._loadElementsCompletedCount++;
        this._checkIfLoadElementsCompletedAndShowElementIfNeeded();
    };

    private _onElementsErrorListener = (): void => {
        this._loggerService.info('[xaaf-ad::resource error::element could not be loaded]');
        this._callErrorListenerAndResetData();
    };

    private _callErrorListenerAndResetData(): void {
        this.xaafElementListener.onError(this._getXaafError());
        this._resetElementsData();
    }

    private _getXaafError(): Xaaf.XaafError {
        return {
            errorCode: ErrorCode.MissingResource,
            comment: '',
            message: 'xaaf-ad::resource error::element could not be loaded',
            httpErrorCode: ''
        };
    }

    private _loadElement(): void {
        this.setState({
            visible: true
        });
        this._loggerService.info('[xaaf-ad::_onLoad]');
        this.xaafElementListener.onLoad();
    }

    private _checkIfLoadElementsCompletedAndShowElementIfNeeded(): void {
        if (
            youiRenderer.loadElementsTargetCount === 0 ||
            this._loadElementsCompletedCount === youiRenderer.loadElementsTargetCount
        ) {
            clearTimeout(this._timeOutToClear);
            this._elementReady = true;

            if (this._showElement) {
                this._loadElement();
            }
        }
    }

    render(): JSX.Element {
        return (
            <View style={[this.props.style, this.state.visible ? styles.showElement : styles.removeElement]}>
                {this.state.content}
            </View>
        );
    }
}
