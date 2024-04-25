import * as Core from '@xaaf/common';
import {
    AssertUtils,
    ContainerDef,
    ErrorCode,
    ErrorResponse,
    ErrorUtils,
    ErrorSubDomain,
    HttpResponse,
    InjectionContainer,
    RefreshResponse,
    LoginResponse,
    LoginStoredData,
    ReportLoginMode,
    ReportType,
    XaafError
} from '@xaaf/common';
import { RestApiService } from '../rest-api-service/rest-api-service';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import { ReportService } from '../report-service/report-service';
import { AppConfig, ConfigService } from '../config-service/config-service';
import { LoggerService } from '../logger-service/logger-service';
import { UuidGenerator } from '../../utils/uuid-generator';
import { TokenService } from '../token-service/token-service';
import { retryLoginUntilSucceeds, retryRefreshTokenUntilSucceeds } from '../rest-api-service/resiliency-functions';
import { serializeError } from 'serialize-error';

type LoginStoredDataOrNull = Core.LoginStoredData | null;

export class LoginService {
    isLoggedIn = false;
    isFailed = false;
    static getInstance(): LoginService {
        return InjectionContainer.resolve<LoginService>(ContainerDef.loginService);
    }

    private get _featureFlagsService(): FeatureFlagsService {
        return InjectionContainer.resolve<FeatureFlagsService>(ContainerDef.featureFlagsService);
    }

    private get _reportService(): ReportService {
        return ReportService.getInstance();
    }

    private get _configService(): ConfigService {
        return InjectionContainer.resolve<ConfigService>(ContainerDef.configService);
    }

    private get _loggerService(): LoggerService {
        return InjectionContainer.resolve<LoggerService>(ContainerDef.loggerService);
    }

    private get _restApiService(): RestApiService {
        return InjectionContainer.resolve<RestApiService>(ContainerDef.restApiService);
    }

    private get _tokenService(): TokenService {
        return InjectionContainer.resolve<TokenService>(ContainerDef.tokenService);
    }

    private get _storageService(): Core.StorageService {
        return InjectionContainer.resolve<Core.StorageService>(ContainerDef.storageService);
    }

    get isXaafAvailable(): boolean {
        return this.isLoggedIn && this._featureFlagsService.xaafEnabled;
    }

    async loginAndConfigure(
        apiKey: string,
        tokenData: Core.TokenData,
        sdkArguments: Map<string, string>,
        loginRequestId: string,
        isSilentlogin = false
    ): Promise<void> {
        this._updateEnvironmentWithHostConfig({ apiKey, sdkArguments, tokenData });
        this.isLoggedIn = false;
        const loginRes: NonNullable<LoginResponse> = await this.getLoginResponse(
            apiKey,
            tokenData,
            sdkArguments,
            loginRequestId,
            isSilentlogin
        );
        this._loggerService.info(`[xaaf:LoginService::getLoginResponse] ${JSON.stringify(loginRes)}`);
        this._updateEnvironmentWithLoginRes(loginRes);
    }

    async getLoginResponse(
        apiKey: string,
        tokenData: Core.TokenData,
        sdkArguments: Map<string, string>,
        loginRequestId: string,
        isSilentlogin = false
    ): Promise<NonNullable<LoginResponse>> {
        this._loggerService.debug('[xaaf:LoginService::getLoginResponse]');

        if (!isSilentlogin) {
            try {
                const loginStoreData: LoginStoredDataOrNull = await this.getPersistentLoginItem<LoginStoredDataOrNull>(
                    Core.LOGIN_PERSISTENT_STORAGE_KEY
                );

                if (loginStoreData) {
                    const isSameEnvironment = loginStoreData.persistentApiKey === apiKey;
                    if (isSameEnvironment && loginStoreData.persistentLoginRes) {
                        return loginStoreData.persistentLoginRes;
                    }
                }
            } catch (error) {
                this._loggerService.error(
                    '[xaaf:LoginService::getLoginResponse] could not retrieve persistent log in ' +
                        JSON.stringify(serializeError(error))
                );
                // continue
            }
        }

        let loginRes: NonNullable<LoginResponse>;
        try {
            this._resetTimeToNextEngagement();
            this._removePersistentLoginItems();
            const { body: loginResponse } = await this._restApiService.login(
                apiKey,
                tokenData,
                sdkArguments,
                loginRequestId
            );
            Core.AssertUtils.assertValueIsDefined(loginResponse, 'login returned null');
            loginRes = loginResponse;
        } catch (error) {
            this._loggerService.error(
                '[xaaf:LoginService::getLoginResponse] could not perform login ' + JSON.stringify(serializeError(error))
            );
            const resiliencyLoginRes: LoginResponse | null = await this._handleLoginResponseError(error);
            Core.AssertUtils.assertValueIsDefined(resiliencyLoginRes, '_handleLoginResponseError returned null');
            loginRes = resiliencyLoginRes;
        }

        this._updateEnvironmentWithBEResponse(loginRes, apiKey);
        await this._reportLoginSuccessFromBE(sdkArguments, loginRequestId);
        return loginRes;
    }

    async refreshToken(isErrorDriven: boolean): Promise<NonNullable<LoginResponse>> {
        const loginRequestId: string = UuidGenerator.generate();
        this._resetTimeToNextEngagement();
        const { tokenData, sdkArguments, refreshToken, apiKey } = this._configService;
        this.isLoggedIn = false;
        const refreshResponse: RefreshResponse = await this._getRefreshTokenResponse(
            tokenData,
            sdkArguments,
            loginRequestId
        );
        const loginRes: LoginResponse = { ...refreshResponse, refreshToken };
        this._updateEnvironmentWithBEResponse(loginRes, apiKey);
        this._updateEnvironmentWithLoginRes(loginRes);

        await this._reportService.reportLogin(
            sdkArguments,
            {
                loginRequestId,
                isSilent: true,
                success: true,
                mode: isErrorDriven ? ReportLoginMode.ErrorDriven : ReportLoginMode.PreAuth
            },
            ReportType.Refresh
        );
        return loginRes;
    }

    async silentLoginRequest(isErrorDriven: boolean): Promise<void> {
        const loginRequestId = UuidGenerator.generate();
        const isSilent = true;
        const { apiKey, tokenData, sdkArguments } = this._configService;
        try {
            await this.loginAndConfigure(apiKey, tokenData, sdkArguments, loginRequestId, isSilent);

            if (this.isLoggedIn) {
                this._reportService.reportLogin(
                    this._configService.sdkArguments,
                    {
                        loginRequestId,
                        isSilent,
                        success: true,
                        mode: isErrorDriven ? ReportLoginMode.ErrorDriven : ReportLoginMode.PreAuth
                    },
                    ReportType.Login
                );
            } else {
                this._reportService.reportLogin(
                    this._configService.sdkArguments,
                    {
                        loginRequestId,
                        isSilent,
                        success: false,
                        mode: isErrorDriven ? ReportLoginMode.ErrorDriven : ReportLoginMode.PreAuth
                    },
                    ReportType.Login
                );
            }
        } catch (error) {
            this._reportService.reportLogin(
                this._configService.sdkArguments,
                {
                    loginRequestId,
                    isSilent,
                    success: false,
                    mode: isErrorDriven ? ReportLoginMode.ErrorDriven : ReportLoginMode.PreAuth
                },
                ReportType.Login
            );
            throw error;
        }
    }

    private async _reportLoginSuccessFromBE(sdkArguments: Map<string, string>, loginRequestId: string): Promise<void> {
        await this._reportService.reportLogin(
            sdkArguments,
            {
                loginRequestId,
                isSilent: false,
                success: true,
                mode: Core.ReportLoginMode.PreAuth
            },
            Core.ReportType.Login
        );
    }

    private _updateEnvironmentWithHostConfig(hostConfig: Partial<AppConfig>): void {
        this._configService.update(hostConfig);
    }

    private _updateEnvironmentWithLoginRes(loginRes: LoginResponse): void {
        this._configService.update({ loginRes });
        this._tokenService.decodeTokens(loginRes.token, loginRes.refreshToken);
        this.isLoggedIn = true;
    }

    private _updateEnvironmentWithBEResponse(loginRes: LoginResponse, apiKey: string): void {
        this._configService.update({ loginRes });
        this._storeLoginResponse(apiKey, loginRes);
        this._updateFeatureFlags(loginRes.configuration);
        this.isLoggedIn = true;
    }

    private async _getRefreshTokenResponse(
        tokenData: Core.TokenData,
        sdkArguments: Map<string, string>,
        loginRequestId: string
    ): Promise<NonNullable<RefreshResponse>> {
        try {
            this._removePersistentLoginItem(Core.KILL_SWITCH_PERSISTENT_STORAGE_KEY);
            const refreshTokenRes: HttpResponse<RefreshResponse> = await this._restApiService.refreshToken(
                tokenData,
                sdkArguments,
                loginRequestId
            );
            AssertUtils.assertValueIsDefined(refreshTokenRes?.body, 'refreshToken returned null');
            return refreshTokenRes.body;
        } catch (error) {
            this._loggerService.error(
                '[xaaf:LoginService::getLoginResponse] refresh token failed ' + JSON.stringify(serializeError(error))
            );
            const resiliencyResponse: HttpResponse<RefreshResponse> = await this._handleRefreshTokenResiliency(
                error,
                loginRequestId
            );
            AssertUtils.assertValueIsDefined(resiliencyResponse, '_handleRefreshTokenResiliency returned null');
            AssertUtils.assertValueIsDefined(resiliencyResponse.body, 'resiliencyResponse body null');
            return resiliencyResponse.body;
        }
    }

    private _removePersistentLoginItems(): void {
        this._removePersistentLoginItem(Core.LOGIN_PERSISTENT_STORAGE_KEY);
        this._removePersistentLoginItem(Core.KILL_SWITCH_PERSISTENT_STORAGE_KEY);
    }

    private _storeLoginResponse(persistentApiKey: string, persistentLoginRes: Core.LoginResponse): void {
        try {
            const loginStoredData: LoginStoredData = { persistentApiKey, persistentLoginRes };
            this._setPersistentLoginItem(Core.LOGIN_PERSISTENT_STORAGE_KEY, loginStoredData);
        } catch (error) {
            this._loggerService.error(
                '[xaaf:LoginService::getLoginResponse] could not store login response ' +
                    JSON.stringify(serializeError(error))
            );
        }
    }

    private _resetTimeToNextEngagement(): void {
        this._configService.timeToNextEngagement = 0;
    }

    private _updateFeatureFlags(setupRequest: Core.FeatureFlagsSetupRequest): void {
        if (this._featureFlagsService.usesRelayProxy) {
            this._featureFlagsService.setup(setupRequest);
        }
    }

    private async _handleRefreshTokenResiliency(
        err: Error | XaafError,
        loginRequestId: string
    ): Promise<HttpResponse<RefreshResponse>> {
        const { tokenData, sdkArguments, refreshTokenUrl } = this._configService;
        const errorCode = err['body']?.errorCode || ErrorCode.General;
        switch (errorCode) {
            case ErrorCode.FailureEngagingAdRouter:
            case ErrorCode.GeneralError:
                /** retry once */
                return this._restApiService.refreshToken(tokenData, sdkArguments, loginRequestId);
            case ErrorCode.SessionExpired:
            case ErrorCode.AuthenticationError:
                this._reportService.reportError(
                    ErrorUtils.httpError(errorCode, '', ErrorSubDomain.Auth, refreshTokenUrl)
                );
                break;
            case ErrorCode.KillSwitchEnabled: {
                const killSwitchError = this._createKillSwitchError();
                this._reportService.reportError(killSwitchError);
                const errorResponse: ErrorResponse = err?.['body'];
                this._setKillSwitch(errorResponse);
                break;
            }
            default: {
                const is5xxError = errorCode.match(/^5/);
                if (is5xxError) {
                    return retryRefreshTokenUntilSucceeds();
                } else {
                    throw err;
                }
            }
        }
    }

    private _handleLoginResponseError(err: Error | XaafError): Promise<Core.LoginResponse | null> {
        const { errorCode, message } = LoginService._retrieveErrorData(err);
        switch (errorCode) {
            case Core.ErrorCode.RateLimitError:
                return this._retryLoginInfinite();
            case Core.ErrorCode.ResourceTimeout:
                throw { errorCode, message };
            case Core.ErrorCode.InternalServerError:
            case Core.ErrorCode.FailureEngagingAdRouter:
            case Core.ErrorCode.GeneralError: {
                const generalError = ErrorUtils.createGeneralError('LoginService::login');
                generalError.comment = message;
                generalError.errorCode = errorCode;
                this._reportService.reportError(generalError);
                return this._retryLoginOnce();
            }
            case Core.ErrorCode.SessionExpired: {
                const sessionExpiredError = this._createSessionExpiredError();
                sessionExpiredError.comment = message;
                this._reportService.reportError(sessionExpiredError);
                break;
            }
            case Core.ErrorCode.AuthenticationError: {
                const authenticationError = this._createAuthenticationError();
                authenticationError.comment = message;
                this._reportService.reportError(authenticationError);
                break;
            }
            case Core.ErrorCode.KillSwitchEnabled: {
                const killSwitchError = this._createKillSwitchError();
                this._reportService.reportError(killSwitchError);
                this._setKillSwitch(err?.['body']);
                throw killSwitchError;
            }
            default: {
                const is5xxError = errorCode.match(/^5/);
                if (is5xxError) {
                    return this._retryLoginInfinite();
                }
                const generalError = ErrorUtils.createGeneralError('xaaf:LoginService::_createGeneralError');
                generalError.comment = message;
                this._reportService.reportError(generalError);
                throw generalError;
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _retrieveErrorData(err: any): Partial<Core.XaafError> {
        let errorCode, message: string;
        if (err.errorCode) {
            errorCode = err.errorCode;
            message = err.comment ?? err.message;
        } else if (err['body']?.errorCode) {
            errorCode = err['body']?.errorCode;
            message = err['body']?.message;
        } else if (err.status) {
            errorCode = err.status?.toString();
            message = `http error ${errorCode}`;
        } else {
            errorCode = Core.ErrorCode.General;
            message = err.name ?? '';
        }

        if (typeof err['stack'] === 'string') {
            message = err['stack'].split('\n')?.[0];
        }

        return { errorCode, message };
    }

    private _createSessionExpiredError(): Core.XaafError {
        return ErrorUtils.httpError(
            Core.ErrorCode.SessionExpired,
            'Session Expired',
            Core.ErrorSubDomain.Auth,
            'LoginService::_createSessionExpiredError'
        );
    }

    private _createAuthenticationError(): Core.XaafError {
        return ErrorUtils.httpError(
            Core.ErrorCode.AuthenticationError,
            'Authentication Error',
            Core.ErrorSubDomain.Auth,
            'LoginService::_createAuthenticationError'
        );
    }

    private _createKillSwitchError(): Core.XaafError {
        return ErrorUtils.httpError(
            Core.ErrorCode.KillSwitchEnabled,
            'KillSwitch Error',
            Core.ErrorSubDomain.Auth,
            'LoginService::_createKillSwitchError'
        );
    }

    private _setKillSwitch(errorResponse: ErrorResponse): void {
        const timeToNextEngagement: number = errorResponse?.data?.timeToNextEngagement;
        const timeoutInMs: number = timeToNextEngagement * 60 * 1000;
        const nextEngagementUnixTime: number = new Date().getTime() + timeoutInMs;
        this._loggerService.info(`[xaaf:LoginService::_setKillSwitch] timeToNextEngagement: ${nextEngagementUnixTime}`);
        this._configService.timeToNextEngagement = nextEngagementUnixTime;
        const killSwitchStoredData: Core.KillSwitchStoredData = {
            apiKey: this._configService.apiKey,
            timeToNextEngagement: nextEngagementUnixTime
        };
        this._setPersistentLoginItem(Core.KILL_SWITCH_PERSISTENT_STORAGE_KEY, killSwitchStoredData);
    }

    private async _retryLogin(
        retryOnce: boolean,
        retryFn: () => Promise<Core.HttpResponse<Core.LoginResponse>>
    ): Promise<Core.LoginResponse> {
        try {
            const { body: loginRes }: Core.HttpResponse<Core.LoginResponse> = await retryFn();
            if (!loginRes) {
                throw new Error('no login response');
            }
            return loginRes;
        } catch (error) {
            const xaafError = ErrorUtils.createGeneralError('xaaf:LoginService::_createGeneralError');
            xaafError.comment = error.message ?? error['body']?.message;
            if (retryOnce) {
                ErrorUtils.finalGeneralErrorDecorator(xaafError);
            }
            this._reportService.reportError(xaafError);
            throw xaafError;
        }
    }

    private _retryLoginInfinite(): Promise<Core.LoginResponse> {
        return this._retryLogin(false, () => retryLoginUntilSucceeds(true));
    }

    private _retryLoginOnce(): Promise<Core.LoginResponse> {
        const { apiKey, tokenData, sdkArguments } = ConfigService.getInstance();
        return this._retryLogin(true, () => RestApiService.getInstance().login(apiKey, tokenData, sdkArguments));
    }

    private _setPersistentLoginItem(key: string, value: unknown): void {
        this._storageService.setItem(key, JSON.stringify(value));
    }

    async getPersistentLoginItem<T>(key: string): Promise<T> {
        try {
            const loginItem: string = await this._storageService.getItem(key);
            return JSON.parse(loginItem);
        } catch (error) {
            return null;
        }
    }

    private _removePersistentLoginItem(key: string): void {
        this._storageService.removeItem(key);
    }
}
Core.InjectionContainer.registerSingleton(Core.ContainerDef.loginService, LoginService);
