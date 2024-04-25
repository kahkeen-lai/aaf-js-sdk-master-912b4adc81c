import { activateIfMethodPrefix, logStatement } from './common.functions';
import { SetOptions, ExecutionContext } from '../types';

export default async function set(command: SetOptions, context: ExecutionContext): Promise<void> {
    if (command.value && command.name) {
        context.set(command.name, await activateIfMethodPrefix(command.value, context));
        logStatement('set', `${command.name}::${JSON.stringify(command.value)} `);
    }
}
