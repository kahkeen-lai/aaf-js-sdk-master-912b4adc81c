import { VideoBorder, VideoMargin } from '../elements';

export interface SqueezeCommandData {
    duration: number;
    backgroundColor?: string;
    videoScale: VideoScale;
    videoMargin: VideoMargin;
    videoBorder?: VideoBorder;
}

interface VideoScale {
    scale_x: number;
    scale_y: number;
    pivot_x: number;
    pivot_y: number;
}
