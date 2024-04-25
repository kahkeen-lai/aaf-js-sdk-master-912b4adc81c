/* eslint-disable no-empty */
import { Logger } from '@xaaf/common';
import * as path from 'path';
import * as fs from 'fs';
const logPath = path.join(process.cwd(), 'coverage', 'measurement.log');

export class FileLogger implements Logger {
  clearFileLog(): void {
    try {
      fs.unlinkSync(logPath);
    } catch (error) {}
  }

  debug(str: string): void {
    console.debug(str);
  }

  info(str: string): void {
    console.info(str);
  }

  error(str: string): void {
    console.error(str);
  }

  warning(str: string): void {
    console.warn(str);
  }

  verbose(str: string): void {
    if (str.includes('measurement url')) {
      try {
        fs.appendFileSync(logPath, str);
      } catch (error) {
        console.error('failed to log measurement.log', error);
      }
    }
  }
}
