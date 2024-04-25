import * as Core from '@xaaf/common';
import { RendererCommandFactory, Command } from '../executable-ad/commands';
import { EmptyCommand } from './empty-command';
import { CommandModel, CommandName } from '@xaaf/common';
import { ConfigService, ReportService } from '../services';
import { ReportCommand } from './report-command';
import { ErrorUtils } from '@xaaf/common';
import { ShowImageCommand } from './show-image-command';
import { ShowVideoCommand } from './show-video-command';
import { ShowDynamicViewCommand } from './show-dynamic-view-command';
import { StopExperienceCommand } from './stop-experience-command';
import { SqueezeCommand } from './squeeze-command';
import { AdScriptCommand } from './adscript-command';
import { HostRequestCommand } from './host-request-command';
import { InteractionCommand } from './interaction-command';

export class Renderer implements RendererCommandFactory {
    private _configService = ConfigService.getInstance();

    createCommand(commandModel: CommandModel): Command {
        switch (commandModel.commandName) {
            case CommandName.ShowVideo:
                return new ShowVideoCommand(commandModel, this._configService.playerConfiguration);
            case CommandName.ShowImage:
                return new ShowImageCommand(commandModel);
            case CommandName.ReportCommand:
                return new ReportCommand(commandModel);
            case CommandName.ShowDynamicView:
                return new ShowDynamicViewCommand(commandModel);
            case CommandName.StopExperience:
                return new StopExperienceCommand(commandModel);
            case CommandName.Squeeze:
                return new SqueezeCommand(commandModel);
            case CommandName.AdScriptCommand:
                return new AdScriptCommand(commandModel);
            case CommandName.SendRequestToHost:
                return new HostRequestCommand(commandModel);
            case CommandName.InteractionCommand:
                return new InteractionCommand(commandModel);
            default: {
                const unsupportedCommandError = ErrorUtils.exAdError(
                    Core.ErrorCode.UnsupportedCommand,
                    `command ${commandModel.commandName} not supported`,
                    Core.ErrorSubDomain.Xaaba,
                    'Renderer::createCommand'
                );
                ReportService.getInstance().reportError(unsupportedCommandError);
                return new EmptyCommand();
            }
        }
    }
}
