import * as Core from '@xaaf/common';
import { XaafKeyService } from '@xaaf/key-service';
import { DateHelper } from '../../utils/date-helper';
import { ConfigService } from '../config-service/config-service';

export enum TokenExpirationStatus {
    VALID = 'VALID',
    EXPIRED = 'EXPIRED',
    ABOUT_TO_EXPIRE = 'ABOUT_TO_EXPIRE'
}
export class TokenService {
    private _accessTokenObj: Core.TokenData;
    private _refreshTokenObj: Core.TokenData;

    private _accessTokenExpirationTime: number;
    private _refreshTokenExpirationTime: number;
    static getInstance(): TokenService {
        return Core.InjectionContainer.resolve<TokenService>(Core.ContainerDef.tokenService);
    }

    get accessTokenExpirationTime(): number {
        return this._accessTokenExpirationTime;
    }

    get refreshTokenExpirationTime(): number {
        return this._refreshTokenExpirationTime;
    }

    get accessTokenObj(): Core.TokenData {
        return this._accessTokenObj;
    }

    get refreshTokenObj(): Core.TokenData {
        return this._refreshTokenObj;
    }

    decodeTokens(accessToken: string, refreshToken: string): void {
        const keyService = new XaafKeyService();
        this._accessTokenObj = keyService.decode<Core.TokenData>(accessToken);
        this._refreshTokenObj = keyService.decode<Core.TokenData>(refreshToken);
        this.setTokensExpirationDates(this._accessTokenObj, this._refreshTokenObj);
    }

    setTokensExpirationDates(accessTokenObj: Core.TokenData, refreshTokenObj: Core.TokenData): void {
        this._accessTokenExpirationTime = accessTokenObj.exp;
        this._refreshTokenExpirationTime = refreshTokenObj.exp;
    }

    getTokenExpirationStatus(tokenExpirationTime: number): TokenExpirationStatus {
        const expirationDate: Date = DateHelper.castEpochToDate(tokenExpirationTime);
        if (new Date() >= expirationDate) {
            return TokenExpirationStatus.EXPIRED;
        }

        expirationDate.setMinutes(
            expirationDate.getMinutes() - ConfigService.getInstance().lazyRefreshTokenBeforeExpirationMinutes
        );
        if (new Date() >= expirationDate) {
            return TokenExpirationStatus.ABOUT_TO_EXPIRE;
        }
        return TokenExpirationStatus.VALID;
    }

    accessTokenTokenExpirationStatus(): TokenExpirationStatus {
        return this.getTokenExpirationStatus(this.accessTokenExpirationTime);
    }

    refreshTokenTokenExpirationStatus(): TokenExpirationStatus {
        return this.getTokenExpirationStatus(this.refreshTokenExpirationTime);
    }
}
Core.InjectionContainer.registerSingleton(Core.ContainerDef.tokenService, TokenService);
