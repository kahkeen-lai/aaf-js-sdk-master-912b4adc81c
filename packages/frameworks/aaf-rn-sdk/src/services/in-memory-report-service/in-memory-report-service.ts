import * as Xaaf from '@xaaf/xaaf-js-sdk';

export class InMemoryReportService implements Xaaf.ReportServiceDelegate {
    private _logger = Xaaf.LoggerService.getInstance();
    private static _instance: InMemoryReportService;
    private readonly _reports: Map<string, any> = new Map();
    private _sendingReportsNow: boolean = false;
    private _recurringSenderHandler;
    private bulkSize: number = 100;

    static getInstance(): InMemoryReportService {
        if (!InMemoryReportService._instance) {
            InMemoryReportService._instance = new InMemoryReportService();
        }
        return InMemoryReportService._instance;
    }

    init(intervalInMilliseconds: number, bulkSize: number, bulkFFEnable: boolean): void {
        this.logMessage('init', 'module initializing');
        this.clearResources();
        this.bulkSize = bulkSize;
        this.safeSendInMemoryReports = this.safeSendInMemoryReports.bind(this);
        if (bulkFFEnable) {
            this._recurringSenderHandler = setInterval(this.safeSendInMemoryReports, intervalInMilliseconds);
        }
        this.logMessage('init', `module initialized with intervals ${intervalInMilliseconds} and bulks of ${bulkSize}`);
    }

    isInitialized(): boolean {
        return !!this._recurringSenderHandler;
    }

    async putInReportQueue(report: any): Promise<boolean> {
        const entryUuid = `${Xaaf.reportStorageKeyPrefix}${Date.now()} ${Xaaf.UuidGenerator.generate()}`;
        const jsonReport = JSON.stringify(report);
        this.logMessage('putInReportQueue', `put report ${entryUuid}`);
        this._reports.set(entryUuid, jsonReport);
        if (this._reports.size >= this.bulkSize) {
            await this.safeSendInMemoryReports();
        }
        return true;
    }

    logMessage(method: string, message: string): void {
        this._logger.verbose(`[InMemoryReportService::${method}] ${message}`, { sendOverNetwork: false });
    }

    logErrorMessage(method: string, message: string): void {
        this._logger.error(`[InMemoryReportService::${method}] ${message}`, { sendOverNetwork: false });
    }

    private async safeSendInMemoryReports(): Promise<void> {
        if (this._sendingReportsNow) {
            this.logMessage(
                'safeSendInMemoryReports',
                'During sending bulk report. skipping request to send another bulk.'
            );
            return;
        }

        this.logMessage('safeSendInMemoryReports', 'Lock sending');
        this._sendingReportsNow = true;

        try {
            await this.sendInMemoryReports();
        } catch (error) {
            this.logErrorMessage('safeSendInMemoryReports', `Failed sending reports from storage: ${error}`);
        } finally {
            this._sendingReportsNow = false;
            this.logMessage('safeSendInMemoryReports', 'send lock was released');
        }
    }

    private async sendInMemoryReports(): Promise<void> {
        if (this._reports.size === 0) {
            this.logMessage('sendInMemoryReports', 'No entries to send to New Relic');
            return;
        }

        //copy _reports.entries() into array to get steady state of reports map
        const reportEntries: string[][] = Array.from(this._reports.entries());
        const reportsToSend: any[] = reportEntries.map((entry) => entry[1]);
        this.logMessage('sendInMemoryReports', `Sending ${reportsToSend.length} reports using ReportService`);
        const sendReportResult = await Xaaf.ReportService.getInstance().sendReports(reportsToSend);

        if (!sendReportResult) {
            this.logErrorMessage('sendInMemoryReports', 'Failed sending reports bulk');
            return;
        }

        this.logMessage('sendInMemoryReports', `remove sent reports from queue`);
        reportEntries.forEach((entry) => this._reports.delete(entry[0]));
    }

    clearResources(): void {
        if (this._recurringSenderHandler) {
            clearInterval(this._recurringSenderHandler);
            this._recurringSenderHandler = undefined;
        }
    }
}
