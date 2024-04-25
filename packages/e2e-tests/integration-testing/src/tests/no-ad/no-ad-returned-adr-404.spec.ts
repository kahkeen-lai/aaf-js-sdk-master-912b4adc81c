/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  ErrorCode,
  ErrorProperties,
  RecoveryAction,
  UuidGenerator,
  XaafAdContainer,
  XaafEvent
} from '@xaaf/xaaf-js-sdk';

import { IQueryFilter } from '@xaaf/e2e-common';
import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponse from './apis/no-ad-returned-adr-404-response';
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

describe('No ad', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);

  it('On error opportunity 404', done => {
    const { opportunityInfo, el, sdk, configMap, initAdinfo } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();
    const queryFilter: IQueryFilter[] = _getQueryFilterFor404_1Error();
    setMockServerResponse([mockLoginResponse, mockOpportunityResponse], platformAdvIdFilterValue);

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

function _getQueryFilterFor404_1Error(): IQueryFilter[] {
  const queryFilter: IQueryFilter[] = [];
  queryFilter.push({ Field: 'errorCode', Value: `'${ErrorCode.ExperienceNotFoundInADR}'`, Operator: '=' });
  queryFilter.push({ Field: 'didTryRecovery', Value: `'${RecoveryAction.None}'`, Operator: '=' });
  queryFilter.push({
    Field: 'errorDesc',
    // eslint-disable-next-line prettier/prettier
    Value: `'${ErrorCode.ExperienceNotFoundInADR}: ${ErrorProperties.get(ErrorCode.ExperienceNotFoundInADR).message}. '`,
    Operator: '='
  });

  return queryFilter;
}
