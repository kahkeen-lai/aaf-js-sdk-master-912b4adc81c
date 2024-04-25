/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommandsDataStructuresCreator } from './commands-data-structures-creator';
import * as Core from '@xaaf/common';
import { ContainerDef } from '@xaaf/common';
import { FireTriggerMode, TriggerType } from '../../fsm/trigger';
import { Command } from '../commands';
import { ReportCommand, ShowVideoCommand, InteractionCommand } from '../../renderer';
import { CommandFireAction, CommandFireTrigger, CommandModel } from '@xaaf/common';

const mockedHttpService: Core.HttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    request: jest.fn(),
    interceptors: jest.fn()
};

describe('CommandsDataStructuresCreator tests', () => {
    let commandsDataStructuresCreatorUnderTest;
    let spiedCreateExecutionTriggerToCommandMapFunction;
    let spiedCreateCommandIdToFireTriggerMapFunction;

    describe('createExecutionTriggerToCommandMap() tests', () => {
        it('createExecutionTriggerToCommandMap() - error occurs - should throw error', () => {
            given_mockedDIDependencies();
            given_commandsDataStructuresCreatorUnderTest();

            try {
                when_createExecutionTriggerToCommandMapIsExecuted_onCommandsDataStructuresCreator(undefined);
            } catch (error) {
                // error was thrown, nothing to really assert here
                expect(true).toBeTruthy();
            }
        });

        it('createExecutionTriggerToCommandMap() - XiP containing one command with one execution trigger - should create a map containing one execution trigger having one command', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/OneCommand_withOneExeTrigger.json'
            );
            given_commandsDataStructuresCreatorUnderTest();

            const executionTriggerToCommandMap = when_createExecutionTriggerToCommandMapIsExecuted_onCommandsDataStructuresCreator(
                opportunityXiPResponse.commands
            );

            then_mapContains_numberOfExecutionTriggers(executionTriggerToCommandMap, 1);
            then_mapContainsExecutionTrigger_withCommandsFromTypes(executionTriggerToCommandMap, 'STATE_STARTED', {
                type: ShowVideoCommand,
                id: 1
            });
        });

        it('createExecutionTriggerToCommandMap() - XiP containing one command with multiple execution triggers - should create a map containing multiple execution triggers having the same command', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/OneCommand_withMultipleExeTriggers.json'
            );
            given_commandsDataStructuresCreatorUnderTest();

            const executionTriggerToCommandMap = when_createExecutionTriggerToCommandMapIsExecuted_onCommandsDataStructuresCreator(
                opportunityXiPResponse.commands
            );

            then_mapContains_numberOfExecutionTriggers(executionTriggerToCommandMap, 2);
            then_mapContainsExecutionTrigger_withCommandsFromTypes(executionTriggerToCommandMap, 'STATE_STARTING', {
                type: ShowVideoCommand,
                id: 1
            });
            then_mapContainsExecutionTrigger_withCommandsFromTypes(executionTriggerToCommandMap, 'STATE_STARTED', {
                type: ShowVideoCommand,
                id: 1
            });
        });

        it('createExecutionTriggerToCommandMap() - XiP containing multiple commands with the same execution trigger - should create a map containing one execution trigger having multiple commands', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/MultipleCommands_withTheSameExeTrigger.json'
            );
            given_commandsDataStructuresCreatorUnderTest();

            const executionTriggerToCommandMap = when_createExecutionTriggerToCommandMapIsExecuted_onCommandsDataStructuresCreator(
                opportunityXiPResponse.commands
            );

            then_mapContains_numberOfExecutionTriggers(executionTriggerToCommandMap, 1);
            then_mapContainsExecutionTrigger_withCommandsFromTypes(
                executionTriggerToCommandMap,
                'STATE_STARTED',
                { type: ShowVideoCommand, id: 1 },
                { type: ReportCommand, id: 2 }
            );
        });

        it('createExecutionTriggerToCommandMap() - XiP containing multiple commands with the different execution trigger - should create a map containing multiple execution triggers having different commands', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/MultipleCommands_withDifferentExeTrigger.json'
            );
            given_commandsDataStructuresCreatorUnderTest();

            const executionTriggerToCommandMap = when_createExecutionTriggerToCommandMapIsExecuted_onCommandsDataStructuresCreator(
                opportunityXiPResponse.commands
            );

            then_mapContains_numberOfExecutionTriggers(executionTriggerToCommandMap, 3);
            then_mapContainsExecutionTrigger_withCommandsFromTypes(executionTriggerToCommandMap, 'STATE_STARTING', {
                type: ShowVideoCommand,
                id: 1
            });
            then_mapContainsExecutionTrigger_withCommandsFromTypes(executionTriggerToCommandMap, 'STATE_STARTED', {
                type: ReportCommand,
                id: 2
            });
            then_mapContainsExecutionTrigger_withCommandsFromTypes(executionTriggerToCommandMap, 'STATE_INTERACTION', {
                type: InteractionCommand,
                id: 3
            });
        });

        function when_createExecutionTriggerToCommandMapIsExecuted_onCommandsDataStructuresCreator(
            commandModels: CommandModel[]
        ): Map<TriggerType, Command[]> {
            return commandsDataStructuresCreatorUnderTest.createExecutionTriggerToCommandMap(commandModels);
        }

        function then_mapContains_numberOfExecutionTriggers(
            executionTriggerToCommandMap: Map<TriggerType, Command[]>,
            numberOfExecutionTriggers: number
        ): void {
            expect(executionTriggerToCommandMap.size).toEqual(numberOfExecutionTriggers);
        }

        function then_mapContainsExecutionTrigger_withCommandsFromTypes(
            executionTriggerToCommandMap: Map<TriggerType, Command[]>,
            executionTrigger: TriggerType,
            ...commandTypes: { type: any; id: number }[]
        ): void {
            const commandsForExecutionTrigger = executionTriggerToCommandMap.get(executionTrigger);

            expect(commandsForExecutionTrigger.length).toEqual(commandTypes.length);
            for (let index = 0; index < commandTypes.length; ++index) {
                expect(commandsForExecutionTrigger[index]).toBeInstanceOf(commandTypes[index].type);
                expect(commandsForExecutionTrigger[index].getCommandModel().id).toEqual(commandTypes[index].id);
            }
        }
    });

    describe('createCommandIdToFireTriggerMap() tests', () => {
        it('createCommandIdToFireTriggerMap() - error occurs - should throw error', () => {
            given_mockedDIDependencies();
            given_commandsDataStructuresCreatorUnderTest();

            try {
                when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(undefined);
            } catch (error) {
                // error was thrown, nothing to really assert here
                expect(true).toBeTruthy();
            }
        });

        it('createCommandIdToFireTriggerMap() - one command with no fire triggers - should create a map containing no commands', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-triggers/OneCommand_withNoFireTriggers.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireTriggerMap = when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireTriggerMap, 0);
        });

        it('createCommandIdToFireTriggerMap() - one command with one PRE fire trigger - should create a map containing one command with only one PRE fire trigger', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-triggers/OneCommand_withOnePREFireTrigger.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            const xipResponseCommand = xipResponseCommands[0];
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireTriggerMap = when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireTriggerMap, xipResponseCommands.length);
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireTriggerMap,
                xipResponseCommand.id,
                1
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'preFireTrigger'
                }
            );
        });

        it('createCommandIdToFireTriggerMap() - one command with one fire trigger of each mode - should create a map containing one command with the correct fire trigger for each mode', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-triggers/OneCommand_withOneFireTriggerOfEachMode.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            const xipResponseCommand = xipResponseCommands[0];
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireTriggerMap = when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireTriggerMap, xipResponseCommands.length);
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireTriggerMap,
                xipResponseCommand.id,
                3
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'preFireTrigger'
                }
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseCommand.id,
                FireTriggerMode.Post,
                {
                    mode: FireTriggerMode.Post,
                    name: 'postFireTrigger'
                }
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseCommand.id,
                FireTriggerMode.Completed,
                {
                    mode: FireTriggerMode.Completed,
                    name: 'completedFireTrigger'
                }
            );
        });

        it('createCommandIdToFireTriggerMap() - multiple commands with multiple fire triggers of each mode - should create a map containing multiple commands with the correct fire triggers for each mode', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-triggers/MultipleCommands_withMultipleFireTriggersOfEachMode.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            const xipResponseFirstCommand = xipResponseCommands[0];
            const xipResponseSecondCommand = xipResponseCommands[1];
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireTriggerMap = when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireTriggerMap, xipResponseCommands.length);
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireTriggerMap,
                xipResponseFirstCommand.id,
                3
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseFirstCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'command1_preFireTrigger1'
                },
                {
                    mode: FireTriggerMode.Pre,
                    name: 'command1_preFireTrigger2'
                }
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseFirstCommand.id,
                FireTriggerMode.Post,
                {
                    mode: FireTriggerMode.Post,
                    name: 'command1_postFireTrigger1'
                },
                {
                    mode: FireTriggerMode.Post,
                    name: 'command1_postFireTrigger2'
                }
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseFirstCommand.id,
                FireTriggerMode.Completed,
                {
                    mode: FireTriggerMode.Completed,
                    name: 'command1_completedFireTrigger1'
                },
                {
                    mode: FireTriggerMode.Completed,
                    name: 'command1_completedFireTrigger2'
                }
            );

            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireTriggerMap,
                xipResponseSecondCommand.id,
                3
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseSecondCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'command2_preFireTrigger1'
                },
                {
                    mode: FireTriggerMode.Pre,
                    name: 'command2_preFireTrigger2'
                }
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseSecondCommand.id,
                FireTriggerMode.Post,
                {
                    mode: FireTriggerMode.Post,
                    name: 'command2_postFireTrigger1'
                },
                {
                    mode: FireTriggerMode.Post,
                    name: 'command2_postFireTrigger2'
                }
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseSecondCommand.id,
                FireTriggerMode.Completed,
                {
                    mode: FireTriggerMode.Completed,
                    name: 'command2_completedFireTrigger1'
                },
                {
                    mode: FireTriggerMode.Completed,
                    name: 'command2_completedFireTrigger2'
                }
            );
        });

        it('createCommandIdToFireTriggerMap() - multiple commands with the same fire trigger - should create a map containing multiple commands with the same fire trigger', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-triggers/MultipleCommands_withTheSameFireTrigger.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            const xipResponseFirstCommand = xipResponseCommands[0];
            const xipResponseSecondCommand = xipResponseCommands[1];

            const commandIdToFireTriggerMap = when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireTriggerMap, xipResponseCommands.length);
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireTriggerMap,
                xipResponseFirstCommand.id,
                1
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseFirstCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'mockedPreFireTrigger'
                }
            );
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireTriggerMap,
                xipResponseSecondCommand.id,
                1
            );
            then_mapContains_commandWithId_havingFireTriggersForMode(
                commandIdToFireTriggerMap,
                xipResponseSecondCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'mockedPreFireTrigger'
                }
            );
        });

        function when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(
            commandModels: CommandModel[]
        ): Map<number, Map<FireTriggerMode, CommandFireTrigger[]>> {
            return commandsDataStructuresCreatorUnderTest.createCommandIdToFireTriggerMap(commandModels);
        }

        function then_mapContains_numberOfCommands(
            commandIdToFireTriggerMap: Map<number, Map<FireTriggerMode, CommandFireTrigger[]>>,
            expectedNumberOfCommands: number
        ): void {
            expect(commandIdToFireTriggerMap.size).toEqual(expectedNumberOfCommands);
        }

        function then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
            commandIdToFireTriggerMap: Map<number, Map<FireTriggerMode, CommandFireTrigger[]>>,
            commandId: number,
            expectedNumberOfFireTriggerModes: number
        ): void {
            expect(commandIdToFireTriggerMap.get(commandId).size).toEqual(expectedNumberOfFireTriggerModes);
        }

        function then_mapContains_commandWithId_havingFireTriggersForMode(
            commandIdToFireTriggerMap: Map<number, Map<FireTriggerMode, CommandFireTrigger[]>>,
            commandId: number,
            fireTriggerMode: FireTriggerMode,
            ...expectedFireTriggers: CommandFireTrigger[]
        ): void {
            const fireTriggerModeToFireTriggersMap = commandIdToFireTriggerMap.get(commandId);
            const fireTriggers = fireTriggerModeToFireTriggersMap.get(fireTriggerMode);

            expect(fireTriggers.length).toEqual(expectedFireTriggers.length);
            for (let index = 0; index < expectedFireTriggers.length; ++index) {
                expect(fireTriggers[index]).toEqual(expectedFireTriggers[index]);
            }
        }
    });

    describe('createCommandIdToFireActionMap() tests', () => {
        it('createCommandIdToFireActionMap() - error occurs - should throw error', () => {
            given_mockedDIDependencies();
            given_commandsDataStructuresCreatorUnderTest();

            try {
                when_createCommandIdToFireActionMapIsExecuted_onCommandsDataStructuresCreator(undefined);
            } catch (error) {
                // error was thrown, nothing to really assert here
                expect(true).toBeTruthy();
            }
        });

        it('createCommandIdToFireActionMap() - one command with no fire actions - should create a map containing no commands', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-actions/command-with-no-fire-action.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireActionMap = when_createCommandIdToFireActionMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireActionMap, 0);
        });

        it('createCommandIdToFireActionMap() - one command with one PRE fire action - should create a map containing one command with only one PRE fire action', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-actions/one-command-with-PRE-fire-action.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            const xipResponseCommand = xipResponseCommands[0];
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireActionMap = when_createCommandIdToFireActionMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireActionMap, xipResponseCommands.length);
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireActionMap,
                xipResponseCommand.id,
                1
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'PRE_ACTION',
                    commandId: 1
                }
            );
        });

        it('createCommandIdToFireActionMap() - one command with one fire action of each mode - should create a map containing one command with the correct fire action for each mode', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-actions/one-command-with-one-fire-action-for-each-mode.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            const xipResponseCommand = xipResponseCommands[0];
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireActionMap = when_createCommandIdToFireActionMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireActionMap, xipResponseCommands.length);
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireActionMap,
                xipResponseCommand.id,
                3
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'PRE_ACTION',
                    commandId: 1
                }
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseCommand.id,
                FireTriggerMode.Post,
                {
                    mode: FireTriggerMode.Post,
                    name: 'POST_ACTION',
                    commandId: 1
                }
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseCommand.id,
                FireTriggerMode.Completed,
                {
                    mode: FireTriggerMode.Completed,
                    name: 'COMPLETED_ACTION',
                    commandId: 1
                }
            );
        });

        it('createCommandIdToFireActionMap() - multiple commands with multiple fire actions of each mode - should create a map containing multiple commands with the correct fire actions for each mode', () => {
            given_mockedDIDependencies();
            const opportunityXiPResponse = given_mockedOpportunityXiPResponse(
                '../../mock/expectations/fire-actions/multiple-commands-with-multiple-fire-actions-for-each-command.json'
            );
            const xipResponseCommands = opportunityXiPResponse.commands;
            const xipResponseFirstCommand = xipResponseCommands[0];
            const xipResponseSecondCommand = xipResponseCommands[1];
            given_commandsDataStructuresCreatorUnderTest();

            const commandIdToFireActionMap = when_createCommandIdToFireActionMapIsExecuted_onCommandsDataStructuresCreator(
                xipResponseCommands
            );

            then_mapContains_numberOfCommands(commandIdToFireActionMap, xipResponseCommands.length);
            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireActionMap,
                xipResponseFirstCommand.id,
                3
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseFirstCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'PRE_ACTION_1',
                    commandId: 2
                },
                {
                    mode: FireTriggerMode.Pre,
                    name: 'PRE_ACTION_2',
                    commandId: 2
                }
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseFirstCommand.id,
                FireTriggerMode.Post,
                {
                    mode: FireTriggerMode.Post,
                    name: 'POST_ACTION_1',
                    commandId: 2
                },
                {
                    mode: FireTriggerMode.Post,
                    name: 'POST_ACTION_2',
                    commandId: 2
                }
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseFirstCommand.id,
                FireTriggerMode.Completed,
                {
                    mode: FireTriggerMode.Completed,
                    name: 'COMPLETED_ACTION_1',
                    commandId: 2
                },
                {
                    mode: FireTriggerMode.Completed,
                    name: 'COMPLETED_ACTION_2',
                    commandId: 2
                }
            );

            then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
                commandIdToFireActionMap,
                xipResponseSecondCommand.id,
                3
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseSecondCommand.id,
                FireTriggerMode.Pre,
                {
                    mode: FireTriggerMode.Pre,
                    name: 'PRE_ACTION_1',
                    commandId: 1
                },
                {
                    mode: FireTriggerMode.Pre,
                    name: 'PRE_ACTION_2',
                    commandId: 1
                }
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseSecondCommand.id,
                FireTriggerMode.Post,
                {
                    mode: FireTriggerMode.Post,
                    name: 'POST_ACTION_1',
                    commandId: 1
                },
                {
                    mode: FireTriggerMode.Post,
                    name: 'POST_ACTION_2',
                    commandId: 1
                }
            );
            then_mapContains_commandWithId_havingFireActionsForMode(
                commandIdToFireActionMap,
                xipResponseSecondCommand.id,
                FireTriggerMode.Completed,
                {
                    mode: FireTriggerMode.Completed,
                    name: 'COMPLETED_ACTION_1',
                    commandId: 1
                },
                {
                    mode: FireTriggerMode.Completed,
                    name: 'COMPLETED_ACTION_2',
                    commandId: 1
                }
            );
        });

        function when_createCommandIdToFireTriggerMapIsExecuted_onCommandsDataStructuresCreator(
            commandModels: CommandModel[]
        ): Map<number, Map<FireTriggerMode, CommandFireTrigger[]>> {
            return commandsDataStructuresCreatorUnderTest.createCommandIdToFireTriggerMap(commandModels);
        }

        function when_createCommandIdToFireActionMapIsExecuted_onCommandsDataStructuresCreator(
            commandModels: CommandModel[]
        ): Map<number, Map<FireTriggerMode, CommandFireAction[]>> {
            return commandsDataStructuresCreatorUnderTest.createCommandIdToFireActionMap(commandModels);
        }

        function then_mapContains_numberOfCommands(
            commandIdToFireMap: Map<number, Map<FireTriggerMode, CommandFireTrigger[]>>,
            expectedNumberOfCommands: number
        ): void {
            expect(commandIdToFireMap.size).toEqual(expectedNumberOfCommands);
        }

        function then_mapContains_commandWithId_havingNumberOfFireTriggerModes(
            commandIdToFireMap: Map<number, Map<FireTriggerMode, CommandFireTrigger[] | CommandFireAction[]>>,
            commandId: number,
            expectedNumberOfFireTriggerModes: number
        ): void {
            expect(commandIdToFireMap.get(commandId).size).toEqual(expectedNumberOfFireTriggerModes);
        }

        function then_mapContains_commandWithId_havingFireTriggersForMode(
            commandIdToFireTriggerMap: Map<number, Map<FireTriggerMode, CommandFireTrigger[]>>,
            commandId: number,
            fireTriggerMode: FireTriggerMode,
            ...expectedFireTriggers: CommandFireTrigger[]
        ): void {
            const fireTriggerModeToFireTriggersMap = commandIdToFireTriggerMap.get(commandId);
            const fireTriggers = fireTriggerModeToFireTriggersMap.get(fireTriggerMode);

            expect(fireTriggers.length).toEqual(expectedFireTriggers.length);
            for (let index = 0; index < expectedFireTriggers.length; ++index) {
                expect(fireTriggers[index]).toEqual(expectedFireTriggers[index]);
            }
        }

        function then_mapContains_commandWithId_havingFireActionsForMode(
            commandIdToFireActionMap: Map<number, Map<FireTriggerMode, CommandFireAction[]>>,
            commandId: number,
            fireTriggerMode: FireTriggerMode,
            ...expectedFireActions: CommandFireAction[]
        ): void {
            const fireTriggerModeToFireActionsMap = commandIdToFireActionMap.get(commandId);
            const fireActions = fireTriggerModeToFireActionsMap.get(fireTriggerMode);

            expect(fireActions.length).toEqual(expectedFireActions.length);
            for (let index = 0; index < expectedFireActions.length; ++index) {
                expect(fireActions[index]).toEqual(expectedFireActions[index]);
            }
        }
    });

    function given_mockedDIDependencies(): void {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.httpService, mockedHttpService);
        Core.InjectionContainer.registerSingleton(
            ContainerDef.commandsDataStructuresCreator,
            CommandsDataStructuresCreator
        );
    }

    function given_mockedOpportunityXiPResponse(mockedOpportunityXiPResponsePath: string): any {
        return require(mockedOpportunityXiPResponsePath);
    }

    function given_commandsDataStructuresCreatorUnderTest(): void {
        commandsDataStructuresCreatorUnderTest = Core.InjectionContainer.resolve<CommandsDataStructuresCreator>(
            ContainerDef.commandsDataStructuresCreator
        );
        jest.spyOn(commandsDataStructuresCreatorUnderTest, 'createExecutionTriggerToCommandMap');
        jest.spyOn(commandsDataStructuresCreatorUnderTest, 'createCommandIdToFireTriggerMap');
    }
});
