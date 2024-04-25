import { XaafError } from '../models/error';

export enum XaafEventType {
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    FAILURE = 'FAILURE'
}

export type XaafEvent = {
    type: XaafEventType;
    error?: XaafError;
};

export type XaafInitListener = (xaafEvent: XaafEvent) => void;
