/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginTokenExpResponse from '../../apis/login-200-response';
import mockOpportunityResponse200 from '../../apis/opportunity-200-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';
import { AdEventType, AdEvent, XaafEvent } from '@xaaf/common';
import { MockedXaafVideoElementBufferTimeout } from './apis/mocked-xaaf-video-element-buffer-timeout';
import { MockedXaafAdContainer } from '../../mock/mocked-xaaf-ad-container';

const platformAdvIdFilterValue = UuidGenerator.generate();
describe('player-timeout', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);
  it('On buffer timeout in mid stream error 3000-3 - should validate error 3000-3 is reported correctly to NewRelic', done => {
    setXaafJsSdkServiceMockDelegates(['bufferTimeoutEnabled']);
    const { opportunityInfo, configMap, sdk, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    const mockedXaafElement = new MockedXaafVideoElementBufferTimeout();
    const el = new MockedXaafAdContainer(mockedXaafElement);
    const queryFilter: IQueryFilter[] = [
      { Field: 'name', Value: `'AD_ERROR'`, Operator: '=' },
      { Field: 'errorCode', Value: `'3000-3'`, Operator: '=' },
      { Field: 'errorDomain', Value: `'EXAD'`, Operator: '=' },
      { Field: 'errorSubDomain', Value: `'BUFFER'`, Operator: '=' }
    ];
    setMockServerResponse([mockLoginTokenExpResponse, mockOpportunityResponse200], platformAdvIdFilterValue);

    sdk.xaafInitListener = (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');

      executableAd.executableAdEventListener = (adEvent: AdEvent) => {
        switch (adEvent.type) {
          case AdEventType.Loaded: {
            executableAd['_commandsArray'][0]['_isBufferForPlaybackReached'] = jest.fn(async () => true);
            executableAd.startAd(el);
            break;
          }
          case AdEventType.Error: {
            setTimeout(async () => {
              const hasNrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
              expect(hasNrResult).toBe(true);
              done();
            }, NR_TIMEOUT_MS);
            break;
          }
        }
      };
      executableAd.initAd(el as XaafAdContainer, initAdinfo);
    };
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});
