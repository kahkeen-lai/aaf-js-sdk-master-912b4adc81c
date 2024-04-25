import { UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  getNewRelicReport,
  InitializeSDKParams,
  setMockServerResponse,
  JEST_TIMEOUT_MS,
  NR_TIMEOUT_MS
} from '../../utils';
import login200Response from '../../apis/login-200-response';

describe('login ', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);

  // README README README: there's no platform advertising id in the new version of You.i
  it('On successful multiple initialize with different key', done => {
    const platformAdvIdFilterValue = UuidGenerator.generate();
    console.info(`platformAdvId: ${platformAdvIdFilterValue}`);
    const queryFilter: IQueryFilter[] = [];
    setXaafJsSdkServiceMockDelegates();
    const { configMap, sdk } = InitializeSDKParams(platformAdvIdFilterValue);
    setMockServerResponse([login200Response, login200Response], platformAdvIdFilterValue);
    queryFilter.push({ Field: 'isSilent', Value: false, Operator: 'is' });
    queryFilter.push({ Field: 'isSDKTrace', Value: false, Operator: 'is' });
    queryFilter.push({ Field: 'loginState', Value: true, Operator: 'is' });
    queryFilter.push({ Field: 'success', Value: true, Operator: 'is' });

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });
    };
    sdk.initialize(IntegrationApiKeyConfig.noVpnApiKey, configMap);

    setTimeout(async () => {
      sdk.initialize(IntegrationApiKeyConfig.tlvDevFiretvApiKey, configMap);
    }, 1000);

    setTimeout(async () => {
      const nrREsult = await getNewRelicReport(platformAdvIdFilterValue, queryFilter);
      expect(nrREsult).toEqual(2);
      done();
    }, NR_TIMEOUT_MS);
  });
});
