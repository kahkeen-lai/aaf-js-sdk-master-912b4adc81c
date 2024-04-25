import { ZOrder } from '../elements';

export interface VideoCommandData {
    url: string;
    videoRepeatCount: number;
    videoOptions?: string[];
    transparent?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    preload?: boolean;
    zOrder?: ZOrder;
}
