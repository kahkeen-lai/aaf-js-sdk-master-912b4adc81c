/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import { LoginResponse, AdEventReason } from '@xaaf/common';
import { ExecutableAd } from './executable-ad';
import { ConfigService, ReportService, ReportServiceDelegate, AppConfig } from '../services';
import { XaafAdContainerMock } from '../mock/models';
import { OpportunityType } from './opportunity';
import { LoginService } from '../services/login-service/login-service';
import { XaafAdContainer } from './elements';
import { ArrayHelper } from '../utils/array-helper';
import { setMockedResponse } from '../mock/mock';

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

describe('adLifeCycleParameters ', () => {
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

    it('adLifeCycleParameters map is retrieved with right values after ad_loaded', (done) => {
        LoginService.getInstance().isLoggedIn = true;
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);
        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);
        const reportService = ReportService.getInstance();
        const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();
        let adLifeCycleParametersArray = {};

        const executableAd = new ExecutableAd({
            // NOSONAR - false positive
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });

        jest.spyOn(reportService, 'setAdLifeCycleParameters').mockImplementation((map: Map<any, any>) => {
            adLifeCycleParametersArray = ArrayHelper.convertMapToArray(map);
        });

        expect(adLifeCycleParametersArray).toEqual({});
        expect(Object.keys(adLifeCycleParametersArray).length).toEqual(0);

        executableAd.initAd(xaafAdContainerMock, initAdinfo);
        executableAd.executableAdEventListener = () => {
            expect(adLifeCycleParametersArray['projectBuildNumber']).toEqual('1');
            expect(adLifeCycleParametersArray['projectId']).toEqual('7511');
            expect(adLifeCycleParametersArray['expID']).toEqual('01cd3f17-f4c9-4a01-92b0-3e6110ad54f9');
            expect(Object.keys(adLifeCycleParametersArray).length).toEqual(3);
            done();
        };
    });

    describe('Reasons from AD_STOPPED event', () => {
        it('check no reason', () => {
            LoginService.getInstance().isLoggedIn = true;
            const el = new XaafAdContainerMock();
            const initAdinfo = new Map<string, string>([['test', 'abc']]);
            executableAd.initAd(el, initAdinfo);
            expect(executableAd['_stoppingReason']).toEqual(AdEventReason.NA);
        });

        it('check reason AD_ACTION_BLACKLIST', async (done) => {
            LoginService.getInstance().isLoggedIn = true;
            const el = new XaafAdContainerMock();
            const initAdinfo = new Map<string, string>([['channelName', 'Boomerang']]);
            executableAd.executableAdEventListener = () => {
                expect(executableAd['_stoppingReason']).toEqual(AdEventReason.AD_ACTION_BLACKLIST);
                done();
            };
            await executableAd.initAd(el, initAdinfo);
        });

        it('check reason NOT_LOGGED_IN', (done) => {
            LoginService.getInstance().isLoggedIn = false;
            const el = new XaafAdContainerMock();
            const initAdinfo = new Map<string, string>([['test', 'abc']]);
            executableAd.executableAdEventListener = () => {
                expect(executableAd['_stoppingReason']).toEqual(AdEventReason.NOT_LOGGED_IN);
                done();
            };
            executableAd.initAd(el, initAdinfo);
        });

        it('check reason AD_STOPPED', () => {
            executableAd.stopAd();
            expect(executableAd['_stoppingReason']).toEqual(AdEventReason.AD_STOPPED);
        });

        it('check reason AD_STOPPED With Interaction', async () => {
            LoginService.getInstance().isLoggedIn = true;
            const initAdinfo = new Map<string, string>([['foo', 'bar']]);
            const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
            setMockedResponse(200, opportunity);
            const xaafAdContainerMock: XaafAdContainer = new XaafAdContainerMock();

            const executableAd = new ExecutableAd({
                // NOSONAR - false positive
                opportunity: OpportunityType.Pause,
                arguments: new Map<string, string>()
            });

            await executableAd.initAd(xaafAdContainerMock, initAdinfo);

            executableAd.stopAd('', true);
            expect(executableAd['_stoppingReason']).toEqual(AdEventReason.USER_INTERACTION);
        });

        it('check hostStoppingReason when filled in AD_STOPPED', () => {
            executableAd.stopAd('my reason to stop the ad.');
            expect(executableAd['_hostStoppingReason']).toEqual('my reason to stop the ad.');
        });

        it('check hostStoppingReason when nothing filled in AD_STOPPED', () => {
            executableAd.stopAd();
            expect(executableAd['_hostStoppingReason']).toEqual('NA');
        });
    });
});
