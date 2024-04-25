export interface Logger {
    verbose(str: string, options?: LoggerOptions): void;
    debug(str: string, options?: LoggerOptions): void;
    info(str: string, options?: LoggerOptions): void;
    warning(str: string, options?: LoggerOptions): void;
    error(str: string, options?: LoggerOptions): void;
}

export interface LoggerOptions {
    sendOverNetwork?: boolean;
}

export enum LogLevel {
    LogVerbose,
    LogDebug,
    LogInfo,
    LogWarn,
    LogError
}

export interface LoggerConstruct {
    logLevel: LogLevel;
    loggers: Logger[];
}
