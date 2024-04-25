import { createMachine, interpret, StateMachine } from '@xstate/fsm';
import { TriggerTransition, FSMContext, FSMTrigger, FSMState, MachineStates, MachineState } from './models';
import { State } from './state';
import { Trigger, TriggerType } from './trigger';

export class FSM {
    private _fsmService: StateMachine.Service<FSMContext, FSMTrigger, FSMState>;

    constructor() {
        const machine = createMachine<FSMContext, FSMTrigger, FSMState>({
            initial: State.STATE_CREATED,
            states: {
                ...this._getStates()
            }
        });

        this._fsmService = interpret(machine);
    }

    start(): void {
        this._fsmService.start();
    }

    stop(): void {
        this._fsmService.stop();
    }

    next(trigger: TriggerType): void {
        this._fsmService.send(trigger);
    }

    subscribe(listener: StateMachine.StateListener<StateMachine.State<FSMContext, FSMTrigger, FSMState>>): void {
        this._fsmService.subscribe(listener);
    }

    private _getStates(): MachineStates {
        const initiatingStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_INITIATING]: {
                target: State.STATE_INITIATING
            }
        };

        const loadedStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_LOADED]: {
                target: State.STATE_LOADED
            }
        };

        const startingStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_STARTING]: {
                target: State.STATE_STARTING
            }
        };

        const startedStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_STARTED]: {
                target: State.STATE_STARTED
            }
        };

        const playingStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_PLAYING]: {
                target: State.STATE_PLAYING
            }
        };

        const pausingStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_PAUSING]: {
                target: State.STATE_PAUSING
            }
        };

        const pausedStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_PAUSED]: {
                target: State.STATE_PAUSED
            }
        };

        const resumingStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_RESUMING]: {
                target: State.STATE_RESUMING
            }
        };

        const resumedStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_RESUMED]: {
                target: State.STATE_RESUMED
            }
        };

        const interactionStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_INTERACTION]: {
                target: State.STATE_INTERACTION
            }
        };

        const stoppingStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_STOPPING]: {
                target: State.STATE_STOPPING
            }
        };

        const stoppedStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_STOPPED]: {
                target: State.STATE_STOPPED
            }
        };

        const errorStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_ERROR]: {
                target: State.STATE_ERROR
            }
        };

        const terminatedStateTriggerTransition: TriggerTransition = {
            [Trigger.STATE_TERMINATED]: {
                target: State.STATE_TERMINATED
            }
        };

        const commonTransitions: TriggerTransition[] = [
            interactionStateTriggerTransition,
            stoppingStateTriggerTransition,
            errorStateTriggerTransition
        ];

        const machineStates: MachineStates = {
            [State.STATE_CREATED]: this._createStateTransition([
                ...commonTransitions,
                initiatingStateTriggerTransition
            ]),
            [State.STATE_INITIATING]: this._createStateTransition([
                ...commonTransitions,
                loadedStateTriggerTransition,
                startingStateTriggerTransition
            ]),
            [State.STATE_LOADED]: this._createStateTransition([...commonTransitions, startingStateTriggerTransition]),
            [State.STATE_STARTING]: this._createStateTransition([...commonTransitions, startedStateTriggerTransition]),
            [State.STATE_STARTED]: this._createStateTransition([...commonTransitions, playingStateTriggerTransition]),
            [State.STATE_PLAYING]: this._createStateTransition([...commonTransitions, pausingStateTriggerTransition]),
            [State.STATE_PAUSING]: this._createStateTransition([...commonTransitions, pausedStateTriggerTransition]),
            [State.STATE_PAUSED]: this._createStateTransition([...commonTransitions, resumingStateTriggerTransition]),
            [State.STATE_RESUMING]: this._createStateTransition([...commonTransitions, resumedStateTriggerTransition]),
            [State.STATE_RESUMED]: this._createStateTransition([...commonTransitions, playingStateTriggerTransition]),
            [State.STATE_INTERACTION]: this._createStateTransition([
                stoppingStateTriggerTransition,
                errorStateTriggerTransition
            ]),
            [State.STATE_STOPPING]: this._createStateTransition([
                stoppedStateTriggerTransition,
                errorStateTriggerTransition
            ]),
            [State.STATE_STOPPED]: this._createStateTransition([
                errorStateTriggerTransition,
                terminatedStateTriggerTransition
            ]),
            [State.STATE_ERROR]: this._createStateTransition([terminatedStateTriggerTransition]),
            [State.STATE_TERMINATED]: this._createStateTransition([])
        };

        return machineStates;
    }

    private _createStateTransition(triggerTransitions: TriggerTransition[]): MachineState {
        let transitions: TriggerTransition = {};

        triggerTransitions.forEach((triggerTransition) => {
            transitions = {
                ...transitions,
                ...triggerTransition
            };
        });

        const transionConfig: MachineState = {
            on: transitions
        };

        return transionConfig;
    }
}
