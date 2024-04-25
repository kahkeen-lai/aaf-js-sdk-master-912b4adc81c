import { ApiVersion, ConfigService } from '../config-service/config-service';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import * as Core from '@xaaf/common';
import {
    RefreshResponse,
    LoginResponse,
    HttpResponse,
    HttpRequestHeaders,
    HttpRequestParams,
    HttpRequestOptions,
    HttpService,
    InjectionContainer,
    ContainerDef,
    Xip,
    ErrorCode,
    ErrorResponse
} from '@xaaf/common';
import { ArrayHelper } from '../../utils/array-helper';

export class RestApiService {
    private _lastLoginRequestId: string;

    private get _httpService(): HttpService {
        return InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
    }

    private get _configService(): ConfigService {
        return ConfigService.getInstance();
    }

    static getInstance(): RestApiService {
        return InjectionContainer.resolve<RestApiService>(ContainerDef.restApiService);
    }

    private static _isUnknownHttpResponse(val: NonNullable<any>): val is HttpResponse<unknown> {
        return 'status' in val && 'body' in val;
    }

    private static _isErrorResponse(val: NonNullable<any>): val is HttpResponse<ErrorResponse> {
        return 'errorCode' in val.body;
    }

    private static _isXipResponse(val: NonNullable<any>): val is HttpResponse<Xip> {
        return val.status === 200 && 'exeAdUUID' in val.body && 'commands' in val.body;
    }

    async getOpportunity(sdkArguments: Map<string, string>, requestId: string): Promise<NonNullable<Xip>> {
        const { token, opportunityUrl: url } = this._configService;
        const options: HttpRequestOptions = this._buildAuthOptions(token, sdkArguments, requestId);
        options.timeout = this._configService.timeouts.xaaba;

        let response: HttpResponse<Xip | Core.ErrorResponse> | Error | undefined;
        try {
            response = await this._httpService.get<Xip | Core.ErrorResponse>(url, options);
        } catch (error) {
            // in some cases, httpService.get might throw ErrorResponse or return ErrorResponse
            // TODO: fixme - either return or throw ErrorResponse, not both
            response = error;
        }

        return RestApiService._getOpportunityResponseAdapter(response);
    }

    private static _getOpportunityResponseAdapter(
        response: HttpResponse<Xip | Core.ErrorResponse> | Error | undefined
    ): NonNullable<Xip> {
        if (!response) {
            throw {
                errorCode: ErrorCode.General,
                message: '',
                name: '',
                data: ''
            };
        } else if (RestApiService._isXipResponse(response)) {
            return response.body;
        } else if (RestApiService._isErrorResponse(response)) {
            throw response.body;
        } else if (RestApiService._isUnknownHttpResponse(response)) {
            throw {
                errorCode: response.status,
                message: '',
                name: '',
                data: JSON.stringify(response.body)
            };
        } else {
            // Response is Error
            throw response;
        }
    }

    async login(
        apiKey: string,
        tokenData: Core.TokenData,
        sdkArguments: Map<string, string>,
        requestId: string = this._lastLoginRequestId
    ): Promise<HttpResponse<LoginResponse>> {
        const { apiVersion } = this._configService;
        switch (apiVersion) {
            case ApiVersion.v1:
                return this._loginV1(sdkArguments, requestId);
            case ApiVersion.v2:
                return this._loginV2(sdkArguments, requestId);
        }
    }

    async refreshToken(
        tokenData: Core.TokenData,
        sdkArguments: Map<string, string>,
        requestId: string = this._lastLoginRequestId
    ): Promise<HttpResponse<RefreshResponse>> {
        switch (this._configService.apiVersion) {
            case ApiVersion.v1:
                return this._refreshTokenV1(sdkArguments, requestId);
            case ApiVersion.v2:
                return this._refreshTokenV2(sdkArguments, requestId);
        }
    }

    private async _loginV1(
        sdkArguments: Map<string, string>,
        requestId: string = this._lastLoginRequestId
    ): Promise<HttpResponse<LoginResponse>> {
        const { apiKey: token, loginUrl: url } = this._configService;
        const options: HttpRequestOptions = this._buildAuthOptions(token, sdkArguments, requestId);
        return this._httpService.post<LoginResponse>(url, options, {});
    }

    private async _refreshTokenV1(
        sdkArguments: Map<string, string>,
        requestId: string = this._lastLoginRequestId
    ): Promise<HttpResponse<RefreshResponse>> {
        const { refreshToken: token, refreshTokenUrl: url } = this._configService;
        const options: HttpRequestOptions = this._buildAuthOptions(token, sdkArguments, requestId);
        return this._httpService.get<LoginResponse>(url, options);
    }

    private async _loginV2(
        sdkArguments: Map<string, string>,
        requestId: string = this._lastLoginRequestId
    ): Promise<HttpResponse<LoginResponse>> {
        const { apiKey, loginUrl } = this._configService;
        return this._authRequestV2(loginUrl, apiKey, sdkArguments, requestId);
    }

    private async _refreshTokenV2(
        sdkArguments: Map<string, string>,
        requestId: string = this._lastLoginRequestId
    ): Promise<HttpResponse<RefreshResponse>> {
        const { refreshToken, refreshTokenUrl } = this._configService;
        this._sendAccountingUrlRequest();
        return this._authRequestV2(refreshTokenUrl, refreshToken, sdkArguments, requestId);
    }

    private _sendAccountingUrlRequest(): Promise<unknown> {
        const { accountingUrl, DeviceID: deviceUUID } = this._configService;

        if (accountingUrl) {
            const options: Core.HttpRequestOptions = {};
            return this._httpService.request(`${accountingUrl}?distinct_id=${deviceUUID}`, 'HEAD', options);
        }
    }

    private async _authRequestV2(
        url: string,
        token: string,
        sdkArguments: Map<string, string>,
        id: string
    ): Promise<Core.HttpResponse<LoginResponse>> {
        const headers: HttpRequestHeaders = this._buildAuthHeaders(token, id);
        const params: HttpRequestParams = ArrayHelper.mapToRecord(sdkArguments);
        const body: Core.RequestBody = this._buildAuthBody(params);
        return this._httpService.post<LoginResponse>(url, { headers }, body);
    }

    private _buildAuthBody(params: HttpRequestParams): Core.RequestBody {
        const { featureFlagRequest } = FeatureFlagsService.getInstance();
        return {
            ...featureFlagRequest,
            ...params
        };
    }

    private _buildAuthOptions = (
        token: string,
        sdkArguments: Map<string, string>,
        requestId: string
    ): HttpRequestOptions => ({
        headers: this._buildAuthHeaders(token, requestId),
        params: ArrayHelper.mapToRecord(sdkArguments)
    });

    private _buildAuthHeaders = (token: string, requestId: string): HttpRequestHeaders => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Request-ID': requestId
    });
}

InjectionContainer.registerSingleton(ContainerDef.restApiService, RestApiService);
