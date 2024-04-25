import { COMMAND_TRIGGER_HANDLER } from '@xaaf/common';
import { FireTriggerOptions, ExecutionContext } from '../types';

export default async function fireTrigger(command: FireTriggerOptions, context: ExecutionContext): Promise<void> {
    context.get(COMMAND_TRIGGER_HANDLER)(command.name);
}
