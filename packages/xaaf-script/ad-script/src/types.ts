import { ConditionBranch } from './functions/function.condition';
import { AllFunctions } from './functions';

export type AdScriptFunctionName = keyof typeof AllFunctions;
export type FlowStep = Record<AdScriptFunctionName, AdScriptFunctionParameters>;
export type FunctionInput = keyof AdScriptFunctionParameters; // TODO: some examples use named arguments not in type
export type ExecutionContext = Record<string, any>;
export type Variable = Record<string, any> | string | any;
export type AdScriptFunction = typeof AllFunctions[keyof typeof AllFunctions];
export type AdScriptFunctionParameters = Parameters<AdScriptFunction>[0];
export type NamedArgument = string; // e.g.: "media_item_id"

export interface MethodBlock {
    input: FunctionInput[];
    flow: FlowStep[];
}

export type Method = (arg1?: any, arg2?: any, arg3?: any) => void;

export interface ReplaceOptions {
    replace: string;
    value: string;
    from: string;
}

export interface SetOptions {
    name: string;
    value: Variable;
}

export interface DatabindOptions {
    templateName: string;
    data: Record<string, unknown> | string;
    take: number;
}

export interface GetDataOptions {
    source: string;
    options: Record<string, unknown>;
}

export interface ChooseOptions {
    value: Variable;
    cases: any;
}

export interface ConditionOptions extends ConditionBranch {
    conditions: string;
}

export interface FireTriggerOptions {
    mode: string;
    name: string;
    id: string;
}

export interface GetOptions {
    name: string;
}

export interface PrintOptions {
    value: Variable;
}
