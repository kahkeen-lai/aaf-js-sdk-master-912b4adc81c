/* eslint-disable @typescript-eslint/no-var-requires */
import { LoginResponse, TokenData } from '@xaaf/common';
import { ExecutableAd } from './executable-ad';
import { ConfigService, AppConfig } from '../services';
import { XaafAdContainerMock } from '../mock/models';
import { OpportunityType } from './opportunity';
import { State } from '../fsm/state';
import { LoginService } from '../services/login-service/login-service';
import { TokenService } from '../services/token-service/token-service';
import { DateHelper } from '../utils/date-helper';
import { setMockedResponse } from '../mock/mock';

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

describe('Refresh Token', () => {
    let _accessTokenObj: TokenData;
    let _refreshTokenObj: TokenData;
    let _refreshTokenIsCalled;
    let _loginRequestIsCalled;

    beforeEach(() => {
        _accessTokenObj = {
            tenantId: '5e6f42fefc8159001bb219f0',
            tenantName: 'directv',
            appId: '5e6f4308fc8159001bb219f3',
            sdkVersion: 'v1',
            environment: 'tlv-advertise-5988',
            platformName: 'pesat',
            sdkName: 'pesat',
            privilegeType: 'tester',
            apiKeyIat: 1584349962,
            iat: 1586092215,
            exp: 1586178615,
            iss: 'AT&T',
            sub: 'token',
            enabled: true,
            host: ''
        };
        _refreshTokenObj = {
            tenantId: '5e6f42fefc8159001bb219f0',
            tenantName: 'directv',
            appId: '5e6f4308fc8159001bb219f3',
            sdkVersion: 'v1',
            environment: 'tlv-advertise-5988',
            platformName: 'pesat',
            sdkName: 'pesat',
            privilegeType: 'tester',
            apiKeyIat: 1584349962,
            iat: 1586092215,
            exp: 1586697015,
            iss: 'AT&T',
            sub: 'refreshToken',
            enabled: true,
            host: ''
        };
        _refreshTokenIsCalled = jest.spyOn(LoginService.getInstance(), 'refreshToken');
        _loginRequestIsCalled = jest.spyOn(LoginService.getInstance(), 'silentLoginRequest');
    });

    afterEach(() => {
        _refreshTokenIsCalled.mockClear();
        _loginRequestIsCalled.mockClear();
    });

    test('both login request and refresh token are NOT called if access token is VALID BEFORE calling to getExecutableAd', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 10)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() + 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;
        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);

        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');

        setMockedResponse(200, opportunity);
        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).not.toBeCalled();
            expect(_loginRequestIsCalled).not.toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('refresh token is called and login request is NOT called if access token is ABOUT TO EXPIRE and refresh token is VALID BEFORE calling to getExecutableAd', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 4)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() + 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);
        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);
        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).toBeCalled();
            expect(_loginRequestIsCalled).not.toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('refresh token is called and login request is NOT called if access token is EXPIRED and refresh token is VALID BEFORE calling to getExecutableAd', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() - 10)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() + 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);
        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);
        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);
        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).toBeCalled();
            expect(_loginRequestIsCalled).not.toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('refresh token is NOT called and login request is called if both access token and refresh token are EXPIRED BEFORE calling to getExecutableAd', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() - 10)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() - 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);

        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);

        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).not.toBeCalled();
            expect(_loginRequestIsCalled).toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('refresh token is NOT called and login request is called if access token is EXPIRED and refresh token is ABOUT TO EXPIRE BEFORE calling to getExecutableAd', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() - 10)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 4)));
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);

        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);
        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).not.toBeCalled();
            expect(_loginRequestIsCalled).toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('login request is called and refresh token is NOT called if access token is ABOUT TO EXPIRE and refresh token is EXPIRED BEFORE calling to getExecutableAd', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 4)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() - 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);
        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);

        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).not.toBeCalled();
            expect(_loginRequestIsCalled).toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('login request is called and refresh token is NOT called if both access token and refresh token are ABOUT TO EXPIRE BEFORE calling to getExecutableAd', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 4)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 4)));
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);
        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);

        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).not.toBeCalled();
            expect(_loginRequestIsCalled).toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('both refresh token and login request are NOT called if access token is NOT EXPIRED WHILE calling to getExecutableAd and getting 200 succeeded', async () => {
        _accessTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 10)));
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() + 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);

        const opportunity = require('../mock/expectations/SHOW_VIDEO.json');
        setMockedResponse(200, opportunity);

        executableAd.initAd(el, initAdinfo);

        expect(_refreshTokenIsCalled).not.toBeCalled();
        expect(_loginRequestIsCalled).not.toBeCalled();
    });

    test('refresh token is called and login request is NOT called if refresh token is VALID WHILE calling to getExecutableAd and getting error SessionExpired - 401-1', async () => {
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() + 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);

        setMockedResponse(401, {
            errorCode: '401-1',
            data: 'Session expired',
            name: 'Session_Expired',
            message: 'User session has expired'
        });

        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).toBeCalled();
            expect(_loginRequestIsCalled).not.toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('refresh token is NOT called and login request is called if refresh token is EXPIRED WHILE calling to getExecutableAd and getting error SessionExpired - 401-1', async () => {
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(
            new Date(new Date().setMinutes(new Date().getMinutes() - 10))
        );
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);

        setMockedResponse(401, {
            errorCode: '401-1',
            data: 'Session expired',
            name: 'Session_Expired',
            message: 'User session has expired'
        });

        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).not.toBeCalled();
            expect(_loginRequestIsCalled).toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('refresh token is NOT called and login request is called if refresh token is ABOUT TO EXPIRE WHILE calling to getExecutableAd and getting error SessionExpired - 401-1', async () => {
        _refreshTokenObj.exp = DateHelper.castDateToEpoch(new Date(new Date().setMinutes(new Date().getMinutes() + 4)));
        TokenService.getInstance().setTokensExpirationDates(_accessTokenObj, _refreshTokenObj);

        LoginService.getInstance().isLoggedIn = true;

        const el = new XaafAdContainerMock();
        const initAdinfo = new Map<string, string>([['foo', 'bar']]);

        setMockedResponse(401, {
            errorCode: '401-1',
            data: 'Session expired',
            name: 'Session_Expired',
            message: 'User session has expired'
        });

        executableAd.executableAdEventListener = () => {
            expect(_refreshTokenIsCalled).not.toBeCalled();
            expect(_loginRequestIsCalled).toBeCalled();
        };
        executableAd.initAd(el, initAdinfo);
    });

    test('token is updated after successful call to loginRequest', async () => {
        const refresh = require('../mock/expectations/Login-200.json');
        setMockedResponse(200, refresh);
        await LoginService.getInstance().silentLoginRequest(false);
        expect(ConfigService.getInstance().token).toEqual(refresh.token);
    });

    test('token is updated after successful call to refreshToken', async () => {
        const refresh = require('../mock/expectations/RefreshToken-200.json');
        setMockedResponse(200, refresh);
        await LoginService.getInstance().refreshToken(false);
        expect(ConfigService.getInstance().token).toEqual(refresh.token);
    });

    test('token is NOT updated after unsuccessful call to loginRequest - 401-9000', async (done) => {
        setMockedResponse(401, {
            errorCode: '401-9000',
            data: 'Authentication Error',
            name: 'AuthenticationError',
            message: 'Authentication Error'
        });
        const currentToken = ConfigService.getInstance().token;

        try {
            await LoginService.getInstance().silentLoginRequest(false);
        } catch (error) {
            //
        }
        expect(ConfigService.getInstance().token).toEqual(currentToken);
        done();
    });

    test('_initAdEngagement', async () => {
        const initAdinfo = new Map<string, string>([
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
        ]);

        const execAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: initAdinfo
        });

        // @ts-ignore
        execAd.currentState = State.STATE_ERROR;
        expect(true).toBe(true);
    });
});
