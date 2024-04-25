/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer } from '@xaaf/xaaf-js-sdk';
import { UuidGenerator } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunity500Response from '../../apis/opportunity-500-response';
import mockOpportunity500_1_Response from '../../apis/opportunity-500-1-response';
import mockOpportunity503Response from '../../apis/opportunity-503-response';

import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  sleep,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';

const platformAdvIdFilterValue = UuidGenerator.generate();

describe('BackOffMechanism opportunity', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);
  it.each([
    ['500', setQueryFilter500, mockOpportunity500Response],
    ['503', setQueryFilter503, mockOpportunity503Response],
    ['500-1', setQueryFilter500_1, mockOpportunity500_1_Response]
  ])(
    'On error opportunity %s, should report to NR correctly',
    // @ts-ignore
    async (code, filterFunction, mockResponse) => {
      setXaafJsSdkServiceMockDelegates();
      const { opportunityInfo, el, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);

      setMockServerResponse([mockLoginResponse, mockResponse, mockResponse], platformAdvIdFilterValue);

      const xaafEvent = await new Promise(resolve => {
        sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
        sdk.xaafInitListener = xaafEvt => resolve(xaafEvt);
      });
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      const executableAd = sdk.getExecutableAd(opportunityInfo);
      expect(executableAd.currentState).toEqual('STATE_CREATED');

      executableAd.initAd(el as XaafAdContainer, initAdinfo);

      await sleep(NR_TIMEOUT_MS);
      const { queryFilter1, queryFilter2 } = filterFunction.apply(this);
      const isNrFirstResult: boolean = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter1);
      const isNrRetryResult: boolean = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter2);
      expect(isNrFirstResult).toBe(true);
      expect(isNrRetryResult).toBe(true);
    }
  );
});

function setQueryFilterCommon(queryFilter): IQueryFilter[] {
  queryFilter.push({ Field: 'name', Value: `'AD_ERROR'`, Operator: '=' });
  queryFilter.push({ Field: 'errorSubDomain', Value: `'XAABA'`, Operator: '=' });
  queryFilter.push({ Field: 'errorDomain', Value: `'EXAD'`, Operator: '=' });
  return queryFilter;
}

function setQueryFilter500(): Record<string, IQueryFilter[]> {
  const queryFilter1: IQueryFilter[] = [];
  const queryFilter2: IQueryFilter[] = [];
  [queryFilter1, queryFilter2].forEach(queryFilter => {
    setQueryFilterCommon(queryFilter);
    queryFilter.push({ Field: 'errorCode', Value: `'500'`, Operator: '=' });
    queryFilter.push({ Field: 'httpErrorCode', Value: `'500'`, Operator: '=' });
    queryFilter.push({
      Field: 'errorDesc',
      Value: `'500: Internal server error. Internal server error'`,
      Operator: '='
    });
  });

  queryFilter1.push({ Field: 'isRecoverable', Value: `true`, Operator: 'is' });
  queryFilter2.push({ Field: 'isRecoverable', Value: `false`, Operator: 'is' });
  queryFilter2.push({ Field: 'didTryRecovery', Value: `'RETRY'`, Operator: '=' });
  return { queryFilter1, queryFilter2 };
}

function setQueryFilter503(): Record<string, IQueryFilter[]> {
  const queryFilter1: IQueryFilter[] = [];
  const queryFilter2: IQueryFilter[] = [];
  [queryFilter1, queryFilter2].forEach(queryFilter => {
    setQueryFilterCommon(queryFilter);
    queryFilter.push({ Field: 'errorCode', Value: `'503'`, Operator: '=' });
    queryFilter.push({ Field: 'httpErrorCode', Value: `'503'`, Operator: '=' });
    // queryFilter.push({ Field: 'recoveryActionTaken', Value: `'RETRY'`, Operator: '=' });
    queryFilter.push({ Field: 'errorDesc', Value: `'503: Service Unavailable. Service Unavailable'`, Operator: '=' });
  });
  queryFilter1.push({ Field: 'isRecoverable', Value: `true`, Operator: 'is' });
  queryFilter2.push({ Field: 'isRecoverable', Value: `false`, Operator: 'is' });
  queryFilter2.push({ Field: 'didTryRecovery', Value: `'RETRY'`, Operator: '=' });
  return { queryFilter1, queryFilter2 };
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function setQueryFilter500_1(): Record<string, IQueryFilter[]> {
  const queryFilter1: IQueryFilter[] = [];
  const queryFilter2: IQueryFilter[] = [];
  [queryFilter1, queryFilter2].forEach(queryFilter => {
    setQueryFilterCommon(queryFilter);
    queryFilter.push({ Field: 'errorCode', Value: `'500-1'`, Operator: '=' });
    queryFilter.push({ Field: 'httpErrorCode', Value: `'500'`, Operator: '=' });
    // queryFilter.push({ Field: 'recoveryActionTaken', Value: `'RETRY'`, Operator: '=' });
    queryFilter.push({ Field: 'errorSubDomain', Value: `'XAABA'`, Operator: '=' });
    queryFilter.push({ Field: 'errorDomain', Value: `'EXAD'`, Operator: '=' });
    queryFilter.push({
      Field: 'errorDesc',
      Value: `'500-1: Failure engaging ad router. Failure engaging ad router'`,
      Operator: '='
    });
  });

  queryFilter1.push({ Field: 'isRecoverable', Value: `true`, Operator: 'is' });
  queryFilter2.push({ Field: 'isRecoverable', Value: `false`, Operator: 'is' });
  queryFilter2.push({ Field: 'didTryRecovery', Value: `'RETRY'`, Operator: '=' });
  return { queryFilter1, queryFilter2 };
}
