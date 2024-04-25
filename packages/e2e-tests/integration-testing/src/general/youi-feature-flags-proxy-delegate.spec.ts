import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { JEST_TIMEOUT_MS, setXaafJsSdkServiceMockDelegates } from '../utils';
import { IntegrationApiKeyConfig, IntegrationUrlConfig } from '../environment';
describe('youi feature flags proxy delegate tests', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  beforeEach(() => {
    setXaafJsSdkServiceMockDelegates();
  });
  it('given correct setup, when calling request it should show a correct list of flags', () => {
    Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsDelegate, Xaaf.FeatureFlagsProxyDelegate);

    const xaafJsSdk = new Xaaf.XaafJsSdk();
    xaafJsSdk.featureFlagService.register(
      {
        distinctId: 'test-deviceUUID',
        appName: 'test-sdkName',
        version: 'test-sdkVersion',
        platform: 'test-platformName'
      },
      new Map([['foo', 'bar']])
    );

    const { featureFlagRequest } = xaafJsSdk.featureFlagService;
    expect(featureFlagRequest.featureFlags).toBeDefined();
    expect(featureFlagRequest.featureFlags.customStringProperties['foo']).toBe('bar');
    expect(featureFlagRequest.featureFlags.distinctId).toBe('test-deviceUUID');
    expect(featureFlagRequest.featureFlags.flagNames).toBeDefined();
    expect(featureFlagRequest.featureFlags.flagNames.includes('xaafEnabled')).toBe(true);
    expect(featureFlagRequest.featureFlags.flagNames.includes('retryToBackendEnabled')).toBe(true);
    expect(featureFlagRequest.featureFlags.flagNames.includes('nrInfoLogLevelEnabled')).toBe(true);
    expect(featureFlagRequest.featureFlags.namespace).toBe('xaaf');
  });

  it('given correct setup, when calling request it should send a correct request with correct response', async () => {
    Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsDelegate, Xaaf.FeatureFlagsProxyDelegate);

    const xaafJsSdk = new Xaaf.XaafJsSdk();
    xaafJsSdk.featureFlagService.register(
      {
        distinctId: 'test-deviceUUID',
        appName: 'test-sdkName',
        version: 'test-sdkVersion',
        platform: 'test-platformName'
      },
      new Map([['foo', 'bar']])
    );

    Xaaf.ConfigService.getInstance().update({
      apiKey: IntegrationApiKeyConfig.general,
      tokenData: ({ host: IntegrationUrlConfig.general } as unknown) as Xaaf.TokenData
    });

    const restApiService = Xaaf.InjectionContainer.resolve<Xaaf.RestApiService>(Xaaf.ContainerDef.restApiService);
    // INITIALIZE THE SDK TO CONSTRUCT THE HOST URL NEEDED FOR LOGIN FROM THE APIKEY
    await new Promise((resolve, reject) => {
      xaafJsSdk.xaafInitListener = (xaafEvent: Xaaf.XaafEvent) => {
        if (xaafEvent.type === Xaaf.XaafEventType.SUCCESS) {
          resolve({});
        } else {
          reject(xaafEvent);
        }
      };
      xaafJsSdk.initialize(
        IntegrationApiKeyConfig.general,
        new Map<string, string>([['bar', 'baz']])
      );
    });

    const { status, body } = await restApiService.login(
      IntegrationApiKeyConfig.general,
      ({} as unknown) as Xaaf.TokenData,
      new Map([['foo', 'bar']]),
      'test-request-id'
    );

    expect(status).toBe(200);
    expect(body.token).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.configuration).toBeDefined();
    expect(body.configuration.featureFlags).toBeDefined();
    expect(body.configuration.featureFlags.timeToNextFetch).toBeDefined();
    expect(body.configuration.featureFlags.accountingUrl).toBeDefined();
    expect(body.configuration.featureFlags.flags).toBeDefined();
    expect(body.configuration.featureFlags.flags['xaafEnabled']).toBeDefined(); //
    // FIX ME NOT WORKING ON ENV
    // expect(body.configuration.featureFlags.flags['fooBarBaz']).not.toBeDefined();
  });

  it('given correct setup, when initialize should set config service', async () => {
    Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsDelegate, Xaaf.FeatureFlagsProxyDelegate);

    const xaafJsSdk = new Xaaf.XaafJsSdk();
    xaafJsSdk.featureFlagService.register(
      {
        distinctId: 'test-deviceUUID',
        appName: 'test-sdkName',
        version: 'test-sdkVersion',
        platform: 'test-platformName'
      },
      new Map([['foo', 'bar']])
    );

    Xaaf.ConfigService.getInstance().update({
      apiKey: IntegrationApiKeyConfig.general,
      tokenData: ({ host: IntegrationUrlConfig.general } as unknown) as Xaaf.TokenData
    });

    await new Promise((resolve, reject) => {
      xaafJsSdk.xaafInitListener = (xaafEvent: Xaaf.XaafEvent) => {
        if (xaafEvent.type === Xaaf.XaafEventType.SUCCESS) {
          resolve({});
        } else {
          reject(xaafEvent);
        }
      };
      xaafJsSdk.initialize(
        IntegrationApiKeyConfig.general,
        new Map<string, string>([['bar', 'baz']])
      );
    });

    const { apiKey, sdkArguments, tokenData, loginRes } = Xaaf.ConfigService.getInstance()['_config'];
    const { apiVersion } = Xaaf.ConfigService.getInstance();
    expect(apiVersion).toBe('v2');
    expect(apiKey).toBeDefined();
    expect(sdkArguments).toBeDefined();
    expect(tokenData).toBeDefined();
    expect(loginRes).toBeDefined();
    expect(loginRes.configuration).toBeDefined();
    expect(loginRes.configuration.featureFlags).toBeDefined();
    expect(loginRes.configuration.featureFlags.flags).toBeDefined();
    expect(loginRes.configuration.featureFlags.flags['xaafEnabled']).toBeDefined();
    expect(loginRes.configuration.featureFlags.flags['fooBarBaz']).not.toBeDefined();
  });

  it('given only one flag in container, when login called should retrieve only one flag', async () => {
    Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsDelegate, Xaaf.FeatureFlagsProxyDelegate);

    const xaafJsSdk = new Xaaf.XaafJsSdk();
    xaafJsSdk.featureFlagService.register(
      {
        distinctId: 'test-deviceUUID',
        appName: 'test-sdkName',
        version: 'test-sdkVersion',
        platform: 'test-platformName'
      },
      new Map([['foo', 'bar']])
    );

    Xaaf.ConfigService.getInstance().update({
      apiKey: IntegrationApiKeyConfig.general,
      tokenData: ({ host: IntegrationUrlConfig.general } as unknown) as Xaaf.TokenData
    });

    Xaaf.InjectionContainer.resolve(Xaaf.ContainerDef.featureFlagsDelegate)['_flagContainer'] = {
      xaafEnabled: true
    };
    const { featureFlagRequest } = Xaaf.FeatureFlagsService.getInstance();
    expect(featureFlagRequest.featureFlags.flagNames).toStrictEqual(['xaafEnabled']);

    await new Promise((resolve, reject) => {
      xaafJsSdk.xaafInitListener = (xaafEvent: Xaaf.XaafEvent) => {
        if (xaafEvent.type === Xaaf.XaafEventType.SUCCESS) {
          resolve({});
        } else {
          reject(xaafEvent);
        }
      };
      xaafJsSdk.initialize(
        IntegrationApiKeyConfig.general,
        new Map<string, string>([['bar', 'baz']])
      );
    });

    const { loginRes } = Xaaf.ConfigService.getInstance()['_config'];
    expect(Object.keys(loginRes.configuration.featureFlags.flags)).toStrictEqual(['xaafEnabled']);
  });

  it('given correct setup, when calling refresh, it should send a correct request with correct response', async () => {
    Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsDelegate, Xaaf.FeatureFlagsProxyDelegate);

    const xaafJsSdk = new Xaaf.XaafJsSdk();
    xaafJsSdk.featureFlagService.register(
      {
        distinctId: 'test-deviceUUID',
        appName: 'test-sdkName',
        version: 'test-sdkVersion',
        platform: 'test-platformName'
      },
      new Map([['foo', 'bar']])
    );

    Xaaf.ConfigService.getInstance().update({
      apiKey: IntegrationApiKeyConfig.general,
      tokenData: ({ host: IntegrationUrlConfig.general } as unknown) as Xaaf.TokenData
    });

    const restApiService = Xaaf.InjectionContainer.resolve<Xaaf.RestApiService>(Xaaf.ContainerDef.restApiService);

    await new Promise((resolve, reject) => {
      xaafJsSdk.xaafInitListener = (xaafEvent: Xaaf.XaafEvent) => {
        if (xaafEvent.type === Xaaf.XaafEventType.SUCCESS) {
          resolve({});
        } else {
          reject(xaafEvent);
        }
      };
      xaafJsSdk.initialize(
        IntegrationApiKeyConfig.general,
        new Map<string, string>([['bar', 'baz']])
      );
    });

    const { status, body } = await restApiService.refreshToken(
      ({} as unknown) as Xaaf.TokenData,
      new Map([['foo', 'bar']]),
      'test-request-id'
    );

    expect(status).toBe(200);
    expect(body.token).toBeDefined();
    expect(body.configuration).toBeDefined();
    expect(body.configuration.featureFlags).toBeDefined();
    expect(body.configuration.featureFlags.timeToNextFetch).toBeDefined();
    expect(body.configuration.featureFlags.accountingUrl).toBeDefined();
    expect(body.configuration.featureFlags.flags).toBeDefined();
    expect(body.configuration.featureFlags.flags['xaafEnabled']).toBeDefined();
    expect(body.configuration.featureFlags.flags['fooBarBaz']).not.toBeDefined();

    const isXaafEnabled = body.configuration.featureFlags.flags['xaafEnabled'];
    expect(Xaaf.FeatureFlagsService.getInstance().isFlagEnabled('xaafEnabled')).toBe(isXaafEnabled);
    expect(Xaaf.FeatureFlagsService.getInstance().xaafEnabled).toBe(isXaafEnabled);
    expect(Xaaf.FeatureFlagsService.getInstance().isFlagEnabled('fooBarBaz')).not.toBeDefined();
  });
});
