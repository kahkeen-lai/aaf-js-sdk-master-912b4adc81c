/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import RNative, { Animated, RegisteredStyle, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import React, { Component, ComponentType } from 'react';
import { youiRenderer } from './youi-renderer';

export interface TypesResolver<T> {
    get(type: string): T;
}

export class YouiTypesResolver implements TypesResolver<ComponentType> {
    get(type: string): ComponentType {
        return RNative[type];
    }
}

export const youiTypesResolver = new YouiTypesResolver();

interface AnimatedLoaderProps {
    style?: RegisteredStyle<ViewStyle>;
    opacity?: number;
    toValue?: number;
    duration?: number;
    children?: React.ReactNode;
}

interface AnimatedLoaderState {}

export class AnimatedLoader extends Component<AnimatedLoaderProps, AnimatedLoaderState> {
    state = {
        opacity: new Animated.Value(this.props.opacity)
    };

    componentDidMount(): void {
        youiRenderer.animationElements.push(this);
    }

    onLoad = (): void => {
        Animated.timing(this.state.opacity, {
            toValue: this.props.toValue,
            duration: this.props.duration,
            useNativeDriver: true
        }).start();
    };

    fadeOut(finished: () => void): void {
        Animated.timing(this.state.opacity, {
            toValue: 0,
            duration: this.props.duration,
            useNativeDriver: true
        }).start(finished);
    }

    render(): JSX.Element {
        return (
            <Animated.View onLayout={this.onLoad} style={[{ opacity: this.state.opacity }, this.props.style]}>
                {this.props.children}
            </Animated.View>
        );
    }
}

export class XaafTouchableWithoutFeedback extends TouchableWithoutFeedback {
    internalRef;
    render(): JSX.Element {
        return (
            <TouchableWithoutFeedback>
                <View ref={(component) => (this.internalRef = component)} style={this.props.style}>
                    {this.props.children}
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

RNative['Animated.View'] = AnimatedLoader;
RNative['XaafTouchableWithoutFeedback'] = XaafTouchableWithoutFeedback;
