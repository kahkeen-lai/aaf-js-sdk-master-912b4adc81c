import * as Core from '@xaaf/common';
import { FlagName, XaafFlagContainer, XaafNamespace } from './flag-container';

export class FeatureFlagsService implements Core.FeatureFlagsServiceContract {
    static getInstance(): FeatureFlagsService {
        return Core.InjectionContainer.resolve<FeatureFlagsService>(Core.ContainerDef.featureFlagsService);
    }

    private get _delegate(): Core.FeatureFlagsDelegate {
        return Core.InjectionContainer.resolve<Core.FeatureFlagsDelegate>(Core.ContainerDef.featureFlagsDelegate);
    }

    get usesRelayProxy(): boolean {
        try {
            return !!this._delegate?.usesRelayProxy;
        } catch (error) {
            return false;
        }
    }

    fetch = (): void => this._delegate.fetch();

    register = (targetGroup: Core.TargetGroup, customStringProperties: Map<string, string>): void =>
        this._delegate.register({
            targetGroup,
            customStringProperties,
            namespace: XaafNamespace,
            flags: XaafFlagContainer
        });

    setup = async (setupRequest: Core.FeatureFlagsSetupRequest): Promise<void> => this._delegate.setup(setupRequest);

    isFlagEnabled = (flagName: string): boolean => this._delegate.isFlagEnabled(flagName);

    get enabledFlags(): string {
        const enabledKeys = Object.keys(XaafFlagContainer).filter((name: string) => this.isFlagEnabled(name));
        return enabledKeys.join();
    }

    get featureFlagRequest(): Core.FeatureFlagsRequest {
        return this._delegate.featureFlagRequest || {};
    }

    get xaafEnabled(): boolean {
        return this.isFlagEnabled(FlagName.xaafEnabled);
    }

    get adStartHintEnabled(): boolean {
        return this.isFlagEnabled(FlagName.adStartHintEnabled);
    }

    get retryToBackendEnabled(): boolean {
        return this.isFlagEnabled(FlagName.retryToBackendEnabled);
    }

    get bufferTimeoutEnabled(): boolean {
        return this.isFlagEnabled(FlagName.bufferTimeoutEnabled);
    }

    get playerTimeoutEnabled(): boolean {
        return this.isFlagEnabled(FlagName.playerTimeoutEnabled);
    }

    get reportInBulksEnabled(): boolean {
        return this.isFlagEnabled(FlagName.reportInBulksEnabled);
    }

    get nrDebugLogLevelEnabled(): boolean {
        return this.isFlagEnabled(FlagName.nrDebugLogLevelEnabled);
    }

    get nrInfoLogLevelEnabled(): boolean {
        return this.isFlagEnabled(FlagName.nrInfoLogLevelEnabled);
    }

    get nrErrorLogLevelEnabled(): boolean {
        return this.isFlagEnabled(FlagName.nrErrorLogLevelEnabled);
    }

    get measurementsImpressionsErrorReportEnabled(): boolean {
        return this.isFlagEnabled(FlagName.measurementsImpressionsErrorReportEnabled);
    }

    get httpTimeoutEnabled(): boolean {
        return this.isFlagEnabled(FlagName.httpTimeoutEnabled);
    }
}

Core.InjectionContainer.registerSingleton(Core.ContainerDef.featureFlagsService, FeatureFlagsService);
