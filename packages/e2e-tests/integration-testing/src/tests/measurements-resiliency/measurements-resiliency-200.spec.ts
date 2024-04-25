/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable quotes */
import { IQueryFilter } from '@xaaf/e2e-common';
import { MockedReportServiceDelegate } from '../../mock';
import {
  AdEvent,
  AdEventType,
  ContainerDef,
  InjectionContainer,
  UuidGenerator,
  XaafAdContainer,
  XaafEvent
} from '@xaaf/xaaf-js-sdk';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  getNewRelicReport,
  setMockServerResponse,
  InitializeSDKParams,
  setXaafJsSdkServiceMockDelegates,
  JEST_TIMEOUT_MS
} from '../../utils';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse200 from './apis/measurement-200-response';

let platformAdvIdFilterValueFor200 = 'platformAdvId:e2eTest-measurement-200-response';

describe('measurement resiliency success test', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  it('Impression 200 test', done => {
    const { opportunityInfo, el, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValueFor200);
    InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new MockedReportServiceDelegate());

    setXaafJsSdkServiceMockDelegates(['measurementsImpressionsErrorReportEnabled']);
    platformAdvIdFilterValueFor200 = UuidGenerator.generate();
    setMockServerResponse(
      [mockLoginResponse, mockLoginResponse, mockOpportunityResponse200],
      platformAdvIdFilterValueFor200
    );

    configMap.set('platformAdvId', platformAdvIdFilterValueFor200);
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      // @ts-ignore
      executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
        switch (adEvent.type) {
          case AdEventType.Loaded: {
            executableAd['_commandsArray'][0]['_isBufferForPlaybackReached'] = jest.fn(async () => true);
            executableAd.startAd(el);
            break;
          }
          case AdEventType.Started: {
            // executableAd.stopAd execution must be delayed to allow executable ad to reach PLAYING state
            setTimeout(async () => {
              executableAd.stopAd();
              const queryFilter: IQueryFilter[] = [{ Field: 'errorSubDomain', Value: `'METRICS'`, Operator: '=' }];
              const hasNrResult = await getNewRelicReport(platformAdvIdFilterValueFor200, queryFilter);
              expect(hasNrResult).toEqual(0);
            }, 3000);
            break;
          }
        }
      };

      executableAd.initAd(el as XaafAdContainer, initAdinfo);
      done();
      expect.assertions(2);
    };
  });
});
