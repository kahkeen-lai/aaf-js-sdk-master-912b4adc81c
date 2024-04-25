/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FeatureFlagsDelegate, FeatureFlagsRegistration, FlagName } from '@xaaf/xaaf-js-sdk';

/**
 * A mocked FeatureFlagsDelegate, to be used as a delegate for a real FeatureFlagsService.
 */
export class MockedFeatureFlagDelegate implements FeatureFlagsDelegate {
  private _enabledFlagNames: Map<string, boolean> = new Map();

  constructor(enabledFlagNames?: string[]) {
    this._enabledFlagNames.set(FlagName.xaafEnabled, true);
    enabledFlagNames?.forEach(enabledFlagName => {
      this._enabledFlagNames.set(enabledFlagName, true);
    });
  }

  isFlagEnabled(flagName: string): boolean {
    return this._enabledFlagNames.get(flagName);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(configuration: { [key: string]: any }): Promise<void> {
    return new Promise(resolve => {
      // simulating platform's execution time
      setTimeout(() => {
        resolve();
      }, 10);
    });
  }

  fetch(): void {}

  register(registration: FeatureFlagsRegistration): void {}
}
