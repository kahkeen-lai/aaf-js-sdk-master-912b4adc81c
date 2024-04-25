/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import '../mock/mock';
import { LoginResponse, ErrorResponse } from '@xaaf/common';
import { ExecutableAd } from './executable-ad';
import { ConfigService, ReportServiceDelegate, AppConfig } from '../services';
import { XaafAdContainerMock } from '../mock/models';
import { OpportunityType } from './opportunity';
import { setMockedBadResponse } from '../mock';

let executableAd: ExecutableAd;

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

it('error response should be handled', (done) => {
    setMockedBadResponse(500, {
        message: 'string',
        name: 'string',
        errorCode: '500-9000',
        data: 'string'
    } as ErrorResponse);

    const el = new XaafAdContainerMock();
    const initAdinfo = new Map<string, string>([
        ['foo', 'bar'],
        ['platform', 'dfw'],
        ['sdkName', 'tvos'],
        ['contentType', 'vod'],
        ['userType', '2'],
        ['sdkVersion', 'v1'],
        ['tenantSystemName', 'directv'],
        ['deviceType', 'tvos']
    ]);
    expect.assertions(1);
    executableAd.executableAdEventListener = (adEvent) => {
        expect(adEvent.type).toEqual('Stopped');
        done();
    };
    executableAd.initAd(el, initAdinfo);
});
