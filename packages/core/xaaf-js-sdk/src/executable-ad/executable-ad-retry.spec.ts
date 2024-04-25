/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import '../mock/mock';
import * as Core from '@xaaf/common';
import { LoginResponse, RecoveryAction, ReportType } from '@xaaf/common';
import { ExecutableAd } from './executable-ad';
import { ConfigService, ReportService, ReportServiceDelegate, AppConfig } from '../services';
import { XaafAdContainerMock } from '../mock/models';
import { OpportunityType } from './opportunity';
import { LoginService } from '../services/login-service/login-service';

let executableAd: ExecutableAd;
class mockedDelegate implements ReportServiceDelegate {
    init(intervalInMilliseconds, bulkSize, bulkFFEnable): void {}
    isInitialized(): boolean {
        return true;
    }

    async putInReportQueue(report): Promise<boolean> {
        return true;
    }
}

beforeEach(() => {
    // Set up config service with mock data
    const login: LoginResponse = require('../mock/expectations/Login-200.json');
    const appConfig: AppConfig = {
        apiKey: login.token,
        sdkArguments: new Map([['foo', 'bar']]),
        loginRes: login,
        tokenData: {
            tenantId: 'string',
            tenantName: 'string',
            appId: 'string',
            platformName: 'string',
            sdkVersion: 'string',
            sdkName: 'string',
            enabled: true,
            host: 'string',
            privilegeType: 'string',
            environment: 'string',
            apiKeyIat: 0,
            iat: 0,
            exp: 0,
            iss: 'string',
            sub: 'string'
        }
    };

    ConfigService.getInstance().update(appConfig);

    // Set up executable ad with mock http service
    executableAd = new ExecutableAd({
        opportunity: OpportunityType.Pause,
        arguments: new Map<string, string>()
    });
});

afterEach(() => {
    if (executableAd) {
        executableAd.executableAdEventListener = null;
    }
});

describe('retry once after specific errors from getOpportunity', () => {
    let el, initAdinfo, httpService, reportService;
    const sleep = (ms): Promise<void> => new Promise((res) => setTimeout(res, ms));
    let mockedReportErrorMethod;

    beforeEach(() => {
        LoginService.getInstance().isLoggedIn = true;
        el = new XaafAdContainerMock();
        initAdinfo = new Map<string, string>([['foo', 'bar']]);
        httpService = Core.InjectionContainer.resolve<Core.HttpService>(Core.ContainerDef.httpService);
        reportService = ReportService.getInstance();
        Core.InjectionContainer.registerInstance(Core.ContainerDef.reportServiceDelegate, new mockedDelegate());

        mockedReportErrorMethod = jest.spyOn(reportService, 'reportError');
        reportService.init();
    });

    it('getOpportunity fails with error 500 - retry once is triggered', async () => {
        const status = 500;
        const body = {
            errorCode: '500',
            data: 'Internal Server Error',
            name: 'Internal_Server_Error',
            message: 'Internal Server Error'
        };
        const httpServiceGetSpy = jest.spyOn(httpService, 'get').mockImplementation(() =>
            Promise.reject({
                status,
                body
            })
        );
        await executableAd.initAd(el, initAdinfo);

        expect(httpServiceGetSpy).toBeCalledTimes(2);
        expect(mockedReportErrorMethod).toBeCalledTimes(1);
        const xaafError = mockedReportErrorMethod.mock.calls[0][0];
        expect(xaafError.isRecoverable).toEqual(true);
        expect(xaafError.recoveryActionTaken).toEqual(RecoveryAction.Retry);
        // expect(xaafError.didTryRecovery).toBeUndefined();
        expect(mockedReportErrorMethod).toHaveBeenCalledWith(xaafError, ReportType.AdError);
    });

    it('getOpportunity fails with error 503 - retry once is triggered', async () => {
        const status = 503;
        const body = {
            errorCode: '503',
            data: 'Service Unavailable',
            name: 'Service_Unavailable',
            message: 'Service Unavailable'
        };
        const isGetCalled = jest.spyOn(httpService, 'get').mockImplementation(() =>
            Promise.reject({
                status,
                body
            })
        );

        executableAd.initAd(el, initAdinfo);

        await sleep(10);
        expect(isGetCalled).toBeCalledTimes(2);
        expect(mockedReportErrorMethod).toBeCalledTimes(1);
        const xaafError = mockedReportErrorMethod.mock.calls[0][0];
        expect(xaafError.isRecoverable).toEqual(true);
        expect(xaafError.recoveryActionTaken).toEqual(RecoveryAction.Retry);
        // expect(xaafError.didTryRecovery).toBeUndefined();
        expect(mockedReportErrorMethod).toHaveBeenCalledWith(xaafError, ReportType.AdError);
    });

    it('getOpportunity fails with error 500-1 - retry once is triggered', async () => {
        const status = 500;
        const body = {
            errorCode: '500-1',
            data: 'Failure Engaging Ad Router',
            name: 'Failure_Engaging_Ad_Router',
            message: 'Failure Engaging Ad Router'
        };

        const isGetCalled = jest.spyOn(httpService, 'get').mockImplementation(() =>
            Promise.reject({
                status,
                body
            })
        );

        executableAd.initAd(el, initAdinfo);

        await sleep(10);
        expect(isGetCalled).toBeCalledTimes(2);
        expect(mockedReportErrorMethod).toBeCalledTimes(1);
        const xaafError = mockedReportErrorMethod.mock.calls[0][0];
        expect(xaafError.isRecoverable).toEqual(true);
        expect(xaafError.recoveryActionTaken).toEqual(RecoveryAction.Retry);
        // expect(xaafError.didTryRecovery).toBeUndefined();
        expect(mockedReportErrorMethod).toHaveBeenCalledWith(xaafError, ReportType.AdError);
    });

    it('getOpportunity fails with error 500-9000 - retry once is triggered', async (done) => {
        const status = 500;
        const body = {
            errorCode: '500-9000',
            data: 'General Error',
            name: 'General_Error',
            message: 'General Error'
        };

        const isGetCalled = jest.spyOn(httpService, 'get').mockImplementation(() =>
            Promise.reject({
                status,
                body
            })
        );

        executableAd.initAd(el, initAdinfo);
        executableAd.executableAdEventListener = () => {
            expect(isGetCalled).toBeCalledTimes(2);
            expect(mockedReportErrorMethod).toBeCalledTimes(1);
            const xaafError = mockedReportErrorMethod.mock.calls[0][0];
            expect(xaafError.isRecoverable).toEqual(true);
            expect(xaafError.recoveryActionTaken).toEqual(RecoveryAction.Retry);
            // expect(xaafError.didTryRecovery).toBeUndefined();
            expect(mockedReportErrorMethod).toHaveBeenCalledWith(xaafError, ReportType.AdError);
            done();
        };
    });
});
