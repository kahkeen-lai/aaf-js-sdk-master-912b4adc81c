import * as Core from '@xaaf/common';

export const XaafNamespace = 'xaaf';

export enum FlagName {
    xaafEnabled = 'xaafEnabled',
    adStartHintEnabled = 'adStartHintEnabled',
    retryToBackendEnabled = 'retryToBackendEnabled',
    playerTimeoutEnabled = 'playerTimeoutEnabled',
    bufferTimeoutEnabled = 'bufferTimeoutEnabled',
    nrDebugLogLevelEnabled = 'nrDebugLogLevelEnabled',
    nrInfoLogLevelEnabled = 'nrInfoLogLevelEnabled',
    nrErrorLogLevelEnabled = 'nrErrorLogLevelEnabled',
    reportInBulksEnabled = 'reportInBulksEnabled',
    measurementsImpressionsErrorReportEnabled = 'measurementsImpressionsErrorReportEnabled',
    httpTimeoutEnabled = 'httpTimeoutEnabled'
}

export const XaafFlagContainer: Core.FlagsContainer = {
    [FlagName.xaafEnabled]: true,
    [FlagName.adStartHintEnabled]: false,
    [FlagName.retryToBackendEnabled]: true,
    [FlagName.bufferTimeoutEnabled]: true,
    [FlagName.playerTimeoutEnabled]: true,
    [FlagName.nrDebugLogLevelEnabled]: false,
    [FlagName.nrInfoLogLevelEnabled]: false,
    [FlagName.nrErrorLogLevelEnabled]: false,
    [FlagName.reportInBulksEnabled]: true,
    [FlagName.measurementsImpressionsErrorReportEnabled]: true,
    [FlagName.httpTimeoutEnabled]: false
};
