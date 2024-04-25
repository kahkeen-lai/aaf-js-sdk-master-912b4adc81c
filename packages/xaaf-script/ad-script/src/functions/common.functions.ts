import { AllFunctions } from './index';
import { ContainerDef, InjectionContainer, Logger } from '@xaaf/common';
import { AdScriptFunctionName, ExecutionContext, Variable } from '../types';
import { isAdScriptFunctionName } from '../runner';

export function resolveVariable(varKey: Variable, context: ExecutionContext): any {
    if (context.get(varKey)) {
        return context.get(varKey);
    } else {
        return varKey;
    }
}

export function logStatement(source: string, message: string): void {
    const logger = InjectionContainer.resolve<Logger>(ContainerDef.loggerService);
    logger.info(`[AdScript::${source}] ${message}`);
}
export function storeVariable(varKey: string, value: Variable, context: ExecutionContext): void {
    context.set(varKey, value);
}

export async function activateIfMethodPrefix(value: Variable, context: ExecutionContext): Promise<any> {
    if (typeof value === 'object' && Object.keys(value)[0] && isAdScriptFunctionName(Object.keys(value)[0])) {
        const functionKey = Object.keys(value)[0] as AdScriptFunctionName;
        logStatement(functionKey, JSON.stringify(value[functionKey]));

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return AllFunctions[functionKey].apply(context, [value[functionKey], context]);
    }
    return value;
}

export async function executeInstructionSet(instructionSet: Variable[], context: ExecutionContext): Promise<void> {
    for (const step of instructionSet) {
        const [functionKey] = Object.keys(step) as AdScriptFunctionName[];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await AllFunctions[functionKey].apply(context, [step[functionKey as any], context]);
    }
}

export function extractJSON(str: string): any {
    try {
        return JSON.parse(str);
    } catch (error) {
        return str;
    }
}
