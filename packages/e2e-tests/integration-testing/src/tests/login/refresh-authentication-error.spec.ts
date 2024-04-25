/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { XaafAdContainer, UuidGenerator } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginTokenExpResponse from '../../apis/login-200-response-exp-token';
import mockErrorResponse from './api/error-401-9000-response';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';
import { ErrorCode, XaafEvent } from '@xaaf/common';

const platformAdvIdFilterValue = UuidGenerator.generate();
describe('login', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  it('On error refresh 401-9000 - should validate error 401-9000 is reported correctly to NewRelic', done => {
    setXaafJsSdkServiceMockDelegates();
    const { opportunityInfo, el, configMap, sdk, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    const queryFilter: IQueryFilter[] = _getQueryFilterFor401_9000Error();

    mockErrorResponse.path = '/auth/v1/token/refresh';
    setMockServerResponse([mockLoginTokenExpResponse, mockErrorResponse], platformAdvIdFilterValue);

    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
    sdk.xaafInitListener = (xaafEvent: XaafEvent) => {
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

function _getQueryFilterFor401_9000Error(): IQueryFilter[] {
  const queryFilter: IQueryFilter[] = [];
  queryFilter.push({ Field: 'errorCode', Value: `'${ErrorCode.AuthenticationError}'`, Operator: '=' });
  // queryFilter.push({ Field: 'didTryRecovery', Value: `'${RecoveryAction.CircuitBreak}'`, Operator: '=' });
  queryFilter.push({
    Field: 'errorDesc',
    Value: `'${ErrorCode.AuthenticationError}: Return upon authentication error. '`,
    Operator: '='
  });

  return queryFilter;
}
