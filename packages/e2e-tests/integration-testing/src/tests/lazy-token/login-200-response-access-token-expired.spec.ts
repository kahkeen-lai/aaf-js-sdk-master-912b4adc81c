/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponseAccessTokenExpired from './apis/login-200-response-access-token-expired';
import mockRefreshResponseAccessTokenExpired from './apis/refresh-200-response-access-token-expired';
import mockOpportunity from '../../apis/opportunity-200-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';

const platformAdvIdFilterValue = UuidGenerator.generate();
describe('Refresh action when Access token is expired', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);

  it(`Should validate Refresh action occurs and reported correctly to NewRelic when access token is expired and refresh token is valid`, done => {
    setXaafJsSdkServiceMockDelegates();
    const { opportunityInfo, el, configMap, sdk, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    const queryFilter: IQueryFilter[] = _getQueryFilterForLazyRefreshAccessToken();

    setMockServerResponse(
      [mockLoginResponseAccessTokenExpired, mockRefreshResponseAccessTokenExpired, mockOpportunity],
      platformAdvIdFilterValue
    );

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

function _getQueryFilterForLazyRefreshAccessToken(): IQueryFilter[] {
  const queryFilter: IQueryFilter[] = [];
  queryFilter.push({ Field: 'name', Value: `'REFRESH'`, Operator: '=' });
  queryFilter.push({ Field: 'mode', Value: `'PRE_AUTH'`, Operator: '=' });
  queryFilter.push({ Field: 'isSilent', Value: `true`, Operator: 'is' });
  queryFilter.push({ Field: 'success', Value: `true`, Operator: 'is' });

  return queryFilter;
}
