/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import React, { Component } from 'react';
import { StyleProp, ViewStyle, Animated, LayoutChangeEvent, View } from 'react-native';
import * as Xaaf from '@xaaf/xaaf-js-sdk';

interface Dimensions {
    width: number;
    height: number;
}

export interface XaafSqueezeProps {
    style?: StyleProp<ViewStyle>;
    testID?: string;
    children?: React.ReactNode;
}

export interface XaafSqueezeState {
    moveXY: Animated.ValueXY;
    styleAnimation: Animated.WithAnimatedObject<ViewStyle>;
    heightAnimation: Animated.Value;
    widthAnimation: Animated.Value;
    containerBackgroundColor?: string;
}

export class XaafSqueeze extends Component<XaafSqueezeProps, XaafSqueezeState> implements Xaaf.XaafSqueezeElement {
    xaafElementListener: Xaaf.XaafSqueezeListener;
    private _loggerService = Xaaf.LoggerService.getInstance();
    private _squeezeData: Xaaf.XaafSqueezeData = {
        duration: 0,
        videoScale: { scaleX: 1.0, scaleY: 1.0, pivotX: 0.0, pivotY: 0.0 },
        videoMargin: { left: '0', top: '0', right: '0', bottom: '0' },
        videoBorder: null
    };

    private _currentElementDimensions: Dimensions = { width: 0, height: 0 };
    private _initialElementDimensions: Dimensions = { width: 0, height: 0 };
    private _xOffset: number = 0;
    private _yOffset: number = 0;

    constructor(props: XaafSqueezeProps) {
        super(props);

        this.state = {
            styleAnimation: null,
            moveXY: new Animated.ValueXY({ x: 0.0, y: 0.0 }),
            heightAnimation: new Animated.Value(0),
            widthAnimation: new Animated.Value(0)
        };
    }

    setData(data: Xaaf.XaafSqueezeData): void {
        this._squeezeData = {
            ...this._squeezeData,
            ...data
        };

        const { scaleX, scaleY } = data.videoScale;
        const { height, width } = this._initialElementDimensions;
        if (this._isCurrentElementDimensionsEqualsToInitialElementDimensions) {
            this._xOffset = width * (1 - scaleX);
            this._yOffset = height * (1 - scaleY);
        }

        this.setState({
            containerBackgroundColor: this._squeezeData.backgroundColor
        });
    }

    private get _isCurrentElementDimensionsEqualsToInitialElementDimensions(): boolean {
        return (
            this._initialElementDimensions.width === this._currentElementDimensions.width &&
            this._initialElementDimensions.height === this._currentElementDimensions.height
        );
    }

    private _saveInitialElementLayout: (event: LayoutChangeEvent) => void = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        const { scaleX, scaleY } = this._squeezeData.videoScale;

        this._initialElementDimensions = { width, height };
        this._currentElementDimensions = { width, height };
        this._xOffset = width * (1 - scaleX);
        this._yOffset = height * (1 - scaleY);

        this.state.heightAnimation.setValue(height);
        this.state.widthAnimation.setValue(width);

        this.setState({
            styleAnimation: {
                height: this.state.heightAnimation,
                width: this.state.widthAnimation
            }
        });
    };

    private _moveXInterpolation(): Animated.AnimatedInterpolation {
        return this.state.moveXY.x.interpolate({
            inputRange: [0, 1],
            outputRange: [
                this._parseInt(this._squeezeData.videoMargin?.left, 0),
                this._xOffset - this._parseInt(this._squeezeData.videoMargin?.right, 0)
            ]
        });
    }

    private _moveYInterpolation(): Animated.AnimatedInterpolation {
        return this.state.moveXY.y.interpolate({
            inputRange: [0, 1],
            outputRange: [
                this._parseInt(this._squeezeData.videoMargin?.top, 0),
                this._yOffset - this._parseInt(this._squeezeData.videoMargin?.bottom, 0)
            ]
        });
    }

    private _updateCurrentElementDimensions(): void {
        const { width, height } = this._initialElementDimensions;
        const { scaleX, scaleY } = this._squeezeData.videoScale;
        this._currentElementDimensions = {
            height: height * scaleY,
            width: width * scaleX
        };
    }

    squeeze(): void {
        const animations = this._getCompositeAnimations();
        this._handleSqueezeStarted(),
            this._updateCurrentElementDimensions(),
            Animated.parallel(animations).start(({ finished }) => {
                finished ? this._handleSqueezeEnded() : this._handleSqueezeError();
            });
    }

    private _getCompositeAnimations(): Animated.CompositeAnimation[] {
        const { width, height } = this._initialElementDimensions;

        const widthAnimation = Animated.timing(this.state.widthAnimation, {
            toValue: width * this._squeezeData.videoScale.scaleX,
            duration: this._squeezeData.duration,
            useNativeDriver: false
        });

        const heightAnimation = Animated.timing(this.state.heightAnimation, {
            toValue: height * this._squeezeData.videoScale.scaleY,
            duration: this._squeezeData.duration,
            useNativeDriver: false
        });

        const positionAnimation = Animated.timing(this.state.moveXY, {
            toValue: { x: this._squeezeData.videoScale.pivotX, y: this._squeezeData.videoScale.pivotY },
            duration: this._squeezeData.duration,
            useNativeDriver: false
        });

        return [widthAnimation, heightAnimation, positionAnimation];
    }

    private _showBorderIfNeeded(): void {
        const shouldShowBorder =
            this._squeezeData.videoBorder &&
            this._squeezeData.videoBorder.width &&
            this._squeezeData.videoBorder.color &&
            this._squeezeData.videoBorder.mode === Xaaf.BorderMode.pre &&
            this._squeezeData.videoBorder.state === Xaaf.BorderState.show;

        if (shouldShowBorder) {
            this.setState({
                styleAnimation: {
                    ...this.state.styleAnimation,
                    borderWidth: this._parseInt(this._squeezeData.videoBorder?.width, 0),
                    borderColor: this._squeezeData.videoBorder.color
                }
            });
        }
    }

    private _removeBorderIfNeeded(): void {
        const shouldHideBorder =
            this._squeezeData.videoBorder &&
            this._squeezeData.videoBorder.mode === Xaaf.BorderMode.completed &&
            this._squeezeData.videoBorder.state === Xaaf.BorderState.hide;

        if (shouldHideBorder) {
            this.setState({
                styleAnimation: {
                    ...this.state.styleAnimation,
                    borderWidth: 0,
                    borderColor: ''
                }
            });
        }
    }

    render(): JSX.Element {
        const positionStyleAnimation = {
            transform: [{ translateX: this._moveXInterpolation() }, { translateY: this._moveYInterpolation() }]
        };

        return (
            <View
                style={{ flex: 1, backgroundColor: this.state.containerBackgroundColor }}
                onLayout={this._saveInitialElementLayout}
            >
                <Animated.View style={[positionStyleAnimation]}>
                    <Animated.View testID={'e2e_view_AAF'} style={[this.state.styleAnimation]}>
                        {this.props.children}
                    </Animated.View>
                </Animated.View>
            </View>
        );
    }

    private _handleSqueezeError(): void {
        this._loggerService?.error('[XaafSqueeze::_handleSqueezeError] - Animation has stopped');
        if (this.xaafElementListener) {
            this.xaafElementListener.onError({
                message: 'Squeeze animation has not finished successfully',
                errorEndPoint: '[XaafSqueeze::_handleSqueezeError]'
            });
        }
    }

    private _handleSqueezeStarted(): void {
        this._loggerService?.debug('[XaafSqueeze::_handleSqueezeStarted]');
        this._showBorderIfNeeded();
        if (this.xaafElementListener) {
            this.xaafElementListener.onSqueezeStarted();
        }
    }

    private _handleSqueezeEnded(): void {
        this._loggerService?.debug(
            `[XaafSqueeze::_handleSqueezeEnded] current element width: ${this._currentElementDimensions.width} height: ${this._currentElementDimensions.height}`
        );
        this._removeBorderIfNeeded();
        if (this.xaafElementListener) {
            this.xaafElementListener.onSqueezeEnded();
        }
    }

    private _parseInt(value: string, defaultValue: number): number {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }

        return Number.parseInt(value);
    }
}
