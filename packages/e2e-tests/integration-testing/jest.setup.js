require('dotenv').config();

const axios = require('axios');
const tunnel = require('tunnel');
axios.interceptors.request.use(setProxyAccess);

const XaafHttpService = require('@xaaf/http-axios').XaafHttpService;
const Core = require('@xaaf/xaaf-js-sdk');
Core.InjectionContainer.registerSingleton(Core.ContainerDef.httpService, XaafHttpService);
const httpService = Core.InjectionContainer.resolve(Core.ContainerDef.httpService);
httpService['_axiosInstance'].interceptors.request.use(setProxyAccess);

function setProxyAccess(options) {
    if (process && process.env.HTTPS_PROXY && options.url && options.url.indexOf('https://') > -1) {
        const proxtUrl = new URL(process.env.HTTPS_PROXY);
        const targetUrl = new URL(options.url);
        options.proxy = false;
        options.baseURL = `${targetUrl.protocol}//${targetUrl.hostname}:${targetUrl.port || 443}`;
        options.httpsAgent = tunnel.httpsOverHttp({
            rejectUnauthorized: false,
            proxy: {
                host: proxtUrl.hostname,
                port: Number(proxtUrl.port)
            }
        });
    }
    return options;
}