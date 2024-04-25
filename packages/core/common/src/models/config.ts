export interface PlayerConfiguration {
    minBuffer: number;
    maxBuffer: number;
    bufferForPlayback: number;
    bufferPollInterval: number;
}

export interface AccessToken {
    expiration: string;
    issuer: string;
}

export interface RefreshToken {
    expiration: string;
    issuer: string;
}

export interface ContentToggleItem {
    [key: string]: any;
    mode?: string;
    channelName?: string[];
    contentType?: string[];
    channelId?: string[];
    programName?: string[];
    programmerName?: string[];
    networkName?: string[];
    isDuringAd?: boolean;
    expType?: string[];
    adStartDelayHint?: string;
}

export interface ConfigResponse {
    content_toggle_list: ContentToggleItem[];
    nr_url: string;
    nr_rest_api_key: string;
    xaaba_url: string;
    lazy_refresh_token_before_expiration_minutes: number;
    http_timeout: number;
    xaaba_timeout: number;
    assets_timeout: number;
    player_timeout: number;
    buffer_timeout: number;
    reporting_timeout: number;
    pre_ad_start_xaaba_engage_time: number;
    reporting_bulk: number;
    reporting_bulk_delay: number;
    playerConfiguration?: PlayerConfiguration;
    access_token: AccessToken;
    refresh_token: RefreshToken;
    minFetchInterval?: number;
    rollout_api_key?: string;
    rolloutProxyUrl?: string;
    rolloutProxyAccessToken?: string;
    rolloutAccountingUrl?: string;
    featureFlags?: {
        timeToNextFetch: number;
        accountingUrl?: string;
        flags: FlagsContainer;
    };
}

export type FlagsContainer = Record<string, boolean>;
