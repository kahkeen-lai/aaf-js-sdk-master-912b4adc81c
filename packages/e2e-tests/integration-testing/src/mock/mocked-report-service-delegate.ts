/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ReportServiceDelegate } from '@xaaf/xaaf-js-sdk';

/**
 * A mocked ReportServiceDelegate, to be used as a delegate for a real ReportService.
 */
export class MockedReportServiceDelegate implements ReportServiceDelegate {
  init(intervalInMilliseconds, bulkSize): void {}

  isInitialized(): boolean {
    return true;
  }

  async putInReportQueue(report): Promise<boolean> {
    return true;
  }
}
