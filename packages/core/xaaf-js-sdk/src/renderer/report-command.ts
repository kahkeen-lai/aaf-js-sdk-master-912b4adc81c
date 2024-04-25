import { Command } from '../executable-ad/commands';
import { XaafAdContainer } from '../executable-ad/elements';
import { CommandModel, CommandReport } from '@xaaf/common';
import { StateType } from '../fsm/state';
import { TriggerType } from '../fsm/trigger';

export class ReportCommand extends Command {
    private readonly _commandsConditionsMap: Map<TriggerType, TriggerType[]>;
    reportExecutionFlag: boolean;

    constructor(commandModel: CommandModel) {
        super();
        this._commandModel = commandModel;
        this._commandsConditionsMap = this.getCommandTriggerConditions();
        this.reportExecutionFlag = false;
    }

    init(xaafAdContainer: XaafAdContainer): void {
        this._loggerService.info(`ReportCommand:init, ref: ${!!xaafAdContainer}`);
    }

    async execute(
        xaafAdContainer: XaafAdContainer,
        currentState: StateType,
        stateInstanceHistory: Set<TriggerType>
    ): Promise<void> {
        if (this.condition(currentState, stateInstanceHistory, this._commandsConditionsMap)) {
            const report: CommandReport = this._commandModel.report;
            await this._report(report);
            this._notifyHandled();
            this._notifyCompleted();
            this.reportExecutionFlag = true;
        }
    }

    stop(): void {
        this._loggerService.info('ReportCommand:stop');
    }
}
