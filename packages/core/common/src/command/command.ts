import { CommandModel } from './xip';
import { ErrorCode } from '../models/error';

export type ExecutableAdRequestDelegate = (
    request: string,
    requestArguments: Map<string, any>,
    callback: (error?: Error) => void
) => void;
export interface CommandContract {
    onLoad?: () => void;
    handleHostError?: (errorCode: ErrorCode, errorEventMessage?: string) => void;
    handleHostListener?: (delegate: ExecutableAdRequestDelegate) => void;
    getCommandModel(): CommandModel;
}
export const COMMAND_TRIGGER_HANDLER = '_$commandTriggerHandler';
