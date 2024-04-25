import { executeInstructionSet, resolveVariable } from './common.functions';
import { ChooseOptions, ExecutionContext } from '../types';

export default async function choose(command: ChooseOptions, context: ExecutionContext): Promise<void> {
    const resolveValue = resolveVariable(command.value, context);
    for (const _case of Object.keys(command.cases)) {
        if (resolveValue === _case) {
            await executeInstructionSet(command.cases[_case], context);
        }
    }
}
