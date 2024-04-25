import { activateIfMethodPrefix, executeInstructionSet, extractJSON } from './common.functions';
import { ConditionOptions, ExecutionContext } from '../types';

export interface ConditionBranch {
    then: Record<string, any>[];
    else: Record<string, any>[];
}

const enum TrueFalse {
    then = 'then',
    else = 'else'
}
export type ConditionOption = Record<string, any>;

export default async function condition(command: ConditionOptions, context: ExecutionContext): Promise<void> {
    let isConditionResult = true;
    const splitCondition: any[] = command.conditions.substring(1, command.conditions.length - 1).split(' '); // 3 items
    const valueA = await activateIfMethodPrefix(extractJSON(splitCondition[0]), context);
    const operator = splitCondition[1];
    const valueB = await activateIfMethodPrefix(extractJSON(splitCondition[2]), context);
    isConditionResult = isConditionResult && testCondition(valueA, valueB, operator);

    const branch = isConditionResult ? TrueFalse.then : TrueFalse.else;
    await executeInstructionSet(command[branch], context);
}

function testCondition(operand1: any, operand2: any, operator: any) {
    // try to verify numbers;
    const operand1Number = Number(operand1);
    const operand2Number = Number(operand2);

    if (!Number.isNaN(operand1Number)) {
        operand1 = operand1Number;
    }
    if (!Number.isNaN(operand2Number)) {
        operand2 = operand2Number;
    }

    switch (operator) {
        case '==':
            return operand1 === operand2;
        case '!=':
            return operand1 !== operand2;
        case '>':
            return operand1 > operand2;
        case '>=':
            return operand1 >= operand2;
        case '<':
            return operand1 < operand2;
        case '<=':
            return operand1 <= operand2;
    }
    return false;
}
