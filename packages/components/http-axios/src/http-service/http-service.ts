import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import * as Core from '@xaaf/common';
export type HttpRequestOptions = AxiosRequestConfig;
export const NO_TIMEOUT = -1;

export interface HttpResponse<T> {
    status: number;
    body?: T;
}

export class HttpService implements Core.HttpService {
    private _featureFlagService: Core.FeatureFlagsServiceContract;
    private _configService: Core.ConfigServiceContract;
    private _defaultConfig: AxiosRequestConfig = {};
    private _axiosInstance: AxiosInstance;
    public interceptors(): Core.HttpInterceptor {
        return this._axiosInstance.interceptors;
    }

    constructor(defaultConfig?: AxiosRequestConfig) {
        this._axiosInstance = axios.create();
        this._defaultConfig = defaultConfig ?? {};
        this._featureFlagService = Core.InjectionContainer.resolve<Core.FeatureFlagsServiceContract>(
            Core.ContainerDef.featureFlagsService
        );
        this._configService = Core.InjectionContainer.resolve<Core.ConfigServiceContract>(
            Core.ContainerDef.configService
        );
    }

    /**
     * @param url  The base url for the request (no query strings).
     * @param options {@link HttpRequestOptions}
     */
    get = <T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> =>
        this.request<T>(url, 'GET', options);

    post = <T>(url: string, options?: HttpRequestOptions, data?: unknown): Promise<HttpResponse<T>> =>
        this.request<T>(url, 'POST', { ...options, data });

    put = <T>(url: string, options?: HttpRequestOptions, data?: unknown): Promise<HttpResponse<T>> =>
        this.request<T>(url, 'PUT', { ...options, data });

    delete = <T>(url: string, options?: HttpRequestOptions, data?: unknown): Promise<HttpResponse<T>> =>
        this.request<T>(url, 'DELETE', { ...options, data });

    async request<T>(url: string, method: Method, options: HttpRequestOptions): Promise<HttpResponse<T>> {
        const axiosRequestConfig: AxiosRequestConfig = { ...this._defaultConfig, url, method, ...options };
        const timeoutEnabled = this._featureFlagService.httpTimeoutEnabled && options?.timeout !== NO_TIMEOUT;
        const timeout = options?.timeout ?? this._configService.timeouts.http;
        axiosRequestConfig.timeout = timeoutEnabled ? timeout : undefined;

        try {
            const { status, data: body }: AxiosResponse<T> = await this._axiosInstance.request<T>(axiosRequestConfig);
            const _loggerService = Core.InjectionContainer.resolve<Core.Logger>(Core.ContainerDef.loggerService);
            _loggerService.debug(`[HttpService]:[request] success: ${url}`);
            return { status, body };
        } catch (error) {
            this.handleRequestError(url, error);
        }
    }

    private handleRequestError<T>(url: string, error: AxiosError): HttpResponse<T> {
        const _loggerService = Core.InjectionContainer.resolve<Core.Logger>(Core.ContainerDef.loggerService);
        if (error.response) {
            const status = error.response.status;
            const body = error.response.data;
            _loggerService.error(`[HttpService]:[request] error: ${url}, status: ${error.response.status}`);
            throw { status, body };
        } else {
            _loggerService.error(`[HttpService]:[request] error: ${url}, message: ${error.message}`);
            switch (error.code) {
                case 'ETIMEDOUT':
                case 'ECONNABORTED':
                    throw Core.ErrorUtils.httpError(
                        Core.ErrorCode.ResourceTimeout,
                        `Request timed out: ${url}`,
                        undefined,
                        'http-service::request'
                    );
                default:
                    throw Core.ErrorUtils.httpError(
                        Core.ErrorCode.GeneralError,
                        `Request failed: ${error.message}`,
                        undefined,
                        'http-service::request'
                    );
            }
        }
    }
}
