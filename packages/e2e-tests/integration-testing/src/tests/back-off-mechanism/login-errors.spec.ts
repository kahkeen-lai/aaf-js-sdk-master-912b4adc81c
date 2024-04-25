/* eslint-disable quotes */
import { LoginService, UuidGenerator, XaafEvent } from '@xaaf/xaaf-js-sdk';
import mockLogin500Response from './apis/login-500-response';
import { IntegrationApiKeyConfig } from '../../environment';
import { setXaafJsSdkServiceMockDelegates, setMockServerResponse, InitializeSDKParams } from '../../utils';

const platformAdvIdFilterValue = UuidGenerator.generate();

describe('BackOffMechanism login ', () => {
  const loginService: LoginService = LoginService.getInstance();
  it('On error login 500', done => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn<LoginService, any>(loginService, `_retryLoginOnce`);
    setXaafJsSdkServiceMockDelegates();
    const { configMap, sdk } = InitializeSDKParams(platformAdvIdFilterValue);
    setMockServerResponse([mockLogin500Response, mockLogin500Response], platformAdvIdFilterValue);
    sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
      expect(xaafEvent.type).toEqual('SUCCESS');
      expect(loginService['_retryLoginOnce']).toHaveBeenCalledTimes(1);
      done();
    };
    sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  });
});
