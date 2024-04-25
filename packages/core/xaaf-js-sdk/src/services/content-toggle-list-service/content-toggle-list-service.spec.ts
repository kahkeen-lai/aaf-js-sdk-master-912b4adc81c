import { ContentToggleItem, default as Core, TokenData } from '@xaaf/common';
import { ContentToggleListService } from './content-toggle-list-service';
import { ConfigService } from '../config-service/config-service';

let initAdInfo: Map<string, string>;

describe('ContentToggleListService functions', () => {
    const contentToggleListService = ContentToggleListService.getInstance();
    let emptyContentToggleListLoginResponse;

    function createContentToggleListLoginResponse(contentToggleListItems: ContentToggleItem[]): Core.LoginResponse {
        const contentToggleListLoginResponse = emptyContentToggleListLoginResponse;
        contentToggleListLoginResponse.configuration.content_toggle_list = contentToggleListItems;
        return contentToggleListLoginResponse;
    }

    function updateConfigServiceWithContentToggleList(contentToggleListItems: ContentToggleItem[]): void {
        const contentToggleListLoginResponse = createContentToggleListLoginResponse(contentToggleListItems);
        ConfigService.getInstance().update({ loginRes: contentToggleListLoginResponse });
    }

    beforeEach(() => {
        emptyContentToggleListLoginResponse = require('../../mock/expectations/content-toggle-list/empty-content-toggle-list-login-response.json');

        initAdInfo = new Map<string, string>([
            ['contentType', 'vod'],
            ['channelId', '12345'],
            ['programName', 'game_of_throne'],
            ['programmerName', 'disney'],
            ['networkName', 'abc'],
            ['isDuringAd', 'false'],
            ['channelName', 'espn'],
            ['expType', 'out_of_stream'],
            ['adStartDelayHint', '15000']
        ]);

        ConfigService.getInstance().update({
            apiKey: '',
            sdkArguments: new Map<string, string>().set('ignoreOpportunities', '+ipga,-screensaver,advertorial'),
            loginRes: emptyContentToggleListLoginResponse,
            tokenData: {
                tenantId: '5e6f42fefc8159001bb219f0',
                appId: '5e6f42fffc8159001bb219f2',
                platformName: 'firetv-youi',
                sdkVersion: 'v1',
                sdkName: 'js-sdk-youi',
                enabled: true,
                host: 'https://xaaf-aio.tlv-devops.com/advertise-5988',
                privilegeType: 'tester',
                environment: 'tlv-advertise-5988',
                iat: 1584967962,
                iss: 'AT&T',
                sub: 'ApiKey'
            } as TokenData
        });
    });

    it('validate content toggle list exists. Expected value = true', () => {
        const isValid = ContentToggleListService.getInstance().isContentValid(new Map<string, string>());
        expect(isValid).toBe(true);
    });

    it('validate content toggle list is empty. Expected value = true', () => {
        const contentToggleListItems: ContentToggleItem[] = [];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('validate blacklist mode exist is content toggle list, while nothing else exist. Expected value = true', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist' }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('validate contentType value: contentToggleList = initAdInfo. Expected value = false', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', contentType: ['vod'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(false);
    });

    it('validate contentType value: contentToggleList <> initAdInfo. Expected value = false', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', contentType: ['live'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('validate channelName value: contentToggleList = initAdInfo. Expected value = false', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', channelName: ['espn'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(false);
    });

    it('validate channelName value: contentToggleList <> initAdInfo. Expected value = true', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', channelName: ['any', 'other'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('validate isDuringAd value: contentToggleList = initAdInfo. Expected value = false', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', isDuringAd: false }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(false);
    });

    it('validate isDuringAd value: contentToggleList <> initAdInfo. Expected value = true', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', isDuringAd: true }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('validate contentToggleList include 1 item with blacklist mode. By programName -  Expected value = false', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', programName: ['game_of_throne'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(false);
    });

    it('blacklist , validate by programmerName. Expected value = false', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', programmerName: ['disney'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(false);
    });

    it('blacklist , validate by networkName. Expected value = false', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', networkName: ['abc'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(false);
    });

    it('validate contentToggleList include 1 item with whitelist mode. By channelName -  Expected value = true', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'whitelist', channelName: ['espn'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('validate by programName. Expected value = true', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ mode: 'whitelist', programName: ['game_of_throne'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('neutral mode. Expected value = true', () => {
        const contentToggleListItems: ContentToggleItem[] = [{ networkName: ['abc'] }];
        updateConfigServiceWithContentToggleList(contentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);
    });

    it('ConfigService content toggle list update - should return valid content pre-update and invalid post-update', () => {
        const liveBlacklistContentToggleListItems: ContentToggleItem[] = [{ mode: 'blacklist', contentType: ['live'] }];
        updateConfigServiceWithContentToggleList(liveBlacklistContentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(true);

        const vodBlacklistContentToggleListItems = [{ mode: 'blacklist', contentType: ['vod'] }];
        updateConfigServiceWithContentToggleList(vodBlacklistContentToggleListItems);
        expect(contentToggleListService.isContentValid(initAdInfo)).toBe(false);
    });
});
