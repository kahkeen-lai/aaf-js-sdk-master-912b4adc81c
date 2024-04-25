import * as Xaaf from '@xaaf/xaaf-js-sdk';
import SecureAsyncStorage from '../../utils/SecureAsyncStorage';

interface PersistentReportObject {
    createdTime: string;
    key: string;
}
export class PersistentReportService implements Xaaf.ReportServiceDelegate {
    private static _instance: PersistentReportService;
    private _recurringSenderHandler;
    private static _itemsInStorage = 0;
    private static _sendingReportsNow = false;
    private static _logger = Xaaf.LoggerService.getInstance();
    private _configService = Xaaf.ConfigService.getInstance();
    private static _bulkFFEnable = true;

    static getInstance(): PersistentReportService {
        if (!PersistentReportService._instance) {
            PersistentReportService._instance = new PersistentReportService();
        }
        return PersistentReportService._instance;
    }

    init(intervalInMilliseconds: number, bulkSize: number, bulkFFEnable: boolean): void {
        const logger = PersistentReportService._logger;
        PersistentReportService._bulkFFEnable = bulkFFEnable;
        logger.verbose('[PersistentReportService::init] module initializing');
        if (this._recurringSenderHandler) {
            clearInterval(this._recurringSenderHandler);
            this._recurringSenderHandler = undefined;
        }
        this._recurringSenderHandler = setInterval(this.sendReportsFromStorage, intervalInMilliseconds);
        logger.verbose(
            `[PersistentReportService::init] module initialized with intervals ${intervalInMilliseconds} and bulks of ${bulkSize}`
        );
    }

    private async _restart(): Promise<void> {
        const logger = PersistentReportService._logger;
        logger.verbose('[PersistentReportService::_restart] restarting module');
        const isEnable = PersistentReportService._bulkFFEnable;
        await this.sendReportsFromStorage();
        this.init(
            this._configService.bulkConfiguration.reportingBulkDelay,
            this._configService.bulkConfiguration.reportingBulk,
            isEnable
        );
    }

    isInitialized(): boolean {
        return !!this._recurringSenderHandler;
    }

    private static async _getKeysOfReportsToSend(): Promise<string[]> {
        const logger = PersistentReportService._logger;
        logger.verbose('[PersistentReportService::_getKeysOfReportsToSend] getting keys from storage');

        let reportKeys = new Array<string>();
        try {
            reportKeys = (await SecureAsyncStorage.getAllKeys()).filter((key) =>
                key.startsWith(Xaaf.reportStorageKeyPrefix)
            );
            logger.verbose(
                `[PersistentReportService::_getKeysOfReportsToSend] got ${reportKeys.length} keys from storage`
            );
        } catch (error) {
            logger.warning(
                `[PersistentReportService::_getKeysOfReportsToSend] Failed getting keys from storage. Error: ${error}`
            );
        }

        return reportKeys;
    }

    private static _errorCallback(errors?: Error[], result?: [string, string][]): void {
        const logger = PersistentReportService._logger;
        if (errors) {
            errors.forEach((error) => {
                logger.warning(
                    `[PersistentReportService::_errorCallback] Failed getting report entry from storage. Error ${error}, result: ${!!result}`
                );
            });
        }
    }

    private static async _dropReportsSent(keysAndReports): Promise<void> {
        const logger = PersistentReportService._logger;
        const keysToRemove = [];
        if (keysAndReports) {
            keysAndReports.forEach((keyAndReport) => {
                keysToRemove.push(keyAndReport[0]);
            });
        }
        logger.verbose(`[PersistentReportService::_dropReportsSent] deleting ${keysToRemove} keys from storage`);
        await SecureAsyncStorage.multiRemove(keysToRemove, (errors) => {
            if (errors) {
                errors.forEach((error) =>
                    logger.warning(`[PersistentReportService::_dropReportsSent] failed deleting from storage: ${error}`)
                );
            }
        });
    }

    private async sendReportsFromStorage(): Promise<void> {
        const logger = PersistentReportService._logger;
        if (PersistentReportService._sendingReportsNow) {
            logger.verbose(
                '[PersistentReportService::sendReportsFromStorage] During sending bulk report. skipping request to send another bulk.',
                { sendOverNetwork: false }
            );
            return;
        }
        logger.verbose('[PersistentReportService::sendReportsFromStorage] Lock sending', { sendOverNetwork: false });
        PersistentReportService._sendingReportsNow = true;
        try {
            logger.verbose('[PersistentReportService::sendReportsFromStorage] Getting keys from storage', {
                sendOverNetwork: false
            });
            const uuidKeysToReportToNewRelic = await PersistentReportService._getKeysOfReportsToSend();
            logger.verbose('[PersistentReportService::sendReportsFromStorage] Getting keys and reports from storage', {
                sendOverNetwork: false
            });
            const keysAndReports: string[][] = await SecureAsyncStorage.multiGet(
                uuidKeysToReportToNewRelic,
                PersistentReportService._errorCallback
            );
            const reports = [];
            if (keysAndReports) {
                keysAndReports.forEach((keyAndReport) => {
                    reports.push(keyAndReport[1]);
                });
            }
            if (reports.length === 0) {
                logger.verbose('[PersistentReportService::sendReportsFromStorage] No entries to send to New Relic');
            } else {
                logger.verbose(
                    `[PersistentReportService::sendReportsFromStorage] Sending ${reports.length} reports using ReportService`,
                    { sendOverNetwork: false }
                );
                const result = await Xaaf.ReportService.getInstance().sendReports(reports);
                if (result) {
                    await PersistentReportService._dropReportsSent(keysAndReports);
                    PersistentReportService._itemsInStorage -= reports.length;
                } else {
                    logger.warning(
                        '[PersistentReportService::sendReportsFromStorage] Failed sending reports from storage',
                        { sendOverNetwork: false }
                    );
                }
            }
        } catch (error) {
            logger.warning(
                `[PersistentReportService::sendReportsFromStorage] Failed sending reports from storage: ${error}`,
                { sendOverNetwork: false }
            );
        }
        logger.verbose('[PersistentReportService::sendReportsFromStorage] Free send lock', { sendOverNetwork: false });
        PersistentReportService._sendingReportsNow = false;
    }

    async putInReportQueue(report: Record<string, unknown>): Promise<boolean> {
        const _loggerService = Xaaf.LoggerService.getInstance();
        try {
            const entryUuid = `${Xaaf.reportStorageKeyPrefix}${Date.now()} ${Xaaf.UuidGenerator.generate()}`;
            const jsonReport = JSON.stringify(report);
            _loggerService.verbose(`[PersistentReportService::putInReportQueue] storing report ${entryUuid}`, {
                sendOverNetwork: false
            });
            await SecureAsyncStorage.setItem(entryUuid, jsonReport);
            PersistentReportService._itemsInStorage++;
            _loggerService.verbose('[PersistentReportService::putInReportQueue] report stored', {
                sendOverNetwork: false
            });
            if (PersistentReportService._itemsInStorage >= this._configService.bulkConfiguration.reportingBulk) {
                _loggerService.verbose(
                    `[PersistentReportService::putInReportQueue] restarting because having ${PersistentReportService._itemsInStorage} which is more or equal than the bulk size ${this._configService.bulkConfiguration.reportingBulk}`,
                    { sendOverNetwork: false }
                );
                await this._restart();
            }
        } catch (error) {
            _loggerService.error(
                `[PersistentReportService::putInReportQueue] Failed to store report. Error: ${error}`,
                { sendOverNetwork: false }
            );
            return false;
        }
        return true;
    }

    terminate(): void {
        if (this._recurringSenderHandler) {
            clearInterval(this._recurringSenderHandler);
            this._recurringSenderHandler = undefined;
        }
    }
}
