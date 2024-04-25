
/* eslint-disable @typescript-eslint/no-empty-function */
import { XaafAdContainer, UuidGenerator, ErrorCode, ErrorProperties } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse from './apis/opportunity-401-9000-response';
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

describe('Opportunity authentication general errors', () => {
  jest.retryTimes(2);
  jest.setTimeout(JEST_TIMEOUT_MS);
  it('On error opportunity 401-9000', async () => {
    setXaafJsSdkServiceMockDelegates();

    const { opportunityInfo, el, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    const queryFilter: IQueryFilter[] = [
      { Field: 'errorCode', Value: `'${ErrorCode.AuthenticationError}'`, Operator: '=' },
      { Field: 'didTryRecovery', Value: "'CIRCUIT_BREAK'", Operator: '=' },
      {
        Field: 'errorDesc',
        Value: `'${ErrorCode.AuthenticationError}: ${
          ErrorProperties.get(ErrorCode.AuthenticationError).message
        }. Authentication Error'`,
        Operator: '='
      }
    ];
    setMockServerResponse([mockLoginResponse, mockOpportunityResponse], platformAdvIdFilterValue);

    const xaafEvent = await new Promise(resolve => {
      sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
      sdk.xaafInitListener = xaafEvt => resolve(xaafEvt);
    });
    expect(xaafEvent).toEqual({ type: 'SUCCESS' });

    const executableAd = sdk.getExecutableAd(opportunityInfo);
    expect(executableAd.currentState).toEqual('STATE_CREATED');

    executableAd.executableAdEventListener = async () => {};
    executableAd.initAd(el as XaafAdContainer, initAdinfo);
    sleep(NR_TIMEOUT_MS);
    const hasNrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
    expect(hasNrResult).toBe(true);
    expect.assertions(3);
  });
});
