import {
    AdScriptFunction,
    AdScriptFunctionName,
    AdScriptFunctionParameters,
    ExecutionContext,
    FlowStep,
    FunctionInput,
    Method,
    MethodBlock
} from './types';
import { AllFunctions } from './functions';
import { InjectionContainer, ContainerDef, CommandContract, CommandEventType } from '@xaaf/common';
type XaafDynamicViewData = any;
export interface Renderer {
    transform(dynamicView: XaafDynamicViewData, element?: HTMLElement): void;
}

export type ArgumentName = string;
export type MethodName = string;
export type TemplateName = string;

export function isAdScriptFunctionName(val: unknown): val is AdScriptFunctionName {
    return typeof val === 'string' && Object.keys(AllFunctions).includes(val);
}

export interface AdScriptEvent {
    action: CommandEventType;
    name: MethodName;
    args?: AdScriptFunctionParameters;
}

export interface AdScriptCommandData {
    events: AdScriptEvent[];
    methods: Record<MethodName, MethodBlock>;
    templates?: Record<TemplateName, XaafDynamicViewData>;
}

export interface CodeStep {
    adScriptFunction: AdScriptFunction;
    adScriptFunctionParameters: AdScriptFunctionParameters;
}

export interface TriggerData {
    name: string;
}

export class Runner {
    functions = AllFunctions;
    allMethods?: Record<string, MethodBlock>;
    // allTemplates: any;
    domElement: any;
    buildMethods: Record<string, Method> = {};
    context: ExecutionContext = {};
    private _command: CommandContract;

    constructor(command: CommandContract) {
        this._command = command;
    }

    init(xaafData: AdScriptCommandData, renderer?: Renderer, domElement?: unknown): void {
        this.context = InjectionContainer.resolve<Map<string, unknown>>(ContainerDef.executableAdStorageService);

        this.allMethods = xaafData.methods;
        this.context.set('_$renderer', renderer);
        this.context.set('_$domElement', domElement);
        this.context.set('_$templates', xaafData.templates);
        this.buildMethods = {};
        // build the code
        if (this.allMethods) {
            Object.entries(this.allMethods).forEach(([key, methodBlock]) => {
                // build method
                const codeSteps: CodeStep[] = [];

                methodBlock.flow.forEach((flowStep: FlowStep) => {
                    // execute flow step
                    Object.entries(flowStep).forEach(([_functionKey, functionParameters]) => {
                        const functionKey: keyof FlowStep = _functionKey as keyof FlowStep;

                        codeSteps.push({
                            adScriptFunction: this.functions[functionKey],
                            adScriptFunctionParameters: functionParameters
                        });
                    });
                });

                this.buildMethods[`#${key}`] = async (args: AdScriptFunctionParameters) => {
                    methodBlock.input.forEach((input: FunctionInput) => {
                        const functionArgument = args[input];
                        this.context.set(input, functionArgument); // TODO: why set in context + adScriptFunctionParameters?
                    });

                    for (const codeStep of codeSteps) {
                        methodBlock.input.forEach((input: FunctionInput) => {
                            if (args[input]) {
                                codeStep.adScriptFunctionParameters[input] = args[input];
                            } else {
                                console.warn('input variable not found in args');
                            }
                        });

                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        await codeStep.adScriptFunction.apply(this, [
                            codeStep.adScriptFunctionParameters,
                            this.context
                        ]);
                    }
                };
            });
        }
    }

    run(event: AdScriptEvent): void {
        if (this.buildMethods[event.name]) {
            this.buildMethods[event.name]({
                ...event.args
            });
        } else {
            console.warn(`event named: ${event.name} not found in methods ${JSON.stringify(this.buildMethods)}`);
        }
    }
}
