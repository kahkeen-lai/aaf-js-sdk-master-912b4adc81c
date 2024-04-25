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
import { Xip } from '@xaaf/common';
import { State } from '../fsm/state';
import { LoginService } from '../services/login-service/login-service';
import { AttributeNames } from './attributes/attributes';
import { adSessionParamsMock } from '../mock/report';
import { setMockedBadResponse, setMockedResponse } from '../mock/mock';

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

it('executable ad should be created', () => {
    expect(executableAd).not.toBeNull();
    expect(executableAd.currentState).toBe(State.STATE_CREATED);
});

it('plain javascript object should be converted to map', () => {
    const el = new XaafAdContainerMock();
    const initAdinfo = {
        foo: 'bar',
        platform: 'dfw',
        sdkName: 'tvos',
        contentType: 'vod',
        userType: '2',
        sdkVersion: 'v1',
        tenantSystemName: 'directv',
        deviceType: 'tvos'
    };

    executableAd.initAd(el, initAdinfo);
    expect(executableAd).not.toBeNull();
    expect(executableAd.currentState).toBe(State.STATE_CREATED);
});

it('init should parse XIP', async () => {
    const opportunity = require('../mock/expectations/SHOW_VIDEO.json');

    setMockedResponse(200, opportunity);
    LoginService.getInstance().isLoggedIn = true;
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

    expect.assertions(3);
    await executableAd.initAd(el, initAdinfo);
    // @ts-ignore
    expect(executableAd._triggersToCommandsMap?.get('STATE_STARTED')).not.toBeNull();
    // @ts-ignore
    expect(executableAd._commandsArray).not.toBeNull();
    // @ts-ignore
    expect(executableAd._commandsArray[0]).not.toBeNull();
});

it('parseCommands should parse commands', () => {
    const opportunity: Xip = require('../mock/expectations/SHOW_VIDEO.json');
    const triggerToCommandMap = executableAd.parseCommands(opportunity.commands);
    expect(triggerToCommandMap.get['STATE_STARTED']).not.toBeNull();
});

it('204 no ad should be handled correctly - exad stopped', async () => {
    setMockedResponse(204, null);

    const el = new XaafAdContainerMock();
    const initAdinfo = new Map<string, string>([['foo', 'bar']]);

    // @ts-ignore
    const spyOnFunctionstopAd = jest.spyOn(executableAd, '_stopAd');
    executableAd.initAd(el, initAdinfo);
    executableAd.executableAdEventListener = (adEvent) => {
        expect(spyOnFunctionstopAd).toHaveBeenCalled();
    };
});

it('429 stop ad should not be called', async (done) => {
    setMockedResponse(429, null);

    const el = new XaafAdContainerMock();
    const initAdinfo = new Map<string, string>([['foo', 'bar']]);
    // @ts-ignore
    const spyOnFunctionStopAd = jest.spyOn(executableAd, '_stopAd');
    executableAd.executableAdEventListener = (adEvent) => {
        expect(spyOnFunctionStopAd).not.toHaveBeenCalled();
        expect.assertions(1);
        done();
    };
    executableAd.initAd(el, initAdinfo);
});

it('get unknown attribute on executable ad - should return undefined', () => {
    const attributeValue = when_getAttributeExecutedWith('ABC' as AttributeNames);

    then_attributeValueEqualsTo(attributeValue, undefined);
});

it('get attributes on created executable ad - should return state attribute CREATED and others as undefined', async () => {
    const stateAttributeValue = when_getAttributeExecutedWith(AttributeNames.STATE);
    const executableAdIdAttributeValue = when_getAttributeExecutedWith(AttributeNames.EXECUTABLE_AD_UUID);
    const experienceIdAttributeValue = when_getAttributeExecutedWith(AttributeNames.EXPERIENCE_ID);
    const experienceMediaTypeAttributeValue = when_getAttributeExecutedWith(AttributeNames.EXPERIENCE_MEDIA_TYPE);
    const abstractionIdAttributeValue = when_getAttributeExecutedWith(AttributeNames.ABSTRACTION_ID);
    const actionAttributeValue = when_getAttributeExecutedWith(AttributeNames.ACTION);
    const itemTypeAttributeValue = when_getAttributeExecutedWith(AttributeNames.ITEM_TYPE);
    const contentTypeAttributeValue = when_getAttributeExecutedWith(AttributeNames.CONTENT_TYPE);

    then_attributeValueEqualsTo(stateAttributeValue, State.STATE_CREATED);
    then_attributeValueEqualsTo(executableAdIdAttributeValue, undefined);
    then_attributeValueEqualsTo(experienceIdAttributeValue, undefined);
    then_attributeValueEqualsTo(experienceMediaTypeAttributeValue, undefined);
    then_attributeValueEqualsTo(abstractionIdAttributeValue, undefined);
    then_attributeValueEqualsTo(actionAttributeValue, undefined);
    then_attributeValueEqualsTo(itemTypeAttributeValue, undefined);
    then_attributeValueEqualsTo(contentTypeAttributeValue, undefined);
});

it('get attributes on initialized executable ad - should return state LOADED and others as in XIP response', async () => {
    await given_executableAdInitialized();
    addListenerToExecutableAdToCheckForAttributes(State.STATE_LOADED);
});

it('_createAdInitRecord function', (): void => {
    const execAd = new ExecutableAd({
        opportunity: OpportunityType.Pause,
        arguments: new Map<string, string>([
            ['channelName', 'espn'],
            ['expType', 'out_of_stream'],
            ['isDuringAd', 'true'],
            ['networkName', 'abc'],
            ['programmerName', 'disney'],
            ['programName', 'game_of_throne'],
            ['adStartDelayHint', '30'],
            ['channelId', '12345'],
            ['contentType', 'vod'],
            ['context', 'pause']
        ])
    });

    const sessionParams = execAd['_adInitRecord'];
    expect(sessionParams).toEqual(adSessionParamsMock);
});

async function given_executableAdInitialized(): Promise<void> {
    const mockedResponseData = require('../mock/expectations/SHOW_VIDEO.json');
    setMockedResponse(200, mockedResponseData);
    LoginService.getInstance().isLoggedIn = true;

    const mockedElement = new XaafAdContainerMock();
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

    executableAd.initAd(mockedElement, initAdinfo);
}

function when_getAttributeExecutedWith(attributeName: AttributeNames): string {
    return executableAd.getAttribute(attributeName);
}

function then_attributeValueEqualsTo(attributeValue: string, expectedAttributeValue: string): void {
    expect(attributeValue).toBe(expectedAttributeValue);
}

function then_executableAdStateIs(state: string): void {
    expect(executableAd.getAttribute(AttributeNames.STATE)).toBe(state);
}

function addListenerToExecutableAdToCheckForAttributes(expectedState: string): void {
    executableAd.executableAdEventListener = (adEvent) => {
        then_executableAdStateIs(expectedState);
        const executableAdIdAttributeValue = when_getAttributeExecutedWith(AttributeNames.EXECUTABLE_AD_UUID);
        const experienceIdAttributeValue = when_getAttributeExecutedWith(AttributeNames.EXPERIENCE_ID);
        const experienceMediaTypeAttributeValue = when_getAttributeExecutedWith(AttributeNames.EXPERIENCE_MEDIA_TYPE);
        const abstractionIdAttributeValue = when_getAttributeExecutedWith(AttributeNames.ABSTRACTION_ID);
        const actionAttributeValue = when_getAttributeExecutedWith(AttributeNames.ACTION);
        const itemTypeAttributeValue = when_getAttributeExecutedWith(AttributeNames.ITEM_TYPE);
        const contentTypeAttributeValue = when_getAttributeExecutedWith(AttributeNames.CONTENT_TYPE);
        then_attributeValueEqualsTo(executableAdIdAttributeValue, 'BEc7bded-4c6f-413e-bc8d-60c250edd33c');
        then_attributeValueEqualsTo(experienceIdAttributeValue, '01cd3f17-f4c9-4a01-92b0-3e6110ad54f9');
        then_attributeValueEqualsTo(experienceMediaTypeAttributeValue, 'Video Screensaver Ad');
        then_attributeValueEqualsTo(abstractionIdAttributeValue, '6fc364e7-59cb-d582-536c-84baa13ad165');
        then_attributeValueEqualsTo(actionAttributeValue, 'Watch now');
        then_attributeValueEqualsTo(itemTypeAttributeValue, 'PROGRAM');
        then_attributeValueEqualsTo(contentTypeAttributeValue, 'EPISODE');
    };
}

function setIsLoggedInAndMockResponse(url: string): Map<string, string> {
    LoginService.getInstance().isLoggedIn = true;
    const initAdinfo = new Map<string, string>([['foo', 'bar']]);
    const opportunity = require(url);
    setMockedResponse(200, opportunity);
    return initAdinfo;
}
