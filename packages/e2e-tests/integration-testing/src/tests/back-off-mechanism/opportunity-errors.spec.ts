/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunity503Response from './apis/opportunity-503-response';
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
// FIXME can't run more than one test for some reason, related to platformAdvId
const testsParams = [
  {
    status: '503',
    httpErrorCode: 503,
    errorDesc: '503: Service Unavailable. Service Unavailable',
    mockResponse: mockOpportunity503Response
  }
  /*{
    status: '500-1',
    httpErrorCode: 500,
    errorDec: '500-1: Failure engaging ad router. Failure engaging ad router',
    mockResponse: mockOpportunity500_1_Response
  },*/
  /*{
    status: '500',
    httpErrorCode: 500,
    errorDec: '500: Internal server error. Internal server error',
    mockResponse: mockOpportunity500Response
  }*/
];

describe('BackOffMechanism opportunity', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  it.each(testsParams)(`On error opportunity %s,`, async testParam => {
    const platformAdvIdFilterValue = UuidGenerator.generate();
    const { configMap, el, initAdinfo, sdk, opportunityInfo } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();
    const queryFilters: IQueryFilter[][] = setQueryFilter(testParam);
    setMockServerResponse(
      [mockLoginResponse, mockLoginResponse, testParam.mockResponse, testParam.mockResponse],
      platformAdvIdFilterValue
    );

    const xaafEvent = await new Promise(resolve => {
      sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
      sdk.xaafInitListener = xaafEvt => resolve(xaafEvt);
    });
    expect(xaafEvent).toEqual({ type: 'SUCCESS' });

    const executableAd = sdk.getExecutableAd(opportunityInfo);
    expect(executableAd.currentState).toEqual('STATE_CREATED');

    executableAd.initAd(el as XaafAdContainer, initAdinfo);
    await sleep(NR_TIMEOUT_MS);
    const nrFirstResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilters[0]);
    const nrRetryResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilters[1]);
    expect(nrFirstResult).toBeTruthy();
    expect(nrRetryResult).toBeTruthy();
  });
});

function setQueryFilter(testObject): IQueryFilter[][] {
  const queryFilter1: IQueryFilter[] = [];
  const queryFilter2: IQueryFilter[] = [];
  [queryFilter1, queryFilter2].forEach(queryFilter => {
    queryFilter.push({ Field: 'name', Value: `'AD_ERROR'`, Operator: '=' });
    queryFilter.push({ Field: 'errorCode', Value: `'${testObject.status}'`, Operator: '=' });
    queryFilter.push({ Field: 'httpErrorCode', Value: `'${testObject.httpErrorCode}'`, Operator: '=' });
    queryFilter.push({ Field: 'errorSubDomain', Value: `'XAABA'`, Operator: '=' });
    queryFilter.push({ Field: 'errorDomain', Value: `'EXAD'`, Operator: '=' });
    queryFilter.push({ Field: 'errorDesc', Value: `'${testObject.errorDesc}'`, Operator: '=' });
  });
  // queryFilter2.push({ Field: 'recoveryActionTaken', Value: `'RETRY'`, Operator: '=' });
  queryFilter1.push({ Field: 'isRecoverable', Value: `true`, Operator: 'is' });
  queryFilter2.push({ Field: 'isRecoverable', Value: `false`, Operator: 'is' });
  return [queryFilter1, queryFilter2];
}
