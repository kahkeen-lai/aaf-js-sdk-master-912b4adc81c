/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponseRefreshTokenExpired from './apis/login-200-response-refresh-token-expired';
import mockOpportunity from '../../apis/opportunity-200-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  NR_TIMEOUT_MS
} from '../../utils';

const platformAdvIdFilterValue = UuidGenerator.generate();
describe('Silent Login action when Refresh token is expired', () => {
  jest.setTimeout(120000);
  jest.retryTimes(2);

  it(`Should validate Silent Login action occurs and reported correctly to NewRelic when both access token and refresh token are expired`, done => {
    setXaafJsSdkServiceMockDelegates();
    const { opportunityInfo, el, configMap, sdk, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    const queryFilter: IQueryFilter[] = _getQueryFilterForLazyRefreshAccessToken();

    setMockServerResponse(
      [mockLoginResponseRefreshTokenExpired, mockLoginResponseRefreshTokenExpired, mockOpportunity],
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
  queryFilter.push({ Field: 'name', Value: `'LOGIN'`, Operator: '=' });
  queryFilter.push({ Field: 'mode', Value: `'PRE_AUTH'`, Operator: '=' });
  queryFilter.push({ Field: 'isSilent', Value: `true`, Operator: 'is' });
  queryFilter.push({ Field: 'success', Value: `true`, Operator: 'is' });

  return queryFilter;
}
