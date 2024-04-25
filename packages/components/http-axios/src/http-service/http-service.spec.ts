import { HttpService } from './http-service';
import * as Core from '@xaaf/common';

describe('http service functions', () => {
    Core.InjectionContainer.registerInstance(Core.ContainerDef.configService, { timeouts: 30 });
    Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsService, { httpTimeoutEnabled: true });
    Core.InjectionContainer.registerInstance(Core.ContainerDef.loggerService, {
        debug: (str) => {
            console.log(str);
        },
        error: (str) => {
            console.error(str);
        }
    });
    const httpService: HttpService = new HttpService();
    const deviceType = 'tvos';
    const partnerProfileId = 'fVxL8dkHB10Exi1+/kjYhQ==';
    const url = 'http://ravenprod_v13_m.emuse.ie/default.xml';
    const urlWithParams = `http://ravenprod_v13_m.emuse.ie/default.xml?deviceType=${deviceType}&partnerProfileID=${partnerProfileId}`;
    const httpRequestOptions: Core.HttpRequestOptions = {
        params: {
            deviceType,
            partnerProfileId
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };
    let axiosInstance;
    beforeEach(() => {
        jest.clearAllMocks();
        axiosInstance = httpService['_axiosInstance'];
        axiosInstance.request = jest.fn().mockReturnValue({ status: 200 });
        // @ts-ignore
        jest.spyOn(httpService, 'request');
        // @ts-ignore
        jest.spyOn(httpService, 'handleRequestError');
    });

    it('get url', async () => {
        await httpService.get(url);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledWith(url, 'GET', undefined);
    });

    it('put url', async () => {
        await httpService.put(url);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledWith(url, 'PUT', expect.anything());
    });

    it('post url', async () => {
        await httpService.post(url);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledWith(url, 'POST', expect.anything());
    });

    it('get url with inbound params should not encode params', async () => {
        await httpService.get(urlWithParams);
        const httpRequestOptionsSent = axiosInstance.request['mock'].calls[0][0];
        const uri = axiosInstance.getUri(httpRequestOptionsSent);
        expect(uri).toEqual(urlWithParams);
    });

    it('get url with params object should encode params', async () => {
        await httpService.get(url, httpRequestOptions);
        const httpRequestOptionsSent = axiosInstance.request['mock'].calls[0][0];
        const uri = axiosInstance.getUri(httpRequestOptionsSent);
        const partnerProfileIdEncoded = uri.substring(uri.lastIndexOf('=') + 1);
        expect(partnerProfileIdEncoded).toEqual(encodeURIComponent(partnerProfileId));
        const partnerProfileIdDecoded = new URL(uri).searchParams.get('partnerProfileId');
        expect(partnerProfileIdDecoded).toEqual(partnerProfileId);
    });

    it('get url with 400 status code', async () => {
        axiosInstance.request = jest.fn().mockRejectedValue({
            response: {
                status: 400
            }
        });
        try {
            await httpService.get(url);
        } catch (error) {
            expect(error).toEqual({ status: 400 });
        }
        expect.assertions(4);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledWith(url, 'GET', undefined);
        // @ts-ignore
        expect(httpService.handleRequestError).toHaveBeenCalledTimes(1);
    });

    it('get url with timeout error', async () => {
        axiosInstance.request = jest.fn().mockRejectedValue({
            code: 'ECONNABORTED'
        });

        try {
            await httpService.get(url, { ...httpRequestOptions, timeout: 500 });
        } catch (error) {
            expect(error).toEqual(
                Core.ErrorUtils.httpError(
                    Core.ErrorCode.ResourceTimeout,
                    `Request timed out: ${url}`,
                    undefined,
                    'http-service::request'
                )
            );
        }
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledWith(url, 'GET', { ...httpRequestOptions, timeout: 500 });
        // @ts-ignore
        expect(httpService.handleRequestError).toHaveBeenCalledTimes(1);
    });

    it('get url with general error', async () => {
        axiosInstance.request = jest.fn().mockRejectedValue({
            message: 'Failed to get'
        });
        await expect(httpService.get(url, httpRequestOptions)).rejects.toEqual(
            Core.ErrorUtils.httpError(
                Core.ErrorCode.GeneralError,
                'Request failed: Failed to get',
                undefined,
                'http-service::request'
            )
        );
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(httpService.request).toHaveBeenCalledWith(url, 'GET', httpRequestOptions);
        // @ts-ignore
        expect(httpService.handleRequestError).toHaveBeenCalledTimes(1);
    });

    it('get url with http timeout disabled', async () => {
        // @ts-ignore
        httpService._featureFlagService.httpTimeoutEnabled = false;
        // est.spyOn(httpService._featureFlagService, 'httpTimeoutEnabled').mockReturnValue(false);
        await httpService.get(url, { ...httpRequestOptions, timeout: 10000 });
        const httpRequestOptionsSent: Core.HttpRequestOptions = axiosInstance.request['mock'].calls[0][0];
        expect(httpRequestOptionsSent.timeout).not.toBeDefined();
    });

    it('get url with http timeout enabled', async () => {
        // @ts-ignore
        httpService._featureFlagService.httpTimeoutEnabled = true;
        // jest.spyOn(httpService._featureFlagService, 'httpTimeoutEnabled').mockReturnValue(true);
        await httpService.get(url, { ...httpRequestOptions, timeout: 10000 });
        const httpRequestOptionsSent: Core.HttpRequestOptions = axiosInstance.request['mock'].calls[0][0];
        expect(httpRequestOptionsSent.timeout).toEqual(10000);
    });

    it('get url with http timeout enabled using default timeout', async () => {
        // @ts-ignore
        httpService._featureFlagService.httpTimeoutEnabled = true;
        // jest.spyOn(httpService._featureFlagService, 'httpTimeoutEnabled').mockReturnValue(true);
        await httpService.get(url, httpRequestOptions);
        const httpRequestOptionsSent: Core.HttpRequestOptions = axiosInstance.request['mock'].calls[0][0];
        // @ts-ignore
        expect(httpRequestOptionsSent.timeout).toEqual(httpService._configService.timeouts.http);
    });
});
