/* eslint-disable @typescript-eslint/no-empty-function */
import { LoggerService } from '../logger-service';
import {
    FeatureFlagsDelegate,
    FeatureFlagsRegistration,
    FeatureFlagsRequest,
    FeatureFlagsSetupRequest,
    FlagsContainer,
    InjectionContainer,
    ContainerDef,
    StorageService
} from '@xaaf/common';
import { ArrayHelper } from '../../utils/array-helper';

export class FeatureFlagsProxyDelegate implements FeatureFlagsDelegate {
    private _lastFetchedDate = 0;
    private _minFetchInterval = 60 * 60 * 1000;
    private _isFreeze = false;
    private _rolloutProxyUrl: string;
    private _rolloutProxyAccessToken: string;
    private _flagContainer: FlagsContainer = {};
    private _distinctId: string;
    private _namespace: string;
    private _customStringProperties: Record<string, string>;
    private _logger: LoggerService = LoggerService.getInstance();
    private _storageKey = 'xaaf.xaaf-js-sdk.featureFlags';

    usesRelayProxy = true;

    isFlagEnabled = (flagName: string): boolean => this._flagContainer[flagName];

    setup(configuration: FeatureFlagsSetupRequest): Promise<void> {
        if (configuration.featureFlags?.flags) {
            this._logger.debug('[FeatureFlagsDelegate::setup] new flags received');
            this._updateAndStore(configuration.featureFlags?.flags);
        }

        this._rolloutProxyUrl = configuration.rolloutProxyUrl;
        this._minFetchInterval = configuration.minFetchInterval;
        this._rolloutProxyAccessToken = configuration.rolloutProxyAccessToken;

        // empty promise to comply with interface
        return new Promise((resolve) => resolve());
    }

    register({ targetGroup, flags: defaults, namespace, customStringProperties }: FeatureFlagsRegistration): void {
        this._namespace = namespace;
        this._customStringProperties = ArrayHelper.mapToRecord(customStringProperties);
        this._distinctId = targetGroup.distinctId;
        this._flagContainer = defaults;

        this._getPersistentFlags().then((persistent: FlagsContainer) => {
            this._updateFlagContainer(persistent);
        });
    }

    fetch(): void {
        // This is intentional
    }

    get featureFlagRequest(): FeatureFlagsRequest {
        const flagNames: string[] = Object.keys(this._flagContainer);
        this._logger.debug(`[FeatureFlagsProxyDelegate::featureFlagRequest] will request flags: ${flagNames.join()}`);
        return {
            featureFlags: {
                flagNames,
                namespace: this._namespace,
                distinctId: this._distinctId,
                customStringProperties: this._customStringProperties
            }
        };
    }

    private _updateAndStore(newFlags: FlagsContainer): void {
        if (!this._isFreeze) {
            this._updateFlagContainer(newFlags);
        }
        this._setPersistentFlags({
            ...this._flagContainer,
            ...newFlags
        });
        this._lastFetchedDate = Date.now();
    }

    private _updateFlagContainer(newFlags: FlagsContainer): void {
        this._flagContainer = {
            ...this._flagContainer,
            ...newFlags,
            /**
             * to avoid permanent lock in proxy solution (which depends on login / refresh)
             * xaafEnabled is always true, use killSwitch instead
             * */
            xaafEnabled: true
        };
    }

    private _setPersistentFlags(_flagContainer: FlagsContainer): void {
        try {
            const _storageService: StorageService = InjectionContainer.resolve<StorageService>(
                ContainerDef.storageService
            );
            _storageService.setItem(this._storageKey, JSON.stringify(_flagContainer));
            this._logger.info(
                `[FeatureFlagsProxyDelegate::_persistentFlags] updated persistent flags ${JSON.stringify(_flagContainer)}`
            );
        } catch (error) {
            this._logger.error('[FeatureFlagsProxyDelegate::_persistentFlags]' + JSON.stringify(error));
        }
    }

    private async _getPersistentFlags(): Promise<FlagsContainer> {
        try {
            const _storageService: StorageService = InjectionContainer.resolve<StorageService>(
                ContainerDef.storageService
            );
            const storageValue: string = await _storageService.getItem(this._storageKey);
            if (typeof storageValue !== 'string') {
                return {};
            }
            this._logger.info(
                `[FeatureFlagsProxyDelegate::_persistentFlags] retrieved persistent flags: ${JSON.stringify(storageValue)}`
            );
            return JSON.parse(storageValue);
        } catch (error) {
            this._logger.error('[FeatureFlagsProxyDelegate::_persistentFlags]' + JSON.stringify(error));
            return {};
        }
    }
}
