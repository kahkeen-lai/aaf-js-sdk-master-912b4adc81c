import * as Xaaf from '@xaaf/xaaf-js-sdk';

Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.configService, Xaaf.ConfigService);
Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsService, Xaaf.FeatureFlagsService);
const httpMock = jest.mock('@xaaf/http-axios');
Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.httpService, httpMock);
let mockItems: Record<string, string> = {};
export const mockedSecureAsyncStorage = {
    getItem: jest.fn(async (key) => mockItems[key]),

    setItem: jest.fn(async (key, value) => {
        mockItems[key] = value;
    }),

    getAllKeys: jest.fn(
        (callback) =>
            new Promise((resolve) => {
                const keys = Object.keys(mockItems);
                callback && callback(null, keys);
                resolve(keys);
            })
    ),

    multiRemove: jest.fn(
        async (keys: string[]) =>
            new Promise<void>((resolve) => {
                keys.forEach((key) => {
                    delete mockItems[key];
                });

                resolve();
            })
    ),

    multiGet: jest.fn(async (keys: string[], callback?: (errors?: Error[], result?: [string, string][]) => void) => {
        const keyValues: [string, string][] = keys.map((key) => [key, mockItems[key]]);
        callback && callback(null, keyValues);
        return keyValues;
    }),

    // method for test usage only
    removeAll: jest.fn(async () => {
        mockItems = {};
    })
};

jest.mock('../utils/SecureAsyncStorage', () => ({
    setItem: mockedSecureAsyncStorage.setItem,
    getItem: mockedSecureAsyncStorage.getItem,
    getAllKeys: mockedSecureAsyncStorage.getAllKeys,
    multiRemove: mockedSecureAsyncStorage.multiRemove,
    multiGet: mockedSecureAsyncStorage.multiGet,
}));
