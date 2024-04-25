/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorResponse, HttpResponse, HttpService, InjectionContainer, ContainerDef } from '@xaaf/common';
import { XaafKeyService } from '@xaaf/key-service';
import '../services/validator-service/validator-service';
import { LoginService } from '../services/login-service/login-service';
import { ConfigService } from '../services/config-service/config-service';
import { DateTimeService } from '../services/date-time-service/date-time-service';
import { FeatureFlagsService } from '../services/feature-flags-service/feature-flags-service';
import { TokenService } from '../services/token-service/token-service';
import * as Xaaf from '@xaaf/common';
import { CommandsDataStructuresCreator } from '../executable-ad/structures/commands-data-structures-creator';

export function resetMocks(): void {
    const {
        featureFlagsDelegate,
        tokenService,
        configService,
        dateTimeService,
        keyService,
        httpService,
        loginService,
        storageService
    } = ContainerDef;
    InjectionContainer.registerSingleton(ContainerDef.commandsDataStructuresCreator, CommandsDataStructuresCreator);
    InjectionContainer.registerInstance(featureFlagsDelegate, {
        isFlagEnabled: (_) => true,
        setup: (_) => Promise.resolve(),
        register: (_) => {},
        fetch: () => {}
    });

    InjectionContainer.registerSingleton(tokenService, TokenService);
    InjectionContainer.registerSingleton(configService, ConfigService);
    InjectionContainer.registerSingleton(dateTimeService, DateTimeService);
    InjectionContainer.registerSingleton(keyService, XaafKeyService);
    InjectionContainer.registerInstance(httpService, {
        request: jest.fn(async () => ({} as any)),
        get: jest.fn(async () => ({} as any)),
        post: jest.fn(async () => ({} as any))
    });
    InjectionContainer.registerSingleton(loginService, LoginService);
    InjectionContainer.registerInstance(storageService, {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn()
    });
    const reportServiceDelagate = {
        init: (_intervalInMilliseconds, _bulkSize) => undefined,
        isInitialized: () => true,
        putInReportQueue: (_report) => Promise.resolve(true)
    };
    InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, reportServiceDelagate);
}

resetMocks();
InjectionContainer.resolve<FeatureFlagsService>(ContainerDef.featureFlagsService);
InjectionContainer.resolve<LoginService>(ContainerDef.loginService);
InjectionContainer.resolve<TokenService>(ContainerDef.tokenService);
Xaaf.InjectionContainer.registerInstance(ContainerDef.featureFlagsDelegate, {
    isFlagEnabled: (_) => true,
    setup: (_) => Promise.resolve(),
    register: (_) => {},
    fetch: () => {}
});

export function setMockedResponse(status: number, body: unknown): void {
    const httpService: HttpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
    httpService.request = jest.fn(async () => handleResponse(status, body));
    httpService.get = jest.fn(async () => handleResponse(status, body));
    httpService.post = jest.fn(async () => handleResponse(status, body));
}

export function setMockedErrorResponse(message: string): void {
    const httpService: HttpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
    httpService.request = jest.fn(() =>
        Promise.reject({
            data: message
        })
    );
}

export function setMockedBadResponse(status: number, data: ErrorResponse | Error): void {
    const httpService: HttpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
    httpService.request = jest.fn().mockImplementation(() => handleResponse(status, data));
}

let retries = 0;

export function resetMockedResponseWithIntervals(): void {
    retries = 0;
}

export function setMockedResponseWithIntervals(results: Array<HttpResponse<any>>): void {
    const httpService: HttpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
    httpService.request = jest.fn(() => {
        const { status, body } = results[retries++] ?? { status: 404, body: {} };
        return handleResponse(status, body);
    });

    httpService.get = jest.fn(() => {
        const { status, body } = results[retries++] ?? { status: 404, body: {} };
        return handleResponse(status, body);
    });

    httpService.post = jest.fn(() => {
        const { status, body } = results[retries++] ?? { status: 404, body: {} };
        return handleResponse(status, body);
    });
}

export function mockModule(
    moduleToMock: string,
    functionToMock: string,
    objectToReturn: Record<string, unknown>
): void {
    jest.unmock(moduleToMock);
    const module = jest.requireActual(moduleToMock);
    module[functionToMock] = jest.fn().mockReturnValue(objectToReturn);
}

function handleResponse(status: number, data: any): Promise<any> {
    if (status >= 200 && status <= 300) {
        return Promise.resolve({
            status,
            data,
            body: data
        });
    } else {
        return Promise.reject({
            status,
            data,
            body: data
        });
    }
}
