/* eslint-disable @typescript-eslint/naming-convention */
import { UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import mockLoginResponse from './api/login-no-rollout-key';
import { IntegrationApiKeyConfig } from '../../environment';
import {
  setXaafJsSdkServiceMockDelegates,
  doesNewRelicReportExist,
  setMockServerResponse,
  InitializeSDKParams,
  NR_TIMEOUT_MS,
  JEST_TIMEOUT_MS
} from '../../utils';

describe('Login is OK but', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);
  it('missing a rollout key, report SUCCESS', done => {
    const platformAdvIdFilterValue = UuidGenerator.generate();
    const { sdk, configMap } = InitializeSDKParams(platformAdvIdFilterValue);
    setXaafJsSdkServiceMockDelegates();

    setMockServerResponse([mockLoginResponse], platformAdvIdFilterValue);

    sdk.xaafInitListener = (xaafEvent: XaafEvent) => {
      expect(xaafEvent).toEqual({ type: 'SUCCESS' });
      expect(mockLoginResponse.data.configuration.rollout_api_key).toEqual('');

      setTimeout(async () => {
        const nrResult = await doesNewRelicReportExist(platformAdvIdFilterValue, []);
        expect(nrResult).toBe(true);
        done();
      }, NR_TIMEOUT_MS);
    };
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});
