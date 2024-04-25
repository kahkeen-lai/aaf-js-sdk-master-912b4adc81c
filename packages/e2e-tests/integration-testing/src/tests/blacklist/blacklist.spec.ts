/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginBlacklistResponse from './apis/login-200-blacklist-response';
import mockOpportunityResponse from '../../apis/opportunity-200-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  NR_TIMEOUT_MS,
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  initializeSDKParamsForBlacklist,
  JEST_TIMEOUT_MS
} from '../../utils';

describe('Validate stop event with reason blacklist event', () => {
  const platformAdvIdFilterValue = UuidGenerator.generate();
  jest.setTimeout(JEST_TIMEOUT_MS * 2);
  jest.retryTimes(3);

  it(`does NOT occur since there are no values in blacklist`, done => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'vod',
      'prison_break',
      'netflix',
      'bbc',
      'false',
      'movies2'
    );

    const queryFilter: IQueryFilter[] = _getQueryFilterForBlacklist('channelName', `'movies2'`);

    setMockServerResponse([mockLoginBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toBe(false);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
  it(`occurs due to contentType in blacklist`, done => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'live',
      'prison_break',
      'netflix',
      'bbc',
      'false',
      'movies'
    );

    const queryFilter: IQueryFilter[] = _getQueryFilterForBlacklist('contentType', `'live'`);

    setMockServerResponse([mockLoginBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toBe(true);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
  it(`occurs due to programName in blacklist`, done => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'vod',
      'game_of_throne',
      'netflix',
      'bbc',
      'false',
      'movies'
    );

    const queryFilter: IQueryFilter[] = _getQueryFilterForBlacklist('programName', `'game_of_throne'`);

    setMockServerResponse([mockLoginBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toBe(true);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
  it(`occurs due to programmerName in blacklist`, done => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'vod',
      'prison_break',
      'disney',
      'bbc',
      'false',
      'movies'
    );

    const queryFilter: IQueryFilter[] = _getQueryFilterForBlacklist('programmerName', `'disney'`);

    setMockServerResponse([mockLoginBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toBe(true);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
  it(`occurs due to networkName in blacklist`, done => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'vod',
      'prison_break',
      'netflix',
      'cnn',
      'false',
      'movies'
    );

    const queryFilter: IQueryFilter[] = _getQueryFilterForBlacklist('networkName', `'cnn'`);

    setMockServerResponse([mockLoginBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toBe(true);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
  it(`occurs due to isDuringAd in blacklist`, done => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'vod',
      'prison_break',
      'netflix',
      'bbc',
      'true',
      'movies'
    );

    const queryFilter: IQueryFilter[] = _getQueryFilterForBlacklist('isDuringAd', `'true'`);

    setMockServerResponse([mockLoginBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toBe(true);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
  it(`occurs due to channelName in blacklist`, done => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'vod',
      'prison_break',
      'netflix',
      'bbc',
      'false',
      'Disney Channel HD'
    );

    const queryFilter: IQueryFilter[] = _getQueryFilterForBlacklist('channelName', `'Disney Channel HD'`);

    setMockServerResponse([mockLoginBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toBe(true);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
});

function _getQueryFilterForBlacklist(uniqueFieldName: string, uniqueFieldValue: string): IQueryFilter[] {
  const queryFilter: IQueryFilter[] = [];
  queryFilter.push({ Field: 'name', Value: `'AD_STOPPED'`, Operator: '=' });
  queryFilter.push({ Field: 'reason', Value: `'AD_ACTION_BLACKLIST'`, Operator: '=' });
  queryFilter.push({ Field: uniqueFieldName, Value: uniqueFieldValue, Operator: '=' });

  return queryFilter;
}
