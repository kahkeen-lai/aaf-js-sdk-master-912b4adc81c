import { UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  InitializeSDKParams,
  setMockServerResponse,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';
import login200Response from '../../apis/login-200-response';

describe('login', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  it('On successful initialize SUCCESS callback is called and Login reported to NR', done => {
    const platformAdvIdFilterValue = UuidGenerator.generate();
    const queryFilter: IQueryFilter[] = [];
    setXaafJsSdkServiceMockDelegates();
    const { configMap, sdk } = InitializeSDKParams(platformAdvIdFilterValue);
    setMockServerResponse([login200Response], platformAdvIdFilterValue);
    queryFilter.push({ Field: 'isSilent', Value: false, Operator: 'is' });
    queryFilter.push({ Field: 'isSDKTrace', Value: false, Operator: 'is' });
    queryFilter.push({ Field: 'loginState', Value: true, Operator: 'is' });
    queryFilter.push({ Field: 'success', Value: true, Operator: 'is' });

    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });

      setTimeout(async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const nrREsult = await doesNewRelicReportExist(platformAdvIdFilterValue, queryFilter);
        expect(nrREsult).toBeTruthy();
        done();
      }, NR_TIMEOUT_MS);
    };

    sdk.initialize(IntegrationApiKeyConfig.noVpnApiKey, configMap);
  });
});
