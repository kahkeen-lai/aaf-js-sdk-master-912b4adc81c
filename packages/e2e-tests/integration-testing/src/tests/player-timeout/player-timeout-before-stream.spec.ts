/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  XaafAdContainer,
  UuidGenerator,
  ErrorSubDomain,
  ReportType,
  ErrorCode,
  ExecutableAd,
  XaafElement,
  XaafVideoElement
} from '@xaaf/xaaf-js-sdk';
import { AdEventType, AdEvent } from '@xaaf/common';
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
  sleep,
  JEST_TIMEOUT_MS
} from '../../utils';
import { MockedXaafAdContainer } from '../../mock/mocked-xaaf-ad-container';
import { MockedXaafVideoElement } from '../../mock/mocked-xaaf-video-element';

type AdEventListener = (adEvent: AdEvent) => Promise<void>;

const initAdRunner = async (
  platformAdvIdFilterValue: string,
  el: XaafElement,
  executableAdEventListenerCreator: (exAd: ExecutableAd) => AdEventListener
): Promise<void> => {
  const { opportunityInfo, configMap, sdk, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
  sdk.xaafInitListener = async () => {
    const executableAd = sdk.getExecutableAd(opportunityInfo);
    executableAd.executableAdEventListener = executableAdEventListenerCreator(executableAd);
    executableAd.initAd(el as XaafAdContainer, initAdinfo);
  };
  sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
};

describe('player timeout', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  const platformAdvIdFilterValue = UuidGenerator.generate();
  const queryFilterFor30003: IQueryFilter[] = [
    { Field: 'errorCode', Value: `'${ErrorCode.ResourceTimeout}'`, Operator: '=' },
    { Field: 'errorSubDomain', Value: `'${ErrorSubDomain.Player}'`, Operator: '=' },
    { Field: 'lastAdLifeCycleEventName', Value: `'${ReportType.AdStarting}'`, Operator: '=' }
  ];

  it('Given Video Timeout config, When Video times out, should report error 3000-3 correctly to NewRelic', done => {
    setXaafJsSdkServiceMockDelegates();
    const mockedXaafElement: XaafVideoElement = new MockedXaafVideoElement();
    const el: XaafElement = new MockedXaafAdContainer(mockedXaafElement);
    setMockServerResponse([mockLoginTokenExpResponse, mockOpportunityResponse200], platformAdvIdFilterValue);

    expect.assertions(1);
    initAdRunner(platformAdvIdFilterValue, el, (exAd: ExecutableAd) => async (adEvent: AdEvent): Promise<void> => {
      switch (adEvent.type) {
        case AdEventType.Loaded: {
          mockedXaafElement.xaafElementListener['_isBufferForPlaybackReached'] = jest.fn(async () => false);
          mockedXaafElement.xaafElementListener['_awaitBufferForPlaybackReached'] = jest.fn(
            async (timeout: number, timeoutEnabled: boolean) => new Promise((resolve, reject) => reject('timeout'))
          );
          exAd.startAd(el);
          break;
        }
        case AdEventType.Error: {
          await sleep(NR_TIMEOUT_MS);
          const hasNrResult: boolean = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilterFor30003);
          expect(hasNrResult).toBe(true);
          done();
          break;
        }
      }
    });
  });
});
