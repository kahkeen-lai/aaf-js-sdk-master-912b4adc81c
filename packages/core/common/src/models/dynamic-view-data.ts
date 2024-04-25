import { XaafError } from './error';

export interface JsonObject {
    [key: string]: string | number | boolean | JsonObject | JsonObject[];
}

export interface EventAction {
    action: string;
    name?: string;
    args?: Record<string, unknown>;
}
export enum DynamicEvents {
    Loaded = 'Loaded',
    Clicked = 'Clicked',
    AnimationStart = 'AnimationStart',
    AnimationEnd = 'AnimationEnd',
    Focus = 'Focus',
    Blur = 'Blur'
}

export interface XaafDynamicViewData {
    type: string;
    props: JsonObject;
    xaaf?: {
        timeout?: number;
        events?: EventAction[];
        methods?: Record<string, Record<string, unknown>>;
        templates?: Record<string, XaafDynamicViewData>;
    };
    children?: XaafDynamicViewChildData[];
}

export type XaafDynamicViewChildData = string | XaafDynamicViewData;

export interface XaafDynamicElement extends BaseXaafElement<XaafDynamicElementListener, XaafDynamicViewData> {
    show(): void;
    hide(): void;
}

export interface XaafDynamicElementListener {
    onLoad(): Promise<void>;
    onError(error: XaafError): Promise<void>;
    onCompleted(shouldStop: boolean): void;
}

export interface BaseXaafElement<L, D> {
    xaafElementListener?: L;
    setData(data: D): void;
}
