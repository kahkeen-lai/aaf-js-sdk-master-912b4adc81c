import { ContentToggleItem } from '../models';

export interface AppTimeouts {
    http?: number;
    xaaba?: number;
    assets?: number;
    player?: number;
    buffer?: number;
    reporting?: number;
}

export interface BulkConfiguration {
    reportingBulk?: number;
    reportingBulkDelay?: number;
}

export interface ConfigServiceContract {
    readonly sdkArguments: Map<string, string>;
    readonly timeouts: AppTimeouts;
    readonly contentToggleList: ContentToggleItem[];
    getMeasurementParams(paramType: string): string;
}
