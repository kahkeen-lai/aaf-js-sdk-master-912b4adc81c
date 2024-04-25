import { BaseXaafElement } from '@xaaf/common';

export interface XaafSqueezeData {
    duration: number;
    backgroundColor?: string;
    videoScale: VideoScale;
    videoMargin?: VideoMargin;
    videoBorder?: VideoBorder;
}

export interface VideoScale {
    scaleX: number;
    scaleY: number;
    pivotX: number;
    pivotY: number;
}

export interface VideoMargin {
    left: string;
    top: string;
    right: string;
    bottom: string;
}

export interface VideoBorder {
    state: BorderState;
    mode: BorderMode;
    width?: string;
    color?: string;
    style?: string;
}

export enum BorderState {
    show = 'SHOW',
    hide = 'HIDE'
}

export enum BorderMode {
    pre = 'PRE',
    completed = 'COMPLETED'
}

export interface XaafSqueezeElement extends BaseXaafElement<XaafSqueezeListener, XaafSqueezeData> {
    squeeze(): void;
}

export interface XaafSqueezeListener {
    onError(error: SqueezeError): void;
    onSqueezeStarted(): void;
    onSqueezeEnded(): void;
}

export interface SqueezeError {
    message: string;
    errorEndPoint: string;
}
