/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { RolloutServiceE2eHelper } from './rollout/rollout-e2e-helper';

export const FeatureFlagServiceProvider = {
  Rollout: 1
};
Object.freeze(FeatureFlagServiceProvider);

export class FeatureFlagsE2eHelper {
  featureFlagHelper: RolloutServiceE2eHelper;

  constructor(featureFlagServiceProvider, featureFlagServiceProviderOptions) {
    if (featureFlagServiceProvider === FeatureFlagServiceProvider.Rollout) {
      if (!featureFlagServiceProviderOptions.applicationId) {
        console.error('applicationId must be supplied');
        return;
      }
      if (!featureFlagServiceProviderOptions.userToken) {
        console.error('userToken must be supplied');
        return;
      }
      if (!featureFlagServiceProviderOptions.environment) {
        console.error('environment must be supplied');
        return;
      }
      this.featureFlagHelper = new RolloutServiceE2eHelper(
        featureFlagServiceProviderOptions.applicationId,
        featureFlagServiceProviderOptions.userToken,
        featureFlagServiceProviderOptions.environment
      );
    } else {
      console.error(`${featureFlagServiceProvider} is not yet implemented. Only 'Rollout' is supported`);
      this.featureFlagHelper = undefined;
    }
  }

  async setFeatureFlag(key: string, value: boolean): Promise<boolean> {
    return this.featureFlagHelper.setFeatureFlag(key, value);
  }

  async getFeatureFlag(key: string): Promise<unknown> {
    return this.featureFlagHelper.getFeatureFlag(key);
  }
}
