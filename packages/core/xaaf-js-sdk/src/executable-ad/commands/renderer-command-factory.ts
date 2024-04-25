import { Command } from './command';
import { CommandModel } from '@xaaf/common';

export interface RendererCommandFactory {
    createCommand(model: CommandModel): Command;
}
