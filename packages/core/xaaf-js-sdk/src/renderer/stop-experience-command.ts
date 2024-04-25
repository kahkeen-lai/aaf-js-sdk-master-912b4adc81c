import { Command } from '../executable-ad/commands';
import { XaafAdContainer } from '../executable-ad/elements';
import { CommandModel } from '@xaaf/common';
import { TriggerType } from '../fsm/trigger';

export class StopExperienceCommand extends Command {
    private readonly _commandTriggersDataMap: Map<TriggerType, Map<string, number>>;

    constructor(commandModel: CommandModel) {
        super();
        this._commandModel = commandModel;
        this._commandTriggersDataMap = this.getCommandTriggersData();
    }

    init(xaafAdContainer: XaafAdContainer): void {
        this._loggerService.info(`StopExperienceCommand:init, ref: ${!!xaafAdContainer}`);
    }

    async execute(): Promise<void> {
        this._loggerService.info('StopExperienceCommand:execute');
        /*
         * _notify calls executableAd._commandEventListener, which executes actions according to CommandEventType
         * in this case, _commandEventListener will trigger _stopAd()
         * TODO: rename _notify into a self-documenting function, as it performs non-trivial side-effects
         */
        this._notify(
            this._commandEventCreator.createStopExperienceEvent(
                this._commandModel.data.reason,
                this._commandModel.data.notifyToHost
            )
        );
    }

    stop(): void {
        this._loggerService.info('StopExperienceCommand:stop');
    }
}
