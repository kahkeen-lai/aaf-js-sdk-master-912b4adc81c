/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator, ExecutableAd, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from './apis/login-200-response-with-timeout-xaaba';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  setMockServerResponse,
  doesNewRelicReportExist,
  InitializeSDKParams,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';

const platformAdvIdFilterValue = UuidGenerator.generate();

describe('No ad', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(1);
  it('On error opportunity timeout', done => {
    const { sdk, opportunityInfo, el, initAdinfo, configMap } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();
    const queryFilter: IQueryFilter[] = setQueryFilter();
    setMockServerResponse([mockLoginResponse, mockLoginResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd: ExecutableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');

      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrResult).toEqual(true);
        done();
      }, NR_TIMEOUT_MS);
    };
  });
});

function setQueryFilter(): IQueryFilter[] {
  const queryFilter: IQueryFilter[] = [];
  queryFilter.push({ Field: 'errorCode', Value: `'3000-3'`, Operator: '=' });
  queryFilter.push({ Field: 'errorSubDomain', Value: `'XAABA'`, Operator: '=' });
  return queryFilter;
}
