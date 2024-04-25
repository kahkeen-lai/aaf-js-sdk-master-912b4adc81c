/* eslint-disable @typescript-eslint/naming-convention */
import { UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import mockLoginResponse from './api/login-no-nr-key';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  JEST_TIMEOUT_MS
} from '../../utils';

const platformAdvIdFilterValue = UuidGenerator.generate();

describe('login', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  it('On login no nr key', done => {
    const { sdk, configMap } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();

    setMockServerResponse([mockLoginResponse], platformAdvIdFilterValue);
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });
      expect(mockLoginResponse.data.configuration.nr_rest_api_key).toEqual('');

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, []);
        expect(nrResult).toBe(false);
        done();
      }, 5000);
    };
  });
});
