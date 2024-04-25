export interface HttpResponse<T> {
    status: number;
    body?: T;
}
export interface HttpInterceptor {
    response: { use: (options) => void };
    request: { use: (options) => void };
}
export interface HttpService {
    get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    post<T>(url: string, options?: HttpRequestOptions, body?: unknown): Promise<HttpResponse<T>>;
    put<T>(url: string, options?: HttpRequestOptions, body?: unknown): Promise<HttpResponse<T>>;
    request<T>(url: string, method: string, options: HttpRequestOptions): Promise<HttpResponse<T>>;
    interceptors?(): HttpInterceptor;
}

export type HttpRequestHeaders = Record<string, string>;
export type HttpRequestParams = Record<string, string>;

export interface HttpRequestOptions {
    headers?: HttpRequestHeaders;
    params?: HttpRequestParams;
    timeout?: number;
}

export const NO_TIMEOUT = -1;
