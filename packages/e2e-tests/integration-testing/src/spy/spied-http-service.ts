import { HttpRequestOptions, HttpResponse, HttpService } from '@xaaf/common';
import { AxiosInstance } from 'axios';

export enum SpiedTransactionType {
  Login = 'login',
  Opportunity = 'opportunity',
  Emuse = 'xaaf-metrics.att.com'
}

/**
 * An HTTP service wrapper spying on a real HTTP service transactions.
 * The class delegates all its method calls to the real HTTP service, being able to spy on both requests and responses.
 * The class currently spies only on responses for a specific transaction (set in constructor), holding them internally
 * and exposing them on demand.
 */
export class SpiedHttpService implements HttpService {
  private _realHttpService;
  private readonly _spiedTransactionType;
  private _lastSpiedHttpResponse;
  private _axiosInstance: AxiosInstance;
  requests: string[] = [];

  constructor(_realHttpServiceInstance: HttpService, spiedTransactionType: SpiedTransactionType) {
    this._realHttpService = _realHttpServiceInstance;
    this._axiosInstance = _realHttpServiceInstance['_axiosInstance'];
    this._spiedTransactionType = spiedTransactionType;
  }

  async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    if (this._shouldSpyOnTransaction(url)) {
      this.requests.push(url);
    }
    const httpResponse = await this._realHttpService.get(url, options);

    if (this._shouldSpyOnTransaction(url)) {
      this._lastSpiedHttpResponse = httpResponse;
    }

    return httpResponse;
  }

  async post<T>(url: string, options?: HttpRequestOptions, body?: unknown): Promise<HttpResponse<T>> {
    if (this._shouldSpyOnTransaction(url)) {
      this.requests.push(url);
    }

    const httpResponse = await this._realHttpService.post(url, options, body);

    if (this._shouldSpyOnTransaction(url)) {
      this._lastSpiedHttpResponse = httpResponse;
    }

    return httpResponse;
  }

  async put<T>(url: string, options?: HttpRequestOptions, body?: unknown): Promise<HttpResponse<T>> {
    if (this._shouldSpyOnTransaction(url)) {
      this.requests.push(url);
    }
    const httpResponse = await this._realHttpService.put(url, options, body);

    if (this._shouldSpyOnTransaction(url)) {
      this._lastSpiedHttpResponse = httpResponse;
    }

    return httpResponse;
  }

  async request<T>(url: string, method: string, options: HttpRequestOptions): Promise<HttpResponse<T>> {
    if (this._shouldSpyOnTransaction(url)) {
      this.requests.push(url);
    }
    const httpResponse = await this._realHttpService.request(url, method, options);

    if (this._shouldSpyOnTransaction(url)) {
      this._lastSpiedHttpResponse = httpResponse;
    }

    return httpResponse;
  }

  private _shouldSpyOnTransaction(requestUrl: string): boolean {
    return requestUrl.includes(this._spiedTransactionType);
  }

  get lastSpiedHttpResponse(): HttpResponse<unknown> {
    return this._lastSpiedHttpResponse;
  }
}
