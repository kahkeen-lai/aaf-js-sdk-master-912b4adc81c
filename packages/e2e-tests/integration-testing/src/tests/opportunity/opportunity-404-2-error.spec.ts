/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable quotes */
import { XaafAdContainer, UuidGenerator } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse from './apis/opportunity-404-2-response';
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

let platformAdvIdFilterValue;

describe('Opportunity authentication 404 errors', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);
  platformAdvIdFilterValue = UuidGenerator.generate();
  it('On error opportunity 404-2', async () => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, sdk, initAdinfo, configMap } = InitializeSDKParams(platformAdvIdFilterValue);
    const queryFilter: IQueryFilter[] = setQueryFilter();
    setMockServerResponse([mockLoginResponse, mockOpportunityResponse], platformAdvIdFilterValue);
    expect.assertions(3);
    const xaafEvent = await new Promise(resolve => {
      sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
      sdk.xaafInitListener = xaafEvt => resolve(xaafEvt);
    });
    expect(xaafEvent).toEqual({ type: 'SUCCESS' });

    const executableAd = sdk.getExecutableAd(opportunityInfo);
    expect(executableAd.currentState).toEqual('STATE_CREATED');

    executableAd.initAd(el as XaafAdContainer, initAdinfo);
    sleep(NR_TIMEOUT_MS);
    return doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter).then(nrResult => {
      expect(nrResult).toBe(true);
    });
  });

  function setQueryFilter(): IQueryFilter[] {
    const queryFilter: IQueryFilter[] = [];
    queryFilter.push({ Field: 'errorCode', Value: `'404-2'`, Operator: '=' });
    queryFilter.push({ Field: 'httpErrorCode', Value: `'404'`, Operator: '=' });
    queryFilter.push({ Field: 'didTryRecovery', Value: `'NONE'`, Operator: '=' });
    queryFilter.push({ Field: 'isRecoverable', Value: `false`, Operator: 'is' });
    queryFilter.push({ Field: 'errorSubDomain', Value: `'XAABA'`, Operator: '=' });
    queryFilter.push({ Field: 'errorDomain', Value: `'HTTP'`, Operator: '=' });
    queryFilter.push({ Field: 'errorDesc', Value: `'404-2: Experience is missing impressions. '`, Operator: '=' });

    return queryFilter;
  }
});
