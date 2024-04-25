/* eslint-disable @typescript-eslint/naming-convention */
import { ContentToggleItem } from '@xaaf/common';
import { LoggerService } from '../logger-service/logger-service';
import { ConfigService } from '../config-service/config-service';
export enum contentToggleListKeys {
    MODE = 'mode',
    CONTENT_TYPE = 'contentType',
    CHANNEL_NAME = 'channelName',
    MODE_BLACKLIST = 'blacklist',
    MODE_WHITELIST = 'whitelist',
    PROGRAM_NAME = 'programName',
    NETWORK_NAME = 'networkName',
    PROGRAMMER_NAME = 'programmerName',
    IS_DURING_AD = 'isDuringAd'
}

const INCLUDE = '+';
const EXCLUDE = '-';
const IS_VALID = true;

export class ContentToggleListService {
    private static instance: ContentToggleListService;
    protected _loggerService: LoggerService;
    constructor() {
        this._loggerService = LoggerService.getInstance();
    }

    static getInstance(): ContentToggleListService {
        if (!ContentToggleListService.instance) {
            ContentToggleListService.instance = new ContentToggleListService();
        }
        return ContentToggleListService.instance;
    }

    isContentValid(initAdInfo: Map<string, string>): boolean {
        this._loggerService.debug('[ContentToggleListService::isContentValid]');
        const contentToggleList = ConfigService.getInstance().contentToggleList;
        if (!contentToggleList || !contentToggleList[0]) {
            this._loggerService.debug(
                '[ContentToggleListService::isContentValid] contentToggleList is valid -> return true'
            );
            return true;
        }

        if (contentToggleList[0].mode === contentToggleListKeys.MODE_BLACKLIST) {
            this._loggerService.debug('[ContentToggleListService::isContentValid] MODE_BLACKLIST, start validation');
            return this._isContentValidAgainstBlacklist(contentToggleList, initAdInfo);
        } else if (contentToggleList[0].mode === contentToggleListKeys.MODE_WHITELIST) {
            this._loggerService.debug('[ContentToggleListService::isContentValid] MODE_WHITELIST, start validation');
            return true; // Whitelist is always true.
        }
        this._loggerService.debug(
            '[ContentToggleListService::isContentValid] contentToggleList mode not specify -> return true'
        );
        return true;
    }

    private _checkIsMetCriteria(checkValue: string, arrToCheckIn: Array<string>): boolean {
        if (Array.isArray(arrToCheckIn) && arrToCheckIn.length) {
            const value = arrToCheckIn.includes(checkValue);
            if (value) {
                this._loggerService.debug(
                    '[ContentToggleListService::_checkIsMetChannelNameCriteria] found value: ' + value
                );
                return true;
            } else {
                this._loggerService.debug('[ContentToggleListService::_checkIsMetChannelNameCriteria] value not found');
            }
        } else {
            this._loggerService.debug(
                '[ContentToggleListService::_checkIsMetChannelNameCriteria] no criteria found for key CHANNEL_NAME'
            );
        }
        return false;
    }

    private _checkIsMetContentTypeCriteria(contentToggleList: ContentToggleItem[], checkValue: string): boolean {
        if (!contentToggleList[0].contentType) {
            return false;
        }
        return this._checkIsMetCriteria(checkValue, contentToggleList[0].contentType);
    }

    private _checkIsMetChannelNameCriteria(contentToggleList: ContentToggleItem[], checkValue: string): boolean {
        if (!contentToggleList[0].channelName) {
            return false;
        }
        return this._checkIsMetCriteria(checkValue, contentToggleList[0].channelName);
    }

    private _checkIsMetProgramNameCriteria(contentToggleList: ContentToggleItem[], checkValue: string): boolean {
        if (!contentToggleList[0].programName) {
            return false;
        }
        return this._checkIsMetCriteria(checkValue, contentToggleList[0].programName);
    }

    private _checkIsMetProgrammerNameCriteria(contentToggleList: ContentToggleItem[], checkValue: string): boolean {
        if (!contentToggleList[0].programmerName) {
            return false;
        }
        return this._checkIsMetCriteria(checkValue, contentToggleList[0].programmerName);
    }

    private _checkIsMetNetworkNameCriteria(contentToggleList: ContentToggleItem[], checkValue: string): boolean {
        if (!contentToggleList[0].networkName) {
            return false;
        }
        return this._checkIsMetCriteria(checkValue, contentToggleList[0].networkName);
    }

    // white list is disabled for now
    private _isContentValidAgainstWhitelist(
        contentToggleList: ContentToggleItem[],
        initAdInfo: Map<string, string>
    ): boolean {
        this._loggerService.debug('[ContentToggleListService::_isContentValidAgainstWhitelist]');
        const opportunity = initAdInfo?.get('opportunityType');
        const ignoreList = ConfigService.getInstance().ignoreOpportunities;
        if (ignoreList) {
            if (ignoreList.indexOf(`${INCLUDE}${opportunity}`) > -1) {
                return IS_VALID;
            } else if (ignoreList.indexOf(`${EXCLUDE}${opportunity}`) > -1) {
                return !IS_VALID;
            }
        }
        this._loggerService.debug(`[ContentToggleListService::isContentValid] 
                                   testing CHANNEL_NAME: ${initAdInfo.get(contentToggleListKeys.CHANNEL_NAME)}`);

        if (
            this._checkIsMetChannelNameCriteria(contentToggleList, initAdInfo.get(contentToggleListKeys.CHANNEL_NAME))
        ) {
            initAdInfo.set(
                'criteria',
                `${contentToggleListKeys.CHANNEL_NAME}:${initAdInfo.get(contentToggleListKeys.CHANNEL_NAME)}`
            );
            this._loggerService.debug('[ContentToggleListService::isContentValid] the content is valid: CHANNEL_NAME');
            return IS_VALID;
        }

        this._loggerService.debug(`[ContentToggleListService::isContentValid] 
                                   testing PROGRAM_NAME: ${initAdInfo.get(contentToggleListKeys.PROGRAM_NAME)}`);

        if (
            this._checkIsMetProgramNameCriteria(contentToggleList, initAdInfo.get(contentToggleListKeys.PROGRAM_NAME))
        ) {
            initAdInfo.set(
                'criteria',
                `${contentToggleListKeys.PROGRAM_NAME}:${initAdInfo.get(contentToggleListKeys.PROGRAM_NAME)}`
            );
            this._loggerService.debug(`[ContentToggleListService::isContentValid] the content is valid: 
            PROGRAM_NAME:${initAdInfo.get(contentToggleListKeys.PROGRAM_NAME)}`);
            return IS_VALID;
        }

        this._loggerService.debug(
            '[ContentToggleListService::isContentValid] the content is not valid for CHANNEL_NAME'
        );
        return !IS_VALID;
    }

    private _isContentValidAgainstBlacklist(
        contentToggleList: ContentToggleItem[],
        initAdInfo: Map<string, string>
    ): boolean {
        this._loggerService.debug('[ContentToggleListService::_isContentValidAgainstBlacklist]');

        const val = contentToggleList[0].isDuringAd;
        if (val !== undefined && initAdInfo.get(contentToggleListKeys.IS_DURING_AD) !== undefined) {
            if (String(val).toString() === initAdInfo.get(contentToggleListKeys.IS_DURING_AD)) {
                initAdInfo.set(
                    'criteria',
                    `${contentToggleListKeys.IS_DURING_AD}:${initAdInfo.get(contentToggleListKeys.IS_DURING_AD)}`
                );
                this._loggerService.debug(
                    '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is not valid: during another ad'
                );
                return false;
            }
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is valid for IS_DURING_AD'
            );
        }

        if (
            this._checkIsMetChannelNameCriteria(contentToggleList, initAdInfo.get(contentToggleListKeys.CHANNEL_NAME))
        ) {
            initAdInfo.set(
                'criteria',
                `${contentToggleListKeys.CHANNEL_NAME}:${initAdInfo.get(contentToggleListKeys.CHANNEL_NAME)}`
            );
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is not valid: CHANNEL_NAME'
            );
            return false;
        } else {
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is valid for CHANNEL_NAME'
            );
        }

        if (
            this._checkIsMetContentTypeCriteria(contentToggleList, initAdInfo.get(contentToggleListKeys.CONTENT_TYPE))
        ) {
            initAdInfo.set(
                'criteria',
                `${contentToggleListKeys.CONTENT_TYPE}:${initAdInfo.get(contentToggleListKeys.CONTENT_TYPE)}`
            );
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is not valid: CONTENT_TYPE'
            );
            return false;
        } else {
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is valid for CONTENT_TYPE'
            );
        }

        if (
            this._checkIsMetProgramNameCriteria(contentToggleList, initAdInfo.get(contentToggleListKeys.PROGRAM_NAME))
        ) {
            initAdInfo.set(
                'criteria',
                `${contentToggleListKeys.PROGRAM_NAME}:${initAdInfo.get(contentToggleListKeys.PROGRAM_NAME)}`
            );
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is not valid: PROGRAM_NAME'
            );
            return false;
        } else {
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is valid for PROGRAM_NAME'
            );
        }

        if (
            this._checkIsMetProgrammerNameCriteria(
                contentToggleList,
                initAdInfo.get(contentToggleListKeys.PROGRAMMER_NAME)
            )
        ) {
            initAdInfo.set(
                'criteria',
                `${contentToggleListKeys.PROGRAMMER_NAME}:${initAdInfo.get(contentToggleListKeys.PROGRAMMER_NAME)}`
            );
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is not valid: PROGRAMMER_NAME'
            );
            return false;
        } else {
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is valid for PROGRAMMER_NAME'
            );
        }

        if (
            this._checkIsMetNetworkNameCriteria(contentToggleList, initAdInfo.get(contentToggleListKeys.NETWORK_NAME))
        ) {
            initAdInfo.set(
                'criteria',
                `${contentToggleListKeys.NETWORK_NAME}:${initAdInfo.get(contentToggleListKeys.NETWORK_NAME)}`
            );
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is not valid: NETWORK_NAME'
            );
            return false;
        } else {
            this._loggerService.debug(
                '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is valid for NETWORK_NAME'
            );
        }

        this._loggerService.debug(
            '[ContentToggleListService::_isContentValidAgainstBlacklist] the content is valid vs. blacklist, return true'
        );
        return true;
    }
}
