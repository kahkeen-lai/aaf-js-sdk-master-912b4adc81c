/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { UuidGenerator, XaafAdContainer, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse from './apis/no-ad-to-serve-204-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';

const platformAdvIdFilterValue = UuidGenerator.generate() + 'platformAdvId:e2eTest-no-ad-to-serve-204';

describe('No ad', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);
  it('On error opportunity 204', done => {
    const { opportunityInfo, el, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();
    const queryFilter: IQueryFilter[] = setQueryFilter();
    setMockServerResponse([mockLoginResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    sdk.xaafInitListener = (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });
      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');
      executableAd.executableAdEventListener = () => {
        setTimeout(async () => {
          const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
          expect(nrResult).toBe(true);
          done();
        }, NR_TIMEOUT_MS);
      };
      executableAd.initAd(el as XaafAdContainer, initAdinfo);
    };
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});

function setQueryFilter(): IQueryFilter[] {
  const queryFilter: IQueryFilter[] = [];
  queryFilter.push({ Field: 'reason', Value: `'NO_AD'`, Operator: '=' });
  return queryFilter;
}
