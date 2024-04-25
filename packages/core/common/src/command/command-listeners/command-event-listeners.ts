import { CommandEvent } from '../command-events';

export type CommandEventListener = (commandEvent: CommandEvent) => void;
