import { activateIfMethodPrefix, logStatement } from './common.functions';
import { PrintOptions, ExecutionContext } from '../types';

export default async function print(command: PrintOptions, context: ExecutionContext): Promise<void> {
    const value = await activateIfMethodPrefix(command.value, context);
    logStatement('print', `${value}::${JSON.stringify(context)} `);
}
