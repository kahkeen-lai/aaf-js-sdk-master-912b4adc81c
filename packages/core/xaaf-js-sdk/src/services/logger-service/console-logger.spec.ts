import { ConsoleLogger } from './console-logger';

describe('console logger functions', () => {
    beforeEach(() => {
        console.log = jest.fn().mockImplementation();
        console.debug = jest.fn().mockImplementation();
        console.info = jest.fn().mockImplementation();
        console.warn = jest.fn().mockImplementation();
        console.error = jest.fn().mockImplementation();
    });

    test('request a console logger gets one', async () => {
        const logger = ConsoleLogger.createConsoleLogger('true');
        expect(logger).toBeDefined();
    });
    test('request a console logger off gets null', async () => {
        const logger = ConsoleLogger.createConsoleLogger('no false off');
        expect(logger).toBeFalsy();
    });
    test('request nothing console logger off gets null', async () => {
        const logger = ConsoleLogger.createConsoleLogger(undefined);
        expect(logger).toBeFalsy();
    });
    test('request verbose logging calls console log only', async () => {
        const logger = ConsoleLogger.createConsoleLogger('true');
        logger.verbose('verbose');
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toBeCalledWith('verbose');
        expect(console.info).toBeCalledTimes(0);
        expect(console.debug).toBeCalledTimes(0);
        expect(console.warn).toBeCalledTimes(0);
        expect(console.error).toBeCalledTimes(0);
    });
    test('request debug logging calls console debug only', async () => {
        const logger = ConsoleLogger.createConsoleLogger('true');
        logger.debug('debug');
        expect(console.debug).toBeCalledTimes(1);
        expect(console.debug).toBeCalledWith('debug');
        expect(console.log).toBeCalledTimes(0);
        expect(console.info).toBeCalledTimes(0);
        expect(console.warn).toBeCalledTimes(0);
        expect(console.error).toBeCalledTimes(0);
    });
    test('request info logging calls console info only', async () => {
        const logger = ConsoleLogger.createConsoleLogger('true');
        logger.info('info');
        expect(console.info).toBeCalledTimes(1);
        expect(console.info).toBeCalledWith('info');
        expect(console.log).toBeCalledTimes(0);
        expect(console.debug).toBeCalledTimes(0);
        expect(console.warn).toBeCalledTimes(0);
        expect(console.error).toBeCalledTimes(0);
    });
    test('request warn logging calls console warn only', async () => {
        const logger = ConsoleLogger.createConsoleLogger('true');
        logger.warning('warning');
        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith('warning');
        expect(console.log).toBeCalledTimes(0);
        expect(console.debug).toBeCalledTimes(0);
        expect(console.info).toBeCalledTimes(0);
        expect(console.error).toBeCalledTimes(0);
    });
    test('request error logging calls console error only', async () => {
        const logger = ConsoleLogger.createConsoleLogger('true');
        logger.error('error');
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith('error');
        expect(console.log).toBeCalledTimes(0);
        expect(console.debug).toBeCalledTimes(0);
        expect(console.info).toBeCalledTimes(0);
        expect(console.warn).toBeCalledTimes(0);
    });
});
