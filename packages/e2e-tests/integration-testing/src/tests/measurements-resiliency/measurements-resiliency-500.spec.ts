/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable quotes */
import { MockedReportServiceDelegate } from '../../mock';
import {
  AdEvent,
  AdEventType,
  ContainerDef,
  FlagName,
  InjectionContainer,
  UuidGenerator,
  XaafAdContainer,
  XaafEvent
} from '@xaaf/xaaf-js-sdk';

import { IntegrationApiKeyConfig } from '../../environment';
import {
  doesNewRelicReportExist,
  InitializeSDKParams,
  JEST_TIMEOUT_MS,
  setMockServerResponse,
  setXaafJsSdkServiceMockDelegates
} from '../../utils';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse500 from './apis/measurement-500-response';
import { IQueryFilter } from '@xaaf/e2e-common/dist';

let platformAdvIdFilterValueFor500 = UuidGenerator.generate();

describe('measurement resiliency failed test', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);
  const defaultQueryFilers: IQueryFilter[] = [
    { Field: 'name', Value: `'ERROR'`, Operator: '=' },
    { Field: 'errorCode', Value: `'NA'`, Operator: '=' },
    { Field: 'httpErrorCode', Value: `'500'`, Operator: '=' },
    { Field: 'errorSubDomain', Value: `'METRICS'`, Operator: '=' },
    { Field: 'errorDomain', Value: `'HTTP'`, Operator: '=' }
  ];

  const queryFilter: IQueryFilter[] = [
    ...defaultQueryFilers,
    { Field: 'isRecoverable', Value: `true`, Operator: 'is' },
    { Field: 'recoveryActionTaken', Value: `'RETRY'`, Operator: '=' }
  ];
  const retryQueryFilter: IQueryFilter[] = [
    ...defaultQueryFilers,
    { Field: 'isRecoverable', Value: `false`, Operator: 'is' },
    { Field: 'didTryRecovery', Value: `'RETRY'`, Operator: '=' }
  ];

  it('Impression 500 test', done => {
    const { opportunityInfo, el, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValueFor500);
    setXaafJsSdkServiceMockDelegates([FlagName.measurementsImpressionsErrorReportEnabled]);
    InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new MockedReportServiceDelegate());
    platformAdvIdFilterValueFor500 = UuidGenerator.generate();
    setMockServerResponse(
      [mockLoginResponse, mockLoginResponse, mockOpportunityResponse500],
      platformAdvIdFilterValueFor500
    );

    configMap.set('platformAdvId', platformAdvIdFilterValueFor500);

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');

      executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
        switch (adEvent.type) {
          case AdEventType.Loaded: {
            executableAd['_commandsArray'][0]['_isBufferForPlaybackReached'] = jest.fn(async () => true);
            executableAd.startAd(el);
            break;
          }
          case AdEventType.Started: {
            setTimeout(async () => {
              // validate nr report was correct
              const isNewRelicReportExist: boolean = await doesNewRelicReportExist(
                platformAdvIdFilterValueFor500,
                queryFilter
              );
              const isNewRelicReportExistRetry: boolean = await doesNewRelicReportExist(
                platformAdvIdFilterValueFor500,
                retryQueryFilter
              );
              expect(isNewRelicReportExist).toBeTruthy();
              expect(isNewRelicReportExistRetry).toBeTruthy();
              executableAd.stopAd();
              done();
            }, 10_000);
            break;
          }
        }
      };
      executableAd.initAd(el as XaafAdContainer, initAdinfo);
    };
    expect.assertions(4);
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});
