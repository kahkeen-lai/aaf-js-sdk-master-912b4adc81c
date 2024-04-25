import { XaafDynamicElementListener, DynamicEvents, XaafError, CommandModel, CommandReport } from '@xaaf/common';
import { Runner } from '@xaaf/ad-script';
import { Command } from '../executable-ad/commands/command';
const LOG_KEY = 'AdScriptCommand::';

export class AdScriptCommand extends Command implements XaafDynamicElementListener {
    private _runner: Runner;

    constructor(commandModel: CommandModel) {
        super();
        this._commandModel = commandModel;
        this._runner = new Runner(this);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init(): void {
        // This is intentional
    }

    execute(): void {
        this._loggerService.info(`[${LOG_KEY}execute] executing command`);

        this._runner.init(this._commandModel.data);

        this._loggerService.info(`[${LOG_KEY}execute] AdScript compilation complete`);

        for (const event of this._commandModel.data.events) {
            if (event.action === DynamicEvents.Loaded && event.name && this._runner.buildMethods[event.name]) {
                this._loggerService.info(`[${LOG_KEY}execute] found load event: ${event.name}`);
                this._runner.buildMethods[event.name](event.args);
                this._loggerService.info(`[${LOG_KEY}execute] completed ${event.name}`);
                this.onLoad();
            }
        }
    }

    stop(): void {
        this._loggerService.info(`[${LOG_KEY}onLoad] command stopped`);
    }

    async onLoad(): Promise<void> {
        this._loggerService.info(`[${LOG_KEY}onLoad] command loaded`);
        this._notifyCompleted();
        const report: CommandReport = this._commandModel.report;
        await this._report(report);
    }

    async onError(error: XaafError): Promise<void> {
        this._notifyError(error);
    }

    onCommandError(error: XaafError): void {
        try {
            this._loggerService.error(`[${LOG_KEY}onCommandError] ${error.message} ${error.errorCode}`);
            this._notifyError(error);
        } catch (error_) {
            this._loggerService.error(`[${LOG_KEY}onCommandError] ${error_}`);
        }
    }

    onCompleted(): void {
        this._notifyHandled();
    }
}
