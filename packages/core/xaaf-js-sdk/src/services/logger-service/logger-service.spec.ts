import { LoggerService } from './logger-service';
import { LogLevel } from '@xaaf/common';
import { ConsoleLogger } from './console-logger';

const logger = LoggerService.getInstance();

test('setup console logger and call debug', () => {
    logger.createLogger({ logLevel: LogLevel.LogDebug, loggers: [null, new ConsoleLogger()] });
    console.debug = jest.fn().mockImplementation();
    logger.debug('test');
    expect(console.debug).toBeCalledTimes(1);
});

test('setup console logger and call verbose', () => {
    logger.createLogger({ logLevel: LogLevel.LogVerbose, loggers: [null, new ConsoleLogger()] });
    console.log = jest.fn().mockImplementation();
    logger.verbose('test');
    expect(console.log).toBeCalledTimes(1);
});

test('setup console logger with info and call debug', () => {
    logger.createLogger({ logLevel: LogLevel.LogInfo, loggers: [null, new ConsoleLogger()] });
    console.debug = jest.fn().mockImplementation();
    logger.debug('test');
    expect(console.debug).toBeCalledTimes(0);
});

test('setup console logger with error and call error', () => {
    logger.createLogger({ logLevel: LogLevel.LogError, loggers: [null, new ConsoleLogger()] });
    console.error = jest.fn().mockImplementation();
    logger.error('test');
    expect(console.error).toBeCalledTimes(1);
});

test('setup no console logger with info and call debug', () => {
    logger.createLogger({ logLevel: LogLevel.LogInfo, loggers: [] });
    console.debug = jest.fn().mockImplementation();
    logger.debug('test');
    expect(console.debug).toBeCalledTimes(0);
});

test('setup no console logger with info and call verbose', () => {
    logger.createLogger({ logLevel: LogLevel.LogVerbose, loggers: [null, null, null] });
    console.debug = jest.fn().mockImplementation();
    logger.debug('test');
    logger.verbose('test');
    expect(console.debug).toBeCalledTimes(0);
    expect(console.log).toBeCalledTimes(0);
});

test('making sure extract log level behaves', () => {
    expect(LoggerService.extractLogLevel('debug')).toEqual(LogLevel.LogDebug);
    expect(LoggerService.extractLogLevel('verbose')).toEqual(LogLevel.LogVerbose);
    expect(LoggerService.extractLogLevel('error')).toEqual(LogLevel.LogError);
    expect(LoggerService.extractLogLevel('warn')).toEqual(LogLevel.LogWarn);
    expect(LoggerService.extractLogLevel('info')).toEqual(LogLevel.LogInfo);
    expect(LoggerService.extractLogLevel('kululu')).toEqual(LogLevel.LogDebug);
    expect(LoggerService.extractLogLevel(undefined)).toEqual(LogLevel.LogDebug);
});

test('multiple init but maintaining a single console logger call warn', () => {
    logger.createLogger({ logLevel: LogLevel.LogInfo, loggers: [new ConsoleLogger()] });
    logger.createLogger({ logLevel: LogLevel.LogInfo, loggers: [new ConsoleLogger()] });
    console.warn = jest.fn().mockImplementation();
    logger.warning('test');
    expect(console.warn).toBeCalledTimes(1);
});

test('multiple init but maintaining a single console logger call error', () => {
    logger.createLogger({ logLevel: LogLevel.LogError, loggers: [new ConsoleLogger()] });
    console.warn = jest.fn().mockImplementation();
    console.log = jest.fn().mockImplementation();
    console.debug = jest.fn().mockImplementation();
    console.info = jest.fn().mockImplementation();
    console.error = jest.fn().mockImplementation();
    logger.warning('test');
    logger.verbose('test');
    logger.debug('test');
    logger.info('test');
    logger.error('test');
    expect(console.warn).toBeCalledTimes(0);
    expect(console.info).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.debug).toBeCalledTimes(0);
    expect(console.log).toBeCalledTimes(0);
});

test('specifically instantiate production and console logs console.debug once', () => {
    logger.createLogger({ logLevel: LogLevel.LogWarn, loggers: [new ConsoleLogger()] });
    console.warn = jest.fn().mockImplementation();
    console.log = jest.fn().mockImplementation();
    console.debug = jest.fn().mockImplementation();
    console.info = jest.fn().mockImplementation();
    console.error = jest.fn().mockImplementation();
    logger.warning('test');
    logger.verbose('test');
    logger.debug('test');
    logger.info('test');
    logger.error('test');
    expect(console.warn).toBeCalledTimes(1);
    expect(console.info).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.debug).toBeCalledTimes(0);
    expect(console.log).toBeCalledTimes(0);
});
