import { resetMocks } from '../../mock/mock';
import { LogLevel } from '@xaaf/common';
import { NewRelicLogger } from './new-relic-logger';
import { ConfigService } from '../config-service/config-service';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import { LoggerService } from './logger-service';

describe('new relic logger', () => {
    function spyOnLogCapsuleValue(configService: ConfigService): void {
        jest.spyOn(configService, 'nrApiKey', 'get').mockReturnValue('nrApiKey');
        jest.spyOn(configService, 'deviceUUID', 'get').mockReturnValue('deviceUUID');
        jest.spyOn(configService, 'deviceType', 'get').mockReturnValue('deviceType');
        jest.spyOn(configService, 'device', 'get').mockReturnValue('device');
        jest.spyOn(configService, 'deviceModel', 'get').mockReturnValue('deviceModel');
        jest.spyOn(configService, 'deviceManufacturer', 'get').mockReturnValue('deviceManufacturer');
        jest.spyOn(configService, 'osName', 'get').mockReturnValue('osName');
        jest.spyOn(configService, 'osVersion', 'get').mockReturnValue('osVersion');
        jest.spyOn(configService, 'userType', 'get').mockReturnValue('userType');
        jest.spyOn(configService, 'tenantName', 'get').mockReturnValue('tenantName');
        jest.spyOn(configService, 'tenantSystemName', 'get').mockReturnValue('tenantSystemName');
        jest.spyOn(configService, 'appName', 'get').mockReturnValue('appName');
        jest.spyOn(configService, 'appVersion', 'get').mockReturnValue('appVersion');
        jest.spyOn(configService, 'platform', 'get').mockReturnValue('platform');
        jest.spyOn(configService, 'sdkName', 'get').mockReturnValue('sdkName');
        jest.spyOn(configService, 'sdkVersion', 'get').mockReturnValue('sdkVersion');
        jest.spyOn(configService, 'platformName', 'get').mockReturnValue('platformName');
    }
    beforeAll(() => {
        resetMocks();
    });
    test('setup new relic logger and call verbose', async (done) => {
        const newRelicVerboseMessage = 'new relic logger never reports verbose';
        const featureFlagsService = new FeatureFlagsService();
        featureFlagsService.isFlagEnabled = jest.fn(() => true);
        const logger = new NewRelicLogger(new ConfigService());
        console.error = jest.fn().mockImplementation();
        logger.verbose(newRelicVerboseMessage);
        expect(console.error).toBeCalled();
        done();
    });

    test('setup new relic logger for startup log buffering', async (done) => {
        const newRelicMessage = 'new relic logger is the best';
        const featureFlagsService = new FeatureFlagsService();
        featureFlagsService.isFlagEnabled = jest.fn(() => true);
        const configService = new ConfigService();

        const logger = new NewRelicLogger(configService);
        for (let i = 0; i < 30; i++) {
            logger.info(newRelicMessage);
        }

        spyOnLogCapsuleValue(configService);
        logger.info(newRelicMessage);
        logger.error(newRelicMessage);
        logger.debug(newRelicMessage);
        logger.warning(newRelicMessage);

        done();
    });

    test('make sure new relic is sending data over network when not using options', async (done) => {
        const featureFlagsService = new FeatureFlagsService();
        featureFlagsService.isFlagEnabled = jest.fn(() => true);
        const configService = new ConfigService();
        const logger = LoggerService.getInstance();
        const newRelicLogger = new NewRelicLogger(configService);
        logger.createLogger({ logLevel: LogLevel.LogDebug, loggers: [newRelicLogger] });
        // @ts-ignore
        jest.spyOn(newRelicLogger, '_handleLogMessage');
        logger.error('test network');
        logger.warning('test network');
        logger.info('test network');
        logger.debug('test network');
        expect(newRelicLogger['_handleLogMessage']).toBeCalledTimes(4);
        done();
    });

    test('make sure new relic is NOT sending data over network when using options', async (done) => {
        const featureFlagsService = new FeatureFlagsService();
        featureFlagsService.isFlagEnabled = jest.fn(() => true);
        const configService = new ConfigService();
        const logger = LoggerService.getInstance();
        const newRelicLogger = new NewRelicLogger(configService);
        logger.createLogger({ logLevel: LogLevel.LogDebug, loggers: [newRelicLogger] });
        // @ts-ignore
        jest.spyOn(newRelicLogger, '_handleLogMessage');
        logger.error('test network', { sendOverNetwork: false });
        logger.warning('test network', { sendOverNetwork: false });
        logger.info('test network', { sendOverNetwork: false });
        logger.debug('test network', { sendOverNetwork: false });
        expect(newRelicLogger['_handleLogMessage']).toBeCalledTimes(0);
        done();
    });

    test('make sure new relic is sending data over network when using options with true', async (done) => {
        const featureFlagsService = new FeatureFlagsService();
        featureFlagsService.isFlagEnabled = jest.fn(() => true);
        const configService = new ConfigService();
        const logger = LoggerService.getInstance();
        const newRelicLogger = new NewRelicLogger(configService);
        logger.createLogger({ logLevel: LogLevel.LogDebug, loggers: [newRelicLogger] });
        // @ts-ignore
        jest.spyOn(newRelicLogger, '_handleLogMessage');
        logger.error('test network', { sendOverNetwork: true });
        logger.warning('test network', { sendOverNetwork: true });
        logger.info('test network', { sendOverNetwork: true });
        logger.debug('test network', { sendOverNetwork: true });
        expect(newRelicLogger['_handleLogMessage']).toBeCalledTimes(4);
        done();
    });
});
