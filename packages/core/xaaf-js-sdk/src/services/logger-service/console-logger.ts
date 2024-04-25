import { Logger } from '@xaaf/common';

export class ConsoleLogger implements Logger {
    static createConsoleLogger(consoleLoggerOut: string): Logger {
        if (consoleLoggerOut) {
            const consoleLogger = consoleLoggerOut.toLowerCase();
            if (consoleLogger === 'true') {
                return new ConsoleLogger();
            }
        } else {
            return null;
        }
    }

    debug(str: string): void {
        console.debug(str);
    }

    error(str: string): void {
        console.error(str);
    }

    info(str: string): void {
        console.info(str);
    }

    verbose(str: string): void {
        console.log(str);
    }

    warning(str: string): void {
        console.warn(str);
    }
}
