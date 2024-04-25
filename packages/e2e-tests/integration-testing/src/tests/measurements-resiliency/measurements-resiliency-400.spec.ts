/* eslint-disable quotes */
import { IQueryFilter } from '@xaaf/e2e-common';
import {
  AdEvent,
  AdEventType,
  ContainerDef,
  FlagName,
  InjectionContainer,
  UuidGenerator,
  XaafEvent
} from '@xaaf/xaaf-js-sdk';
import { MockedReportServiceDelegate } from '../../mock';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  setXaafJsSdkServiceMockDelegates,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse400 from './apis/measurement-400-response';

describe('measurement resiliency failed test', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  it('Impression 404 test', done => {
    const platformAdvIdFilterValueFor400 = UuidGenerator.generate();
    const { opportunityInfo, el: mockedXaafElement, sdk, initAdinfo, configMap } = InitializeSDKParams(
      platformAdvIdFilterValueFor400
    );

    setXaafJsSdkServiceMockDelegates([FlagName.measurementsImpressionsErrorReportEnabled]);
    InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new MockedReportServiceDelegate());

    const queryFilter: IQueryFilter[] = [{ Field: 'errorSubDomain', Value: `'METRICS'`, Operator: '=' }];
    setMockServerResponse(
      [mockLoginResponse, mockLoginResponse, mockOpportunityResponse400, mockOpportunityResponse400],
      platformAdvIdFilterValueFor400
    );

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });
      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
        switch (adEvent.type) {
          case AdEventType.Loaded: {
            executableAd['_commandsArray'][0]['_isBufferForPlaybackReached'] = jest.fn(async () => true);
            executableAd.startAd(mockedXaafElement);
            break;
          }
          case AdEventType.Started: {
            expect(executableAd.currentState).toEqual('STATE_STARTED');

            setTimeout(async () => {
              executableAd.stopAd();
              const hasNrResult = await doesNewRelicReportExist(platformAdvIdFilterValueFor400, queryFilter);
              expect(hasNrResult).toBeTruthy();
              done();
            }, NR_TIMEOUT_MS);
            break;
          }
        }
      };
      expect.assertions(4);
      executableAd.initAd(mockedXaafElement, initAdinfo);
    };

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});
