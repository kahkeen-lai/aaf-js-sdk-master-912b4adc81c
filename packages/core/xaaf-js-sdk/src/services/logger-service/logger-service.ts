import { ContainerDef, InjectionContainer, Logger, LoggerConstruct, LoggerOptions, LogLevel } from '@xaaf/common';

export class LoggerService implements Logger {
    private _logLevel: LogLevel;
    private _loggers: Array<Logger> = [];

    static getInstance(): LoggerService {
        return InjectionContainer.resolve<LoggerService>(ContainerDef.loggerService);
    }

    createLogger(loggerConstruct: LoggerConstruct): void {
        // clean any previous loggers
        this._loggers = [];
        this._logLevel = loggerConstruct.logLevel;
        for (const logger of loggerConstruct.loggers) {
            if (logger) {
                this.add(logger);
            }
        }
    }

    static extractLogLevel(logLevelFromArgs: string): LogLevel {
        if (!logLevelFromArgs) {
            // default log level debug
            return LogLevel.LogDebug;
        } else {
            const logLevel = logLevelFromArgs.toLowerCase();
            switch (logLevel) {
                case 'verbose':
                    return LogLevel.LogVerbose;
                case 'debug':
                    return LogLevel.LogDebug;
                case 'info':
                    return LogLevel.LogInfo;
                case 'warn':
                    return LogLevel.LogWarn;
                case 'error':
                    return LogLevel.LogError;
                default:
                    return LogLevel.LogDebug;
            }
        }
    }

    add(logger: Logger): void {
        this._loggers.push(logger);
    }

    verbose(str: string, options?: LoggerOptions): void {
        if (this._logLevel <= LogLevel.LogVerbose) {
            this._loggers.forEach((logger: Logger) => {
                logger.verbose(str, options);
            });
        }
    }

    debug(str: string, options?: LoggerOptions): void {
        if (this._logLevel <= LogLevel.LogDebug) {
            this._loggers.forEach((logger: Logger) => {
                logger.debug(str, options);
            });
        }
    }

    info(str: string, options?: LoggerOptions): void {
        if (this._logLevel <= LogLevel.LogInfo) {
            this._loggers.forEach((logger: Logger) => {
                logger.info(str, options);
            });
        }
    }

    warning(str: string, options?: LoggerOptions): void {
        if (this._logLevel <= LogLevel.LogWarn) {
            this._loggers.forEach((logger: Logger) => {
                logger.warning(str, options);
            });
        }
    }

    error(str: string, options?: LoggerOptions): void {
        if (this._logLevel <= LogLevel.LogError) {
            this._loggers.forEach((logger: Logger) => {
                logger.error(str, options);
            });
        }
    }

    assert(predicate: boolean, str: string, options?: LoggerOptions): void {
        if (!predicate) {
            this.warning(str, options);
        }
    }
}

InjectionContainer.registerSingleton(ContainerDef.loggerService, LoggerService);
