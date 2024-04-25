import { XaafVideoElement } from './video';
import { XaafSlideShowElement } from './slide-show';
import { XaafImageElement } from './image';
import { XaafDynamicElement } from '@xaaf/common';

export enum XaafElementType {
    Video = 1,
    SlideShow,
    Image,
    DynamicView
}

export interface XaafContainerListener<E> {
    onElementReady(element: E);
}

export interface XaafAdContainer {
    setElementType(
        elementType: XaafElementType.Video,
        xaafContainerListener: XaafContainerListener<XaafVideoElement>
    ): void;
    setElementType(
        elementType: XaafElementType.SlideShow,
        xaafContainerListener: XaafContainerListener<XaafSlideShowElement>
    ): void;
    setElementType(
        elementType: XaafElementType.Image,
        xaafContainerListener: XaafContainerListener<XaafImageElement>
    ): void;
    setElementType(
        elementType: XaafElementType.DynamicView,
        xaafContainerListener: XaafContainerListener<XaafDynamicElement>
    ): void;
    clearElementType(): void;
}
