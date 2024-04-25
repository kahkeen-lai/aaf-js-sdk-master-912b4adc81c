import { ConfigResponse, FlagsContainer } from '../models';

export interface TargetGroup {
    distinctId: string;
    appName: string;
    platform: string;
    version: string;
}

export type FeatureFlagsSetupRequest = Pick<
    ConfigResponse,
    | 'minFetchInterval'
    | 'rollout_api_key'
    | 'rolloutProxyUrl'
    | 'rolloutProxyAccessToken'
    | 'rolloutAccountingUrl'
    | 'featureFlags'
>;

export interface FeatureFlagsRequest {
    featureFlags?: {
        flagNames: string[];
        namespace: string;
        distinctId: string;
        customStringProperties: Record<string, string>;
    };
}

export interface FeatureFlagsRegistration {
    namespace: string;
    flags: FlagsContainer;
    customStringProperties: Map<string, string>;
    targetGroup: TargetGroup;
}

export interface FeatureFlagsDelegate {
    usesRelayProxy?: boolean;
    isFlagEnabled: (flagName: string) => boolean;
    setup: (configuration: FeatureFlagsSetupRequest) => Promise<void>;
    register: (registration: FeatureFlagsRegistration) => void;
    fetch: () => void;
    featureFlagRequest?: FeatureFlagsRequest;
}

export interface FeatureFlagsServiceContract {
    usesRelayProxy: boolean;
    fetch(): void;
    setup(setupRequest: FeatureFlagsSetupRequest): Promise<void>;
    isFlagEnabled(flagName: string, isReport: boolean): boolean;
    register(targetGroup: TargetGroup, customStringProperties: Map<string, string>): void;

    readonly featureFlagRequest: FeatureFlagsRequest;
    readonly xaafEnabled: boolean;
    readonly adStartHintEnabled: boolean;
    readonly retryToBackendEnabled: boolean;
    readonly bufferTimeoutEnabled: boolean;
    readonly playerTimeoutEnabled: boolean;
    readonly reportInBulksEnabled: boolean;
    readonly nrDebugLogLevelEnabled: boolean;
    readonly nrInfoLogLevelEnabled: boolean;
    readonly nrErrorLogLevelEnabled: boolean;
    readonly measurementsImpressionsErrorReportEnabled: boolean;
    readonly httpTimeoutEnabled: boolean;
    readonly enabledFlags: string;
}
