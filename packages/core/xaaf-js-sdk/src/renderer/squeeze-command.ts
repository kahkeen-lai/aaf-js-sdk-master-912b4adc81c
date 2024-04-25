/* eslint-disable prettier/prettier */
import { Command, SqueezeCommandData } from '../executable-ad/commands';
import { CommandModel } from '@xaaf/common';
import { XaafSqueezeElement, XaafSqueezeListener, SqueezeError, XaafSqueezeData } from '../executable-ad/elements';
import { ErrorUtils } from '@xaaf/common';
import * as Core from '@xaaf/common';

export class SqueezeCommand extends Command {
    private _hostContainer: XaafSqueezeElement;
    private _xaafSqueezeListener: XaafSqueezeListener = {
        onError: (error) => {
            this._handleOnError(error);
        },
        onSqueezeStarted: () => {
            this._handleOnSqueezeStarted();
        },
        onSqueezeEnded: () => {
            this._handleOnSqueezeEnded();
        }
    };

    constructor(commandModel: CommandModel) {
        super();
        this._commandModel = commandModel;
    }

    private _convertToXaafSqueezeData(data: SqueezeCommandData): XaafSqueezeData {
        const videoScale = data.videoScale;
        return {
            ...data,
            videoScale: {
                scaleX: videoScale.scale_x,
                scaleY: videoScale.scale_y,
                pivotX: videoScale.pivot_x,
                pivotY: videoScale.pivot_y
            }
        };
    }

    private _handleOnError(error: SqueezeError): void {
        const executeFailureError: Error = { name: 'Squeeze Animation Error', message: error.message };
        this._loggerService.error(`[SqueezeCommand::_handleOnError] - ${error.message}`);
        this._notifyExecuteFailure(executeFailureError, 'SqueezeCommand::handeOnError');
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private _handleOnSqueezeStarted(): void {
        // This is intentional
    }

    private _handleOnSqueezeEnded(): void {
        this._notifyHandled();
        this._notifyCompleted();
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init(): void {
        // This is intentional
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(): void {
        try {
            this._hostContainer = Core.InjectionContainer.resolve<XaafSqueezeElement>(
                Core.ContainerDef.squeezeCommandService
            );
            this._hostContainer.xaafElementListener = this._xaafSqueezeListener;
            this._hostContainer.setData(this._convertToXaafSqueezeData(this._commandModel.data));
            this._hostContainer.squeeze();
        } catch (error) {
            this._loggerService.error(
                '[SqueezeCommand::execute] - could not get hostContainer view to execute squeeze'
            );
            const xaafError = ErrorUtils.sdkError(
                Core.ErrorCode.HostInvalidResourceError,
                'Cannot get host container',
                undefined,
                'SquezeCommand::execute'
            );
            this._notifyError(xaafError);
        }
    }

    stop(): void {
        this._loggerService.info('SqueezeCommand::stop');
    }


}
