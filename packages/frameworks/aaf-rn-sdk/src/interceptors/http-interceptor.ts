import * as Core from '@xaaf/common';
import { DeviceInfo } from '../utils';
import * as Xaaf from '@xaaf/xaaf-js-sdk';

const retrieveUserAgent = async (): Promise<string> => {
    const { getDeviceId, getSystemName, getSystemVersion, getDeviceManufacturer, getDeviceModel } = DeviceInfo();
    let manufacturer: string = '';
    try {
        manufacturer = await getDeviceManufacturer();
    } catch (e) {
        manufacturer = '';
    }
    const _userAgent = `${manufacturer}/${getDeviceId()} (${getDeviceModel()}, ${getSystemName()}-${getSystemVersion()})`;
    const _loggerService = Xaaf.LoggerService.getInstance();
    _loggerService.info(_userAgent);
    return _userAgent;
};

export function setInterceptor(): void {
    const _httpService = Core.InjectionContainer.resolve<Core.HttpService>(Core.ContainerDef.httpService);
    _httpService.interceptors().request.use(async (options) => {
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = await retrieveUserAgent();
        }
        return options;
    });
}
