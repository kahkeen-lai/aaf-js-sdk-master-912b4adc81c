import { CommandFireAction, CommandFireTrigger, CommandModel } from '@xaaf/common';
import { FireTriggerMode, TriggerType } from '../../fsm/trigger';
import { Command, RendererCommandFactory } from '../commands';
import { Renderer } from '../../renderer';
import { LoggerService } from '../../services/logger-service';
import { ContainerDef, InjectionContainer } from '@xaaf/common';

export const enum CommandFireType {
    Trigger = 'Trigger',
    Action = 'Action'
}

export type CommandFireCollection = CommandFireTrigger[] | CommandFireAction[];

export class CommandsDataStructuresCreator {
    private _commandFactory: RendererCommandFactory = new Renderer();

    private get _loggerService(): LoggerService {
        return InjectionContainer.resolve<LoggerService>(ContainerDef.loggerService);
    }

    createExecutionTriggerToCommandMap(commandModels: CommandModel[]): Map<TriggerType, Command[]> {
        const triggerToCommandMap = new Map<TriggerType, Command[]>();
        try {
            commandModels.forEach((commandModel: CommandModel) => {
                commandModel.executionTriggers.forEach((trigger) => {
                    const prevCommands: Command[] = triggerToCommandMap.get(trigger.trigger) || [];
                    const newCommand = this._commandFactory.createCommand(commandModel);
                    triggerToCommandMap.set(trigger.trigger, [...prevCommands, newCommand]);
                });
            });

            return triggerToCommandMap;
        } catch (error) {
            this._loggerService.error('[CommandsDataStructuresCreator::createExecutionTriggerToCommandMap]', error);
            throw error;
        }
    }

    private _createCommandIdToFireMap(
        commandModels: CommandModel[],
        fireType: CommandFireType
    ): Map<number, Map<FireTriggerMode, CommandFireCollection>> {
        const commandIdToFireMap = new Map<number, Map<FireTriggerMode, CommandFireCollection>>();
        try {
            commandModels.forEach((commandModel: CommandModel): void => {
                const fireCollection: CommandFireTrigger[] | CommandFireAction[] = this._extractCommandFireCollection(
                    commandModel,
                    fireType
                );
                if (this.isEmpty(fireCollection)) {
                    this._loggerService.debug(
                        `[CommandsDataStructuresCreator::createCommandIdToFireMap] command with id ${commandModel.id} has no fire ${fireType}`
                    );
                    return;
                }

                const fireTriggerModeToFireMap =
                    commandIdToFireMap.get(commandModel.id) || new Map<FireTriggerMode, CommandFireCollection>();

                fireCollection.forEach((fireModel: CommandFireTrigger | CommandFireAction): void => {
                    const fireCollectionForFireTriggerMode = fireTriggerModeToFireMap.get(fireModel.mode) || [];

                    // type is either CommandFireTrigger and assigned to CommandFireTrigger[]
                    // or CommandFireAction and assigned to CommandFireAction[]
                    // TODO: rewrite with better types
                    fireCollectionForFireTriggerMode.push(fireModel as CommandFireTrigger & CommandFireAction); // NOSONAR
                    this._loggerService.debug(
                        `[CommandsDataStructuresCreator::createCommandIdToFireMap] added ${fireModel.mode} fire ${fireType} named ${fireModel.name} for command with id ${commandModel.id}`
                    );

                    fireTriggerModeToFireMap.set(fireModel.mode, fireCollectionForFireTriggerMode);
                });

                commandIdToFireMap.set(commandModel.id, fireTriggerModeToFireMap);
            });

            return commandIdToFireMap;
        } catch (error) {
            this._loggerService.error(`[CommandsDataStructuresCreator::createCommandIdToFire${fireType}Map]`, error);
            throw error;
        }
    }

    private _extractCommandFireCollection(
        commandModel: CommandModel,
        fireType: CommandFireType
    ): CommandFireCollection {
        switch (fireType) {
            case CommandFireType.Trigger: {
                return commandModel.fireTriggers;
            }
            case CommandFireType.Action: {
                return commandModel.fireActions;
            }
        }
    }

    createCommandIdToFireTriggerMap(
        commandModels: CommandModel[]
    ): Map<number, Map<FireTriggerMode, CommandFireTrigger[]>> {
        return this._createCommandIdToFireMap(commandModels, CommandFireType.Trigger);
    }

    createCommandIdToFireActionMap(
        commandModels: CommandModel[]
    ): Map<number, Map<FireTriggerMode, CommandFireAction[]>> {
        return this._createCommandIdToFireMap(commandModels, CommandFireType.Action) as Map<
            number,
            Map<FireTriggerMode, CommandFireAction[]>
        >;
    }

    createCommandIdToCommandMap(commands: Command[]): Map<number, Command> {
        const commandIdToCommandMap = new Map<number, Command>();

        for (const command of commands) {
            const commandId = command.getCommandModel().id;
            commandIdToCommandMap.set(commandId, command);
        }

        return commandIdToCommandMap;
    }

    isEmpty(arr: unknown[]): boolean {
        return !arr || arr.length === 0;
    }
}

InjectionContainer.registerSingleton(ContainerDef.commandsDataStructuresCreator, CommandsDataStructuresCreator);
