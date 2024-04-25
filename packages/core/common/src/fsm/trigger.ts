import { State } from './state';

export const Trigger = {
    ...State,
    ON_CLICK: 'ON_CLICK'
};

export type TriggerType = keyof typeof Trigger;

export enum FireTriggerMode {
    Pre = 'PRE',
    Post = 'POST',
    Completed = 'COMPLETED'
}
