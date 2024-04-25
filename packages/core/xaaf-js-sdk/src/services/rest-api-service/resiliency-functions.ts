import { ConfigService } from '../config-service/config-service';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import * as Core from '@xaaf/common';
import { ReportService } from '../report-service/report-service';
import { RestApiService } from '../rest-api-service/rest-api-service';
import { ErrorUtils } from '@xaaf/common';

export const BackOffAbort = 'BackOffAbort';

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;

export const backOff = <T>({
    retries = 5,
    taskFn,
    infinite = false,
    intervals = [5 * minute, 15 * minute, hour]
}: BackOffOptions): Promise<T> =>
    new Promise((resolve, reject) => {
        if (typeof taskFn !== 'function') {
            reject('No taskFn function specified in options');
        }
        let isPolling = true;
        let retriesRemaining = retries;
        const rejections: Error[] = [];

        const poll = (): void => {
            taskFn()
                .then((result: T) => resolve(result))
                .catch((error) => {
                    if (error === BackOffAbort) {
                        reject(rejections);
                        isPolling = false;
                    }

                    rejections.push(error);

                    if (--retriesRemaining === 0 && !infinite) {
                        reject(rejections);
                    } else if (isPolling) {
                        /** get next interval from array, or last element in array*/
                        const sleepInterval: number =
                            retries < intervals.length ? intervals[retries] : intervals[intervals.length - 1];
                        setTimeout(poll, sleepInterval);
                    }
                });
        };

        poll();
    });

export function _handleAuthError(
    err: Error | Core.HttpResponse<Core.ErrorResponse>,
    resolve: (data: Core.HttpResponse<Core.LoginResponse>) => void,
    reject: (error) => void
): void {
    let errorCode, errorMessage;
    const _configService: ConfigService = ConfigService.getInstance();

    if (err instanceof Error) {
        errorCode = Core.ErrorCode.General;
        errorMessage = err.message;
    } else {
        errorCode = err.body?.errorCode || Core.ErrorCode.General;
        errorMessage = err.body?.message || 'unknown error';
    }

    const xaafError = ErrorUtils.xaafError(errorCode, errorMessage, Core.ErrorSubDomain.Auth, err['endPoint']);
    const additionalParams: Record<string, string> = {
        [Core.HostParams.deviceUUID]: _configService.deviceUUID,
        [Core.HostParams.deviceType]: _configService.deviceType,
        [Core.HostParams.device]: _configService.device,
        [Core.HostParams.deviceModel]: _configService.deviceModel,
        [Core.HostParams.deviceManufacturer]: _configService.deviceManufacturer,
        [Core.HostParams.osName]: _configService.osName,
        [Core.HostParams.osVersion]: _configService.osVersion,
        [Core.HostParams.userType]: _configService.userType,
        [Core.HostParams.tenantName]: _configService.tenantName,
        [Core.HostParams.tenantSystemName]: _configService.tenantSystemName,
        [Core.HostParams.appName]: _configService.appName,
        [Core.HostParams.appVersion]: _configService.appVersion,
        [Core.HostParams.platform]: _configService.platform,
        [Core.HostParams.sdkName]: _configService.sdkName,
        [Core.HostParams.sdkVersion]: _configService.sdkVersion,
        [Core.HostParams.platformName]: _configService.platformName,
        errorDomain: Core.ErrorDomain.Http
    };
    const xaafErrorReport = ReportService.getInstance().createErrorReport(xaafError, additionalParams);
    ReportService.getInstance().report(Core.ReportType.Error, xaafErrorReport);

    switch (errorCode) {
        case Core.ErrorCode.InternalServerError:
        case Core.ErrorCode.FailureEngagingAdRouter:
        case Core.ErrorCode.GeneralError:
            reject(BackOffAbort);
            break;
        default: {
            const is5xxError = errorCode.match(/^5/);
            if (is5xxError) {
                reject(errorMessage);
            } else {
                reject(BackOffAbort);
            }
        }
    }
}

async function refreshTokenPromise(): Promise<Core.HttpResponse<Core.LoginResponse>> {
    const _configService: ConfigService = ConfigService.getInstance();
    const { tokenData, sdkArguments } = _configService;

    return new Promise((resolve, reject) => {
        const _featureFlagsService: FeatureFlagsService = FeatureFlagsService.getInstance();
        if (_featureFlagsService.retryToBackendEnabled) {
            RestApiService.getInstance()
                .refreshToken(tokenData, sdkArguments)
                .then((res: Core.HttpResponse<Core.LoginResponse>) => resolve(res))
                .catch((error) => {
                    error.endPoint = _configService.refreshTokenUrl;
                    _handleAuthError(error, resolve, reject);
                });
        } else {
            reject('retryToBackendEnabled feature flag is disabled');
        }
    });
}

async function loginPromise(): Promise<Core.HttpResponse<Core.LoginResponse>> {
    const _configService: ConfigService = ConfigService.getInstance();
    const _featureFlagsService: FeatureFlagsService = FeatureFlagsService.getInstance();
    const { apiKey, tokenData, sdkArguments } = _configService;

    return new Promise((resolve, reject) => {
        if (_featureFlagsService.retryToBackendEnabled) {
            RestApiService.getInstance()
                .login(apiKey, tokenData, sdkArguments)
                .then((res: Core.HttpResponse<Core.LoginResponse>) => resolve(res))
                .catch((error) => {
                    error.endPoint = _configService.loginUrl;
                    _handleAuthError(error, resolve, reject);
                });
        } else {
            reject('retryToBackendEnabled feature flag is disabled');
        }
    });
}

export async function _retryFunctionUntilSucceeds(
    taskFn: () => Promise<unknown>,
    infinite = true,
    intervals?: Array<number>
): Promise<Core.HttpResponse<Core.LoginResponse>> {
    /**
     * Retry Immediately
     * If still fails then retry after 5 minutes, then 15
     * If still fails then keep retrying every 60 minutes
     */
    intervals = intervals ?? [0, 5 * minute, 15 * minute, hour];
    return backOff<Core.HttpResponse<Core.LoginResponse>>({ taskFn, infinite, intervals });
}

export const retryRefreshTokenUntilSucceeds = async (
    infinite = true,
    intervals?: Array<number>
): Promise<Core.HttpResponse<Core.LoginResponse>> =>
    _retryFunctionUntilSucceeds(refreshTokenPromise, infinite, intervals);

export const retryLoginUntilSucceeds = async (
    infinite = true,
    intervals?: Array<number>
): Promise<Core.HttpResponse<Core.LoginResponse>> => _retryFunctionUntilSucceeds(loginPromise, infinite, intervals);

export interface BackOffOptions {
    retries?: number;
    taskFn: <T>() => Promise<T>;
    infinite?: boolean;
    intervals?: number[];
}
