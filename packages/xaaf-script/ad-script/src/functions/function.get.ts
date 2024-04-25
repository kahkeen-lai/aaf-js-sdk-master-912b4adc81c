import dotProp from 'dot-prop';
import { logStatement } from './common.functions';
import { GetOptions, ExecutionContext } from '../types';

export default async function get(command: GetOptions, context: ExecutionContext): Promise<unknown> {
    if (command && command.name) {
        logStatement('get', `${command.name} `);
        if (command.name && command.name.indexOf('.') > -1) {
            const arr = command.name.split('.');
            const itemKey = arr.splice(0, 1);
            if (itemKey) {
                const storedObject = context.get(itemKey[0]);
                const resolvedValue = dotProp.get(storedObject, arr.join('.'));
                logStatement('get-resolved', `${resolvedValue} `);
                return resolvedValue;
            } else {
                logStatement('invalid syntax', `${command.name} `);
            }
        }
        return context.get(command.name);
    }
}
