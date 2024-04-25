import { activateIfMethodPrefix } from './common.functions';
import { ReplaceOptions, ExecutionContext } from '../types';

export default async function replace(command: ReplaceOptions, context: ExecutionContext): Promise<string> {
    command.from = await activateIfMethodPrefix(command.from, context);
    command.replace = await activateIfMethodPrefix(command.replace, context);
    command.value = await activateIfMethodPrefix(command.value, context);
    const result = command.from.replace(command.replace, command.value);
    return result;
}
