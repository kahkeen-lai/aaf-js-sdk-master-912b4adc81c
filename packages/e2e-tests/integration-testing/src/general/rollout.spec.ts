import * as Xaaf from '@xaaf/xaaf-js-sdk';
import {
  JEST_TIMEOUT_MS,
  NR_TIMEOUT_MS,
  rolloutOptionsTlvDev,
  setXaafJsSdkServiceMockDelegates,
  sleep
} from '../utils';
import { IntegrationApiKeyConfig, IntegrationNRConfig } from '../environment';
import {
  FeatureFlagsE2eHelper,
  FeatureFlagServiceProvider
} from '@xaaf/e2e-common/src/feature-flags/feature-flags-e2e-helper';
import { ReportingE2eHelper, ReportingServiceProvider, IQueryFilter, IReport } from '@xaaf/e2e-common';
import { MockedReportServiceDelegate, createMockedSDKArguments } from '../mock';
import { UuidGenerator, ContainerDef, InjectionContainer } from '@xaaf/xaaf-js-sdk';

describe.skip('E2E rollout test - rollout dashboard -> BE rollout proxy -> client', () => {
  jest.setTimeout(JEST_TIMEOUT_MS * 6);
  jest.retryTimes(3);

  let enabledFlag: string;
  const featureFlagsE2eHelper: FeatureFlagsE2eHelper = new FeatureFlagsE2eHelper(
    FeatureFlagServiceProvider.Rollout,
    rolloutOptionsTlvDev
  );

  const _mockedSDKArguments = createMockedSDKArguments();
  const platformAdvId = UuidGenerator.generate();
  _mockedSDKArguments.set('platformAdvId', platformAdvId);

  const reportHelper: ReportingE2eHelper = new ReportingE2eHelper(
    ReportingServiceProvider.NewRelic,
    {
      accountId: IntegrationNRConfig.generalAccountId,
      queryKey: IntegrationNRConfig.generalQueryKey
    },
    platformAdvId
  );

  const flagToUpdate: string = 'xaaf.httpTimeoutEnabled';

  const targetGroup = {
    distinctId: 'test-distinctId',
    appName: 'test-sdkName',
    version: 'test-sdkVersion',
    platform: 'test-platformName'
  };

  beforeAll(async () => {
    setXaafJsSdkServiceMockDelegates();
    await featureFlagsE2eHelper.setFeatureFlag(flagToUpdate, true);
    const flagValue = await featureFlagsE2eHelper.getFeatureFlag(flagToUpdate);
    expect(flagValue).toEqual(true);
  });

  afterAll(async () => {
    await featureFlagsE2eHelper.setFeatureFlag(flagToUpdate, false);
    const flagValue = await featureFlagsE2eHelper.getFeatureFlag(flagToUpdate);
    expect(flagValue).toEqual(false);
  });

  it('Rollout - update feature flag - set it enabled', async () => {
    Xaaf.InjectionContainer.registerSingleton(Xaaf.ContainerDef.featureFlagsDelegate, Xaaf.FeatureFlagsProxyDelegate);
    InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new MockedReportServiceDelegate());

    const xaafJsSdk = new Xaaf.XaafJsSdk();
    xaafJsSdk.featureFlagService.register(targetGroup, _mockedSDKArguments);

    const { featureFlagRequest } = xaafJsSdk.featureFlagService;
    expect(featureFlagRequest.featureFlags).toBeDefined();
    enabledFlag = xaafJsSdk.featureFlagService.enabledFlags;
    expect(enabledFlag).not.toContain(flagToUpdate.replace('xaaf.', ''));
    await sleep(NR_TIMEOUT_MS);
    const flagValue = await featureFlagsE2eHelper.getFeatureFlag(flagToUpdate);
    expect(flagValue).toEqual(true);
    const xaafEvent = await new Promise(resolve => {
      xaafJsSdk.initialize(IntegrationApiKeyConfig.general, _mockedSDKArguments);
      xaafJsSdk.xaafInitListener = xaafEvt => resolve(xaafEvt);
    });
    expect(xaafEvent).toEqual({ type: 'SUCCESS' });

    enabledFlag = xaafJsSdk.featureFlagService.enabledFlags;
    expect(enabledFlag).toContain(flagToUpdate.replace('xaaf.', ''));

    await sleep(NR_TIMEOUT_MS);
    const queryFilter: IQueryFilter[] = [];
    const newRelicResults: IReport = await reportHelper.getReportsByMultipleFilter(queryFilter);
    if (newRelicResults) {
      const result = newRelicResults.results;
      expect(result[0].events[0].featureFlags).toContain(flagToUpdate.replace('xaaf.', ''));
    }
  });
});
