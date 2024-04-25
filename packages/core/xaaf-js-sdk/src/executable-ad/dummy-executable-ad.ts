import { Xip, AdEventReason } from '@xaaf/common';
import { TriggerType, Trigger } from '../fsm/trigger';
import { Command } from './commands';
import { ExecutableAd } from './executable-ad';
import { OpportunityInfo } from '../xaaf-js-sdk';
import { State, StateType } from '../fsm/state';
import { ConfigService } from '../services';
export class DummyExecutableAd extends ExecutableAd {
    constructor(protected _configService: ConfigService, protected opportunityInfo: OpportunityInfo) {
        super(opportunityInfo);
    }

    protected async _getOpportunity(): Promise<Xip> {
        return {
            commands: [],
            _id: 'No_Opportunity',
            experienceId: 'No_Opportunity',
            experienceMediaType: 'No_Opportunity',
            exeAdUUID: 'No_Opportunity'
        };
    }

    setStoppingForDummy(): void {
        try {
            this._stoppingReason = AdEventReason.NOT_LOGGED_IN;
            this._fsm.next(Trigger.STATE_STOPPING as TriggerType);
        } catch (error) {
            this._failAd('setStoppingForDummy', error);
        }
    }

    startAd(): void {
        this.setStoppingForDummy();
    }

    initAd(): Promise<void> {
        this.setStoppingForDummy();
        return;
    }

    stopAd(): void {
        this.setStoppingForDummy();
    }

    pauseAd(): void {
        this.setStoppingForDummy();
    }

    resumeAd(): void {
        this.setStoppingForDummy();
    }

    protected _setDummyCommand(): Map<TriggerType, Command[]> {
        // Kept naming of function for TS reasons, we're just hardcoding a simple terminate command
        const triggerToCommandMap = new Map<TriggerType, Command[]>();
        triggerToCommandMap.set(State.STATE_STOPPING as StateType, []);
        return triggerToCommandMap;
    }
}
