import { BaseXaafElement } from '@xaaf/common';
import { ZOrder } from './video';

export interface XaafImageData {
    url: string;
    zOrder?: ZOrder;
}

export interface XaafImageElement extends BaseXaafElement<XaafImageListener, XaafImageData> {
    show(): void;
    hide(): void;
}

export interface XaafImageListener {
    onImageLoadingError(imageLoadingError: ImageLoadingError): void;
    onImageLoaded(): void;
    onImageShown(): void;
}

export interface ImageLoadingError {
    message: string;
    errorEndPoint: string;
}
