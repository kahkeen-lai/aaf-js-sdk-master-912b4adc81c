export type XaafErrorCode = ErrorCode; // AuthErrorCode | ServerErrorCode | ExecutableAdErrorCode;

export type AuthErrorCode =
    | ErrorCode.SessionExpired
    | ErrorCode.KillSwitchEnabled
    | ErrorCode.XaaBaAuthenticationError
    | ErrorCode.VerifyCredentialsSDKDisabled
    | ErrorCode.InvalidRefreshAttempt
    | ErrorCode.AuthenticationError
    | ErrorCode.AuthorizationError
    | ErrorCode.NotFound
    | ErrorCode.ExperienceNotFoundInADR
    | ErrorCode.InvalidParameters;

export type ServerErrorCode =
    | ErrorCode.FailureEngagingAdRouter
    | ErrorCode.GeneralError
    | ErrorCode.InternalServerError
    | ErrorCode.NP
    | ErrorCode.NA;

export type ExecutableAdErrorCode =
    | ErrorCode.UnsupportedCommand
    | ErrorCode.CommandExecuteFailure
    | ErrorCode.CommandInformationNotSufficient
    | ErrorCode.FailureInTransition
    | ErrorCode.MissingResource
    | ErrorCode.InvalidResourceURL
    | ErrorCode.ResourceTimeout
    | ErrorCode.GeneralResourceError
    | ErrorCode.MediaErrorFailureRenderingMedia
    | ErrorCode.KeyError
    | ErrorCode.General
    | ErrorCode.FailureAccessingLocalDBResource;

export enum ErrorDomain {
    Http = 'HTTP', // if while engaging the backend
    SDK = 'SDK',
    ExAd = 'EXAD'
}

export enum ErrorSubDomain {
    Xaaba = 'XAABA',
    Cdn = 'CDN',
    Auth = 'AUTH',
    Rollout = 'ROLLOUT',
    Player = 'PLAYER',
    ImageViewer = 'IMAGE_VIEWER',
    Buffer = 'BUFFER',
    Metrics = 'METRICS'
}

export enum RecoveryAction {
    Retry = 'RETRY',
    Restart = 'RESTART',
    CircuitBreak = 'CIRCUIT_BREAK',
    Refresh = 'REFRESH',
    None = 'NONE'
}

export enum ErrorCode {
    NP = 'NP',
    NA = 'NA',
    NoAd = '204',
    SessionExpired = '401-1',
    KillSwitchEnabled = '401-2',
    XaaBaAuthenticationError = '401-3',
    VerifyCredentialsSDKDisabled = '401-4',
    InvalidRefreshAttempt = '401-5',
    AuthenticationError = '401-9000',
    AuthorizationError = '403',
    NotFound = '404',
    ExperienceNotFoundInADR = '404-1',
    ExperienceMissingImpression = '404-2',
    InvalidParameters = '422',
    RateLimitError = '429',
    InternalServerError = '500',
    FailureEngagingAdRouter = '500-1',
    GeneralError = '500-9000',
    UnsupportedCommand = '1000-1',
    CommandExecuteFailure = '1000-2',
    CommandInformationNotSufficient = '1000-3',
    FailureInTransition = '2000-9000',
    MissingResource = '3000-1',
    InvalidResourceURL = '3000-2',
    ResourceTimeout = '3000-3',
    GeneralResourceError = '3000-9000',
    MediaErrorFailureRenderingMedia = '4000-1',
    KeyError = '5000-1',
    General = '9000',
    FailureAccessingLocalDBResource = '9000-1',
    HostInvalidResourceError = '6000-1',
    RequestToHostFailed = '6000-2',
    RequestToHostTimedOut = '6000-3',
    RequestToHostNotSupported = '6000-4'
}

export type ErrorEndPoint = EndPointUrl | ComponentName;
type ComponentName = string;
type EndPointUrl = string;

export interface ErrorProperty {
    message: string;
    recoveryActionTaken?: RecoveryAction;
    throwable?: boolean;
}

export const ErrorProperties: Map<string, ErrorProperty> = new Map([
    /** Authentication Errors */
    ['401-1', { message: 'Session expired', recoveryActionTaken: RecoveryAction.Refresh }],
    ['401-2', { message: 'Kill switch enabled on backend', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['401-3', { message: 'XaaBa authentication error', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['401-4', { message: 'SDK is disabled', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['401-5', { message: 'Refr attempted without refresh token', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    [
        '401-9000',
        {
            message: 'Return upon authentication error',
            recoveryActionTaken: RecoveryAction.CircuitBreak,
            throwable: true
        }
    ],
    ['403', { message: 'Return upon authorization error', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['404', { message: 'Not found', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['404-1', { message: 'Experience from ADR not found by XaaBa', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['404-2', { message: 'Experience is missing impressions', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['422', { message: 'Invalid parameters', recoveryActionTaken: RecoveryAction.CircuitBreak, throwable: true }],

    /** Server Errors */
    ['500', { message: 'Internal server error', recoveryActionTaken: RecoveryAction.Retry }],
    ['500-1', { message: 'Failure engaging ad router', recoveryActionTaken: RecoveryAction.Retry }],
    ['501', { message: 'Not Implemented', recoveryActionTaken: RecoveryAction.Retry }],
    ['503', { message: 'Service Unavailable', recoveryActionTaken: RecoveryAction.Retry }],
    ['504', { message: 'Gateway Timeout', recoveryActionTaken: RecoveryAction.Retry }],
    ['505', { message: 'HTTP Version Not Supported', recoveryActionTaken: RecoveryAction.Retry }],
    ['500-9000', { message: 'General', recoveryActionTaken: RecoveryAction.Retry }],

    /** Executable Ad Errors */
    ['1000-1', { message: 'Unsupported command' }],
    ['1000-2', { message: 'Command execute failure' }],
    ['1000-3', { message: 'Command information not sufficient' }],
    ['2000-9000', { message: 'Failure in transition' }],
    ['3000-1', { message: 'Missing resource (404)' }],
    ['3000-2', { message: 'Invalid resource URL' }],
    ['3000-3', { message: 'Resource timeout' }],
    ['3000-9000', { message: 'General resource error' }],
    ['4000-1', { message: 'Media error, failure rendering/playing media' }],
    ['5000-1', { message: '' }], // API key error, message removed for security
    ['9000', { message: 'General', recoveryActionTaken: RecoveryAction.CircuitBreak }],
    ['9000-1', { message: 'Failure accessing local DB resource' }],
    ['6000-2', { message: 'Send request to host failed.' }],
    ['6000-3', { message: 'Host did not invoke callback for the request in time' }],
    ['6000-4', { message: 'Missing delegate for Send Request to Host.' }]
]);

export interface XaafError extends ErrorReport {
    name?: string;
    message: string;
    comment: string;
    loopRetry?: boolean;
}

export interface ErrorResponse {
    message: string;
    name: string;
    errorCode: string;
    data: string | any;
}

export interface ErrorReport {
    errorCode: XaafErrorCode;
    httpErrorCode: string;
    errorDomain?: ErrorDomain;
    errorSubDomain?: ErrorSubDomain;
    isRecoverable?: boolean;
    didTryRecovery?: RecoveryAction;
    recoveryActionTaken?: RecoveryAction;
    errorEndPoint?: ErrorEndPoint;
    errorDesc?: string;
    bufferingTime?: number;
    userInteracted?: boolean;
    interactiveAd?: boolean;
}

export const isShouldRetryError = (errorCode: string): boolean =>
    Number(errorCode) >= 500 || errorCode === ErrorCode.FailureEngagingAdRouter || errorCode === ErrorCode.GeneralError;
