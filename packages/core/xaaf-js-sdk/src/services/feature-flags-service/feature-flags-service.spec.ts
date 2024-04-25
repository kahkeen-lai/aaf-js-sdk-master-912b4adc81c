import '../../mock/mock';
import * as Core from '@xaaf/common';
import { FeatureFlagsService } from './feature-flags-service';
import { LoggerService } from '../logger-service';
import { NewRelicLogger } from '../logger-service/new-relic-logger';
import { mock } from 'jest-mock-extended';
import { ConfigService } from '../config-service/config-service';
import { FlagName, XaafFlagContainer, XaafNamespace } from './flag-container';

test('Make sure FeatureFlagsService is using console and not using logger methods', () => {
    // If you failed in this test it means that the code was changed and now uses the
    // logger for isFlagEnabled. Logging in this method has very unfortunate
    // effects like infinite call stack when sending logs to new relic.
    // if these loops are solved by refactoring then this unit test can be deleted
    const configService = new ConfigService();
    const logger = LoggerService.getInstance();
    const newRelicLogger: NewRelicLogger = new NewRelicLogger(configService);
    logger.createLogger({ logLevel: Core.LogLevel.LogDebug, loggers: [newRelicLogger] });
    // @ts-ignore
    jest.spyOn(newRelicLogger, '_handleLogMessage');
    const service = FeatureFlagsService.getInstance();
    service.isFlagEnabled(FlagName.xaafEnabled);
    service.isFlagEnabled(FlagName.xaafEnabled);

    Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, mock<Core.FeatureFlagsDelegate>());
    service.isFlagEnabled(FlagName.xaafEnabled);
    service.isFlagEnabled(FlagName.xaafEnabled);

    expect(newRelicLogger['_handleLogMessage']).toBeCalledTimes(0);
});

describe('tests integration of feature flags delegate', () => {
    it('tests feature flags container register - interface mock', () => {
        const customStringProperties: Map<string, string> = new Map([['foo', 'bar']]);
        const service = FeatureFlagsService.getInstance();
        const featureFlagsDelegateMock = mock<Core.FeatureFlagsDelegate>();
        const targetGroup = {
            distinctId: 'distinctId',
            appName: 'appName',
            platform: 'platform',
            version: 'version'
        };
        Core.InjectionContainer.registerInstance(Core.ContainerDef.featureFlagsDelegate, featureFlagsDelegateMock);
        service.register(targetGroup, customStringProperties);

        expect(featureFlagsDelegateMock.register).toHaveBeenCalledWith({
            namespace: XaafNamespace,
            flags: XaafFlagContainer,
            customStringProperties,
            targetGroup
        });
    });
});
