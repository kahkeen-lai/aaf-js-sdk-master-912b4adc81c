/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator, XaafVideoElement } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginTokenExpResponse from '../../apis/login-200-response';
import mockOpportunityResponse200 from '../../apis/opportunity-200-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  sleep,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';
import { AdEventType, AdEvent, XaafEvent } from '@xaaf/common';
import { MockedXaafAdContainer } from '../../mock/mocked-xaaf-ad-container';
import { MockedXaafVideoElement } from '../../mock/mocked-xaaf-video-element';

describe('player timeout', () => {
  jest.setTimeout(JEST_TIMEOUT_MS * 2);

  const platformAdvIdFilterValue = UuidGenerator.generate();

  it('On mid stream - should validate error AD_INFO is reported correctly to NewRelic', done => {
    const { opportunityInfo, configMap, sdk, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();
    const queryFilter: IQueryFilter[] = [
      { Field: 'name', Value: `'AD_INFO'`, Operator: '=' },
      { Field: 'type', Value: `'buffer'`, Operator: '=' },
      { Field: 'reason', Value: `'buffer_end'`, Operator: '=' }
    ];

    const mockedXaafElement: XaafVideoElement = new MockedXaafVideoElement();
    const el: XaafAdContainer = new MockedXaafAdContainer(mockedXaafElement);
    setMockServerResponse([mockLoginTokenExpResponse, mockOpportunityResponse200], platformAdvIdFilterValue);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });
      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');

      executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
        const [showVideoCommand] = executableAd['_commandsArray'];
        switch (adEvent.type) {
          case AdEventType.Loaded: {
            showVideoCommand['_isBufferForPlaybackReached'] = jest.fn(async () => false);
            showVideoCommand['_awaitBufferForPlaybackReached'] = jest.fn(async () => null);
            executableAd.startAd(el);
            break;
          }
          case AdEventType.Started: {
            await sleep(NR_TIMEOUT_MS);

            const hasNrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
            expect(hasNrResult).toBe(true);
            done();

            break;
          }
        }
      };
      executableAd.initAd(el, initAdinfo);
    };
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});
