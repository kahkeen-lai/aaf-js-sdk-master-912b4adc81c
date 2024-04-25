import { DateHelper } from '../../utils/date-helper';
import { TokenService, TokenExpirationStatus } from './token-service';
import { TokenData } from '@xaaf/common';

test('isTokenExpiredOrAboutToExpire function returns VALID if it gets a valid date', () => {
    const tokenExpirationTime: number = DateHelper.castDateToEpoch(
        new Date(new Date().setMinutes(new Date().getMinutes() + 10))
    );
    const tokenExpirationStatus: TokenExpirationStatus = TokenService.getInstance().getTokenExpirationStatus(
        tokenExpirationTime
    );
    expect(tokenExpirationStatus).toEqual(TokenExpirationStatus.VALID);
});

test('isTokenExpiredOrAboutToExpire function returns ABOUT_TO_EXPIRE if it gets a date that is about to expire', () => {
    const tokenExpirationTime: number = DateHelper.castDateToEpoch(
        new Date(new Date().setMinutes(new Date().getMinutes() + 4))
    );
    const tokenExpirationStatus: TokenExpirationStatus = TokenService.getInstance().getTokenExpirationStatus(
        tokenExpirationTime
    );
    expect(tokenExpirationStatus).toEqual(TokenExpirationStatus.ABOUT_TO_EXPIRE);
});

test('isTokenExpiredOrAboutToExpire function returns EXPIRED if it gets a date that is already expired', () => {
    const tokenExpirationTime: number = DateHelper.castDateToEpoch(
        new Date(new Date().setMinutes(new Date().getMinutes() - 10))
    );
    const tokenExpirationStatus: TokenExpirationStatus = TokenService.getInstance().getTokenExpirationStatus(
        tokenExpirationTime
    );
    expect(tokenExpirationStatus).toEqual(TokenExpirationStatus.EXPIRED);
});

test('exp tokens are retrieved ok after decoding tokens in decodeTokens function', () => {
    const accessToken: string =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsInRlbmFudE5hbWUiOiJkaXJlY3R2IiwiYXBwSWQiOiI1ZTZmNDMwOGZjODE1OTAwMWJiMjE5ZjMiLCJzZGtWZXJzaW9uIjoidjEiLCJlbnZpcm9ubWVudCI6InRsdi1hZHZlcnRpc2UtNTk4OCIsInBsYXRmb3JtTmFtZSI6InBlc2F0Iiwic2RrTmFtZSI6InBlc2F0IiwicHJpdmlsZWdlVHlwZSI6InRlc3RlciIsImFwaUtleUlhdCI6MTU4NDM0OTk2MiwiaWF0IjoxNTg2MDkyMjE1LCJleHAiOjE1ODYxNzg2MTUsImlzcyI6IkFUJlQiLCJzdWIiOiJ0b2tlbiJ9.feTxNc64FnwEbSPTlqKofiqv1lQ2otgZZELqi2E3yxNp6KdYz1amfPk3wiQ4nHioHrBbMXQJQ7saLRndJuziohkWCmKWAfVOCkJWTt_sWImBGVYBC8CRoF5uSrajMiPZ0sw0Ds4S8dMnsQTEgpamj3J2jYi_5P9ImM86RxurvprseszXlK3zwo-TpsFW6seP38xkzVeSTDBwz2hrRdS4aPn03_Lpl9SxuT6KOeX3rGpfkGAFj67yqv4qyfXUXGmj0srSAbxDjXeY6E5DKe2WKsC-NEtluGlmz1n_ep22Acs4ma_Yu6029bIi7Wb9sZyR7eIBQ9Wbkj81DntLPUoDkg';
    const refreshToken: string =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsInRlbmFudE5hbWUiOiJkaXJlY3R2IiwiYXBwSWQiOiI1ZTZmNDMwOGZjODE1OTAwMWJiMjE5ZjMiLCJzZGtWZXJzaW9uIjoidjEiLCJlbnZpcm9ubWVudCI6InRsdi1hZHZlcnRpc2UtNTk4OCIsInBsYXRmb3JtTmFtZSI6InBlc2F0Iiwic2RrTmFtZSI6InBlc2F0IiwicHJpdmlsZWdlVHlwZSI6InRlc3RlciIsImFwaUtleUlhdCI6MTU4NDM0OTk2MiwiaWF0IjoxNTg2MDkyMjE1LCJleHAiOjE1ODY2OTcwMTUsImlzcyI6IkFUJlQiLCJzdWIiOiJyZWZyZXNoVG9rZW4ifQ.ccn3IN8vY2P6mBuh2BEid3sP1BHIAt1laIGJjOOk68FkYITWyBxQblUth4SJQWtJ8o6cCJhhb5u8fkwbzlw8zWWGS3NthYZunErCwrTOc9u0WAjwCQZbaZUZIgmtFgeOBstBpwQNBNB3UnGnpHqjpkF3ZN3BNjWpXh939_Skc1jnM1broTRToSB60oEOlXKdJ3tFVHdkE6s_lx1dOMVzZAx19td0f8bn-otMMfr8xQQjbfb3u8dhZhs2-1TwdrSea3qZ1dMuME8PLnuxjS98BIxM190s6jXUjT-wlhpljvkNzxf57GiVPVLNKZI7UvuUgQIPdfVXQfUnRbh6jRTGog';

    TokenService.getInstance().decodeTokens(accessToken, refreshToken);

    expect(TokenService.getInstance().accessTokenObj.exp).toEqual(1586178615);
    expect(TokenService.getInstance().refreshTokenObj.exp).toEqual(1586697015);
});

test('exp tokens are retrieved ok after updating tokens in setTokensExpirationDates function', () => {
    const accessTokenObj: TokenData = {
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
    const refreshTokenObj: TokenData = {
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

    TokenService.getInstance().setTokensExpirationDates(accessTokenObj, refreshTokenObj);

    expect(TokenService.getInstance().accessTokenExpirationTime).toEqual(1586178615);
    expect(TokenService.getInstance().refreshTokenExpirationTime).toEqual(1586697015);
});
