import { StateMachine, EventObject, Typestate } from '@xstate/fsm';

import { TriggerType } from './trigger';
import { StateType } from './state';

export interface FSMTrigger extends EventObject {
    type: TriggerType;
}

export interface FSMState extends Typestate<FSMContext> {
    value: StateType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FSMContext = any;

export type SingleOrArray<T> = T[] | T;

export type TriggerTransition = {
    [K in FSMTrigger['type']]?: SingleOrArray<StateMachine.Transition<FSMContext, FSMTrigger>>;
};

export type MachineState = {
    on?: TriggerTransition;
    exit?: SingleOrArray<StateMachine.Action<FSMContext, FSMTrigger>>;
    entry?: SingleOrArray<StateMachine.Action<FSMContext, FSMTrigger>>;
};

export type MachineStates = {
    [key: string]: MachineState;
};
