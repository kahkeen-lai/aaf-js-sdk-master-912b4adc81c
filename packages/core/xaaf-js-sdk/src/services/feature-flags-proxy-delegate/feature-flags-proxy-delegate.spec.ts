/* eslint-disable @typescript-eslint/no-unused-vars */
import { FeatureFlagsProxyDelegate } from './feature-flags-proxy-delegate';
import * as Xaaf from '@xaaf/common';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import { FlagName } from '../feature-flags-service/flag-container';

describe('feature flag proxy delegate integration tests', () => {
    let featureFlagsService: FeatureFlagsService;
    let featureFlagsDelegate: FeatureFlagsProxyDelegate;

    beforeAll(() => {
        Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.storageService, {
            getItem: jest.fn(() => JSON.stringify({ flagFromStorage: true })),
            removeItem: jest.fn(),
            setItem: jest.fn()
        });
    });

    beforeEach(() => {
        featureFlagsService = FeatureFlagsService.getInstance();
        featureFlagsDelegate = new FeatureFlagsProxyDelegate();

        Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.featureFlagsDelegate, featureFlagsDelegate);
        const targetGroup: Xaaf.TargetGroup = {
            distinctId: 'distinctId',
            appName: 'appName',
            platform: 'platform',
            version: 'version'
        };
        const customStringProperties = new Map([['foo', 'bar']]);
        featureFlagsService.register(targetGroup, customStringProperties);
    });

    it('should check storage adapter mock resolution', () => {
        const storageService: Xaaf.StorageService = Xaaf.InjectionContainer.resolve<Xaaf.StorageService>(
            Xaaf.ContainerDef.storageService
        );
        storageService.getItem('read');
        storageService.removeItem('remove');
        storageService.setItem('write', 'val');

        const storageService2: Xaaf.StorageService = Xaaf.InjectionContainer.resolve<Xaaf.StorageService>(
            Xaaf.ContainerDef.storageService
        );
        expect(storageService2.getItem).toBeCalledWith('read');
        expect(storageService2.removeItem).toBeCalledWith('remove');
        expect(storageService2.setItem).toBeCalledWith('write', 'val');
    });

    it('setup should set keys in persistent storage', () => {
        featureFlagsDelegate['_flagContainer'] = {};
        const res = {
            featureFlags: {
                timeToNextFetch: -1,
                flags: {
                    flag1: true,
                    flag2: true,
                    flag3: false
                }
            }
        };
        featureFlagsDelegate.setup(res);

        const storageService: Xaaf.StorageService = Xaaf.InjectionContainer.resolve<Xaaf.StorageService>(
            Xaaf.ContainerDef.storageService
        );
        expect(storageService.setItem).toBeCalledWith(
            featureFlagsDelegate['_storageKey'],
            JSON.stringify({
                ...res.featureFlags.flags,
                xaafEnabled: true
            })
        );
    });

    it('register should read from persistent storage', async () => {
        featureFlagsDelegate['_flagContainer'] = {};
        featureFlagsDelegate.register(({
            targetGroup: { distinctId: 'distinctId' }
        } as unknown) as Xaaf.FeatureFlagsRegistration);

        // await _getPersistentFlags promise to complete
        await new Promise<void>((resolve) => setTimeout(resolve, 10));

        const storageService: Xaaf.StorageService = Xaaf.InjectionContainer.resolve<Xaaf.StorageService>(
            Xaaf.ContainerDef.storageService
        );
        expect(storageService.getItem).toBeCalledWith(featureFlagsDelegate['_storageKey']);
        expect(featureFlagsDelegate['_flagContainer']['flagFromStorage']).toBe(true);
    });

    it('register should combine with keys from storage', async () => {
        featureFlagsDelegate['_flagContainer'] = {};
        expect(featureFlagsDelegate['_flagContainer']).toStrictEqual({});
        const flags = {
            flag1: true,
            flag2: true,
            flag3: false
        };
        featureFlagsDelegate.register(({
            flags,
            targetGroup: { distinctId: 'distinctId' }
        } as unknown) as Xaaf.FeatureFlagsRegistration);
        // await _getPersistentFlags promise to complete
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
        expect(featureFlagsDelegate['_flagContainer']).toStrictEqual({
            ...flags,
            flagFromStorage: true,
            xaafEnabled: true
        });
    });

    it('flagNames should return string array', () => {
        const featureFlagRequest = featureFlagsService.featureFlagRequest;
        const flagNames = featureFlagRequest.featureFlags.flagNames;
        expect(flagNames.includes(FlagName.xaafEnabled)).toBe(true);
        expect(flagNames.includes(FlagName.nrInfoLogLevelEnabled)).toBe(true);
        expect(flagNames.includes(FlagName.bufferTimeoutEnabled)).toBe(true);
    });

    it('isFlagEnabled should return value of flag', () => {
        featureFlagsDelegate['_flagContainer'][FlagName.xaafEnabled] = true;
        featureFlagsDelegate['_flagContainer'][FlagName.nrInfoLogLevelEnabled] = false;

        expect(featureFlagsService.isFlagEnabled(FlagName.xaafEnabled)).toBe(true);
        expect(featureFlagsService.isFlagEnabled(FlagName.nrInfoLogLevelEnabled)).toBe(false);
    });

    it('given certain flag values, when calling setup, updates FlagContainer', () => {
        featureFlagsDelegate['_flagContainer'][FlagName.xaafEnabled] = true;
        featureFlagsDelegate['_flagContainer'][FlagName.adStartHintEnabled] = false;
        featureFlagsDelegate['_flagContainer'][FlagName.nrInfoLogLevelEnabled] = false;
        const featureFlagsSetupRequest = {
            featureFlags: {
                timeToNextFetch: -1,
                flags: {
                    [FlagName.xaafEnabled]: false,
                    [FlagName.adStartHintEnabled]: false,
                    [FlagName.nrInfoLogLevelEnabled]: true
                }
            }
        };
        featureFlagsService.setup(featureFlagsSetupRequest);

        expect(featureFlagsService.isFlagEnabled(FlagName.xaafEnabled)).toBe(true); // xaafEnabled should always be true
        expect(featureFlagsService.isFlagEnabled(FlagName.xaafEnabled)).toBe(true);
        expect(featureFlagsService.isFlagEnabled(FlagName.nrInfoLogLevelEnabled)).toBe(true);
    });

    it('given default setup, when calling getter, retrieve correct object', () => {
        const { featureFlags }: Xaaf.FeatureFlagsRequest = featureFlagsDelegate.featureFlagRequest;

        expect(featureFlags.flagNames).toBeTruthy();
        expect(featureFlags.namespace).toBe('xaaf');
        expect(featureFlags.distinctId).toBe('distinctId');
        expect(featureFlags.customStringProperties.foo).toBe('bar');
    });

    it('given update when freeze is true, should update only store ', async () => {
        featureFlagsDelegate['_isFreeze'] = true;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _updateFlagContainerSpy = jest.spyOn(featureFlagsDelegate, '_updateFlagContainer');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _setPersistentFlagsSpy = jest.spyOn(featureFlagsDelegate, '_setPersistentFlags');

        const newFlags = {
            freeze_flag1: true,
            freeze_flag2: true,
            freeze_flag3: false
        };
        featureFlagsDelegate['_updateAndStore'](newFlags);

        expect(_updateFlagContainerSpy).not.toBeCalled();
        expect(_setPersistentFlagsSpy).toBeCalledWith({
            ...featureFlagsDelegate['_flagContainer'],
            ...newFlags
        });
    });

    it('given update when freeze is false, should update only store ', async () => {
        featureFlagsDelegate['_isFreeze'] = false;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _updateFlagContainerSpy = jest.spyOn(featureFlagsDelegate, '_updateFlagContainer');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _setPersistentFlagsSpy = jest.spyOn(featureFlagsDelegate, '_setPersistentFlags');

        const newFlags = {
            freeze_flag1: true,
            freeze_flag2: true,
            freeze_flag3: false
        };
        featureFlagsDelegate['_updateAndStore'](newFlags);

        expect(_updateFlagContainerSpy).toBeCalledWith(newFlags);
        expect(_setPersistentFlagsSpy).toBeCalledWith({
            ...featureFlagsDelegate['_flagContainer'],
            ...newFlags
        });
    });

    it('given setup when freeze is true, should update only store ', async () => {
        featureFlagsDelegate['_isFreeze'] = true;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _updateFlagContainerSpy = jest.spyOn(featureFlagsDelegate, '_updateFlagContainer');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _setPersistentFlagsSpy = jest.spyOn(featureFlagsDelegate, '_setPersistentFlags');

        const featureFlags = {
            timeToNextFetch: -1,
            flags: {
                setup_freeze_flag1: true,
                setup_freeze_flag2: true,
                setup_freeze_flag3: false
            }
        };
        featureFlagsDelegate.setup({ featureFlags });

        expect(_updateFlagContainerSpy).not.toBeCalled();
        expect(_setPersistentFlagsSpy).toBeCalledWith({
            ...featureFlagsDelegate['_flagContainer'],
            ...featureFlags.flags
        });
        expect(featureFlagsDelegate['_flagContainer']['setup_freeze_flag1']).toBe(undefined);
        expect(featureFlagsDelegate['_flagContainer']['setup_freeze_flag2']).toBe(undefined);
        expect(featureFlagsDelegate['_flagContainer']['setup_freeze_flag3']).toBe(undefined);
    });

    it('given setup when freeze is false, should update only store ', async () => {
        featureFlagsDelegate['_isFreeze'] = false;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _updateFlagContainerSpy = jest.spyOn(featureFlagsDelegate, '_updateFlagContainer');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const _setPersistentFlagsSpy = jest.spyOn(featureFlagsDelegate, '_setPersistentFlags');

        const featureFlags = {
            timeToNextFetch: -1,
            flags: {
                setup_freeze_flag1: true,
                setup_freeze_flag2: true,
                setup_freeze_flag3: false
            }
        };
        featureFlagsDelegate.setup({ featureFlags });

        expect(_updateFlagContainerSpy).toBeCalledWith(featureFlags.flags);
        expect(_setPersistentFlagsSpy).toBeCalledWith({
            ...featureFlagsDelegate['_flagContainer'],
            ...featureFlags.flags
        });
        expect(featureFlagsDelegate['_flagContainer']['setup_freeze_flag1']).toEqual(true);
        expect(featureFlagsDelegate['_flagContainer']['setup_freeze_flag2']).toEqual(true);
        expect(featureFlagsDelegate['_flagContainer']['setup_freeze_flag3']).toEqual(false);
    });
});
