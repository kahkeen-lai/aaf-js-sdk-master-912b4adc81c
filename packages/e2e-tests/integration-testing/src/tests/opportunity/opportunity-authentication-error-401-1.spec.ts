/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer, XaafEvent, UuidGenerator } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse from './apis/opportunity-401-1-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';

describe('Opportunity authentication 401 errors', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  const platformAdvIdFilterValue = UuidGenerator.generate();
  it('On error opportunity 401-1', done => {
    const { opportunityInfo, el, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();
    const queryFilter: IQueryFilter[] = setQueryFilter();
    setMockServerResponse([mockLoginResponse, mockOpportunityResponse], platformAdvIdFilterValue);

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
    sdk.initialize(IntegrationApiKeyConfig.noVpnApiKey, configMap);
  });
});

function setQueryFilter(): IQueryFilter[] {
  const queryFilter: IQueryFilter[] = [];
  queryFilter.push({ Field: 'errorCode', Value: `'401-1'`, Operator: '=' });
  queryFilter.push({ Field: 'didTryRecovery', Value: `'NONE'`, Operator: '=' });
  queryFilter.push({ Field: 'recoveryActionTaken', Value: `'REFRESH'`, Operator: '=' });
  queryFilter.push({ Field: 'errorDesc', Value: `'401-1: Session expired. Session Expired'`, Operator: '=' });

  return queryFilter;
}
