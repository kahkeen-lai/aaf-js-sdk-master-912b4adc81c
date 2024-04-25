/* eslint-disable @typescript-eslint/no-var-requires */
import { resetMocks } from '../../mock/mock';
import { ProductionLogger } from './production-logger';
import { Logger } from '@xaaf/common';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
const mockedNewRelicLoggerClass = require('./new-relic-logger');

describe('production-logger', () => {
    beforeEach(() => {
        resetMocks();
        mockedNewRelicLoggerClass.verbose = jest.fn().mockImplementation();
        mockedNewRelicLoggerClass.debug = jest.fn().mockImplementation();
        mockedNewRelicLoggerClass.info = jest.fn().mockImplementation();
        mockedNewRelicLoggerClass.warning = jest.fn().mockImplementation();
        mockedNewRelicLoggerClass.error = jest.fn().mockImplementation();
    });

    test('setup production logger and call verbose. check not calling to NR verbose', () => {
        const featureFlagsService = new FeatureFlagsService();
        featureFlagsService.isFlagEnabled = jest.fn(() => true);
        const logger = new ProductionLogger(featureFlagsService, mockedNewRelicLoggerClass);
        expect(logger.verbose).not.toThrow();
    });

    function getFeatureFlagsLogEnabledCallback(debug: boolean, info: boolean, error: boolean): FeatureFlagsService {
        const featureFlagsService = new FeatureFlagsService();
        featureFlagsService.isFlagEnabled = (flagName: string) => {
            if (flagName === 'nrDebugLogLevelEnabled') {
                return debug;
            }
            if (flagName === 'nrInfoLogLevelEnabled') {
                return info;
            }
            if (flagName === 'nrErrorLogLevelEnabled') {
                return error;
            }
            return true;
        };
        return featureFlagsService;
    }

    function callAllLogLevels(logger: Logger, str: string): void {
        logger.verbose(str);
        logger.debug(str);
        logger.info(str);
        logger.warning(str);
        logger.error(str);
    }

    function checkExpectedResults(verbose: number, debug: number, info: number, warning: number, error: number): void {
        expect(mockedNewRelicLoggerClass.verbose).toBeCalledTimes(verbose);
        expect(mockedNewRelicLoggerClass.debug).toBeCalledTimes(debug);
        expect(mockedNewRelicLoggerClass.info).toBeCalledTimes(info);
        expect(mockedNewRelicLoggerClass.warning).toBeCalledTimes(warning);
        expect(mockedNewRelicLoggerClass.error).toBeCalledTimes(error);
    }

    test('setup production logger with info and error and call different log levels. should behave like info', () => {
        const ffService = getFeatureFlagsLogEnabledCallback(false, true, true);
        const logger = new ProductionLogger(ffService, mockedNewRelicLoggerClass);
        callAllLogLevels(logger, 'test');
        checkExpectedResults(0, 0, 1, 1, 1);
    });
    test('setup production logger with info but not error and call different log levels. should behave like info', () => {
        const ffService = getFeatureFlagsLogEnabledCallback(false, true, false);
        const logger = new ProductionLogger(ffService, mockedNewRelicLoggerClass);
        callAllLogLevels(logger, 'test');
        checkExpectedResults(0, 0, 1, 1, 1);
    });
    test('setup production logger with debug, info and error and call different log levels. should behave like debug', () => {
        const ffService = getFeatureFlagsLogEnabledCallback(true, true, true);
        const logger = new ProductionLogger(ffService, mockedNewRelicLoggerClass);
        callAllLogLevels(logger, 'test');
        checkExpectedResults(0, 1, 1, 1, 1);
    });
    test('setup production logger with debug, error but info off and call different log levels. should behave like debug', () => {
        const ffService = getFeatureFlagsLogEnabledCallback(true, false, true);
        const logger = new ProductionLogger(ffService, mockedNewRelicLoggerClass);
        callAllLogLevels(logger, 'test');
        checkExpectedResults(0, 1, 1, 1, 1);
    });
    test('setup production logger with debug, but error and info off and call different log levels. should behave like debug', () => {
        const ffService = getFeatureFlagsLogEnabledCallback(true, false, false);
        const logger = new ProductionLogger(ffService, mockedNewRelicLoggerClass);
        callAllLogLevels(logger, 'test');
        checkExpectedResults(0, 1, 1, 1, 1);
    });
    test('setup production logger with error and call different log levels', () => {
        const ffService = getFeatureFlagsLogEnabledCallback(false, false, true);
        const logger = new ProductionLogger(ffService, mockedNewRelicLoggerClass);
        callAllLogLevels(logger, 'test');
        checkExpectedResults(0, 0, 0, 0, 1);
    });
    test('setup production logger with no logs and call different log levels', () => {
        const ffService = getFeatureFlagsLogEnabledCallback(false, false, false);
        const logger = new ProductionLogger(ffService, mockedNewRelicLoggerClass);
        callAllLogLevels(logger, 'test');
        checkExpectedResults(0, 0, 0, 0, 0);
    });
});
