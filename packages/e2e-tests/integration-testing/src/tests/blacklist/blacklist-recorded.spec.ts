/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable unicorn/string-content */
import {
  getNewRelicReportByQueryString,
  initializeSDKParamsForBlacklist,
  JEST_TIMEOUT_MS,
  NR_TIMEOUT_MS,
  setMockServerResponse,
  setXaafJsSdkServiceMockDelegates
} from '../../utils';
import mockLoginRecordedBlacklistResponse from './apis/login-200-recorded-blacklist-response';
import mockOpportunityResponse from '../../apis/opportunity-200-response';
import { AdEvent, AdEventType, UuidGenerator, XaafAdContainer, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IntegrationApiKeyConfig } from '../../environment';
import { IEvent } from '@xaaf/e2e-common/dist';

describe('blacklist - recorded content', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(1);

  async function then_adLifecycle_STOPPING_and_STOPPED_reportedWith_AD_ACTION_BLACKLIST_reason(
    platformAdvIdFilterValue: string
  ): Promise<void> {
    const nrQuerySting = createNRQueryString(platformAdvIdFilterValue);
    const nrQueryResult = await getNewRelicReportByQueryString(platformAdvIdFilterValue, nrQuerySting);

    const nrQueryResultEvents = nrQueryResult.results[0].events;
    expect(nrQueryResultEvents.length).toEqual(2);

    sortNRQueryResultEventsByTimeAndNameIfNeeded(nrQueryResultEvents);
    expect(nrQueryResultEvents[0].name).toEqual('AD_STOPPING');
    expect(nrQueryResultEvents[1].name).toEqual('AD_STOPPED');
  }

  function createNRQueryString(platformAdvIdFilterValue: string): string {
    return `SELECT * from XandrSDK where platformAdvId='${platformAdvIdFilterValue}' and reason='AD_ACTION_BLACKLIST' SINCE 1 minute ago`;
  }

  function sortNRQueryResultEventsByTimeAndNameIfNeeded(nrQueryResultEvents: IEvent[]): void {
    const firstEventData = nrQueryResultEvents[0];
    const secondEventData = nrQueryResultEvents[1];

    // sometimes two events are reported with the same client time due to code executed "too fast"
    if (firstEventData.clientTime === secondEventData.clientTime) {
      nrQueryResultEvents.sort((event1, event2) => event1.name.localeCompare(event2.name) * -1);
      return;
    }

    nrQueryResultEvents.sort((event1, event2) => event1.clientTime.localeCompare(event2.clientTime));
  }

  it('recorded content with recorded content in blacklist - should not move to LOADED and notify NR STOPPING and STOPPED with reason AD_ACTION_BLACKLIST', done => {
    setXaafJsSdkServiceMockDelegates();

    const platformAdvIdFilterValue = UuidGenerator.generate();
    const { opportunityInfo, el, configMap, sdk, initAdinfo } = initializeSDKParamsForBlacklist(
      platformAdvIdFilterValue,
      'recorded',
      'prison_break',
      'netflix',
      'bbc',
      'false',
      'movies'
    );

    setMockServerResponse([mockLoginRecordedBlacklistResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.xaafInitListener = (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      executableAd.executableAdEventListener = (adEvent: AdEvent) => {
        switch (adEvent.type) {
          case AdEventType.Loaded: {
            fail('ExecutableAd moved to state LOADED for a blacklist content');
            done();
            break;
          }
          case AdEventType.Started: {
            fail('ExecutableAd moved to state STARTED for a blacklist content');
            done();
            break;
          }
          case AdEventType.Stopped: {
            setTimeout(async () => {
              await then_adLifecycle_STOPPING_and_STOPPED_reportedWith_AD_ACTION_BLACKLIST_reason(
                platformAdvIdFilterValue
              );
              done();
            }, NR_TIMEOUT_MS);
          }
        }
      };
      executableAd.initAd(el as XaafAdContainer, initAdinfo);
    };
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});
