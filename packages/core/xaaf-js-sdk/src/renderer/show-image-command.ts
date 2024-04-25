import { ImageCommandData } from '../executable-ad/commands';
import {
    XaafImageElement,
    XaafImageData,
    XaafAdContainer,
    XaafElementType,
    XaafContainerListener,
    ImageLoadingError,
    XaafImageListener
} from '../executable-ad/elements';
import { CommandModel, CommandReport } from '@xaaf/common';
import { ConfigService } from '../services';
import { ErrorUtils } from '@xaaf/common';
import * as Core from '@xaaf/common';
import { XaafElementCommand } from './xaaf-element-command';

enum State {
    NotReady = 0x0,
    Ready = 0x1,
    Loaded = 0x2,
    Shown = 0x4,
    ReadyLoadedAndShown = 0x7
}

export class ShowImageCommand extends XaafElementCommand<XaafImageElement, XaafImageListener, XaafImageData> {
    private _currentState: State = State.NotReady;
    private _isOnPlayingReported = false;
    private _xaafImageListener: XaafImageListener = {
        onImageLoadingError: (imageLoadingError) => {
            this._handleOnImageLoadingError(imageLoadingError);
        },

        onImageLoaded: () => {
            this._handleOnImageLoaded();
        },

        onImageShown: () => {
            this._handleOnImageShown();
        }
    };

    constructor(commandModel: CommandModel) {
        super(commandModel);
    }

    private _updateAndReturnCurrentState(stateToAdd: State): State {
        this._loggerService.debug(
            `[ShowImageCommand::_updateAndReturnCurrentState] - updating curret state with ${stateToAdd}`
        );
        this._currentState |= stateToAdd;
        return this._currentState;
    }

    protected _setXaafAdContainerElementType(
        xaafAdContainer: XaafAdContainer,
        xaafContainerListener: XaafContainerListener<XaafImageElement>
    ): void {
        xaafAdContainer.setElementType(XaafElementType.Image, xaafContainerListener);
    }

    protected _onXaafElementReady(xaafImageElement: XaafImageElement, commandModel: CommandModel): void {
        this._updateAndReturnCurrentState(State.Ready);
        xaafImageElement.xaafElementListener = this._xaafImageListener;
        xaafImageElement.setData(this._convertToXaafImageData(commandModel.data));
    }

    private _convertToXaafImageData(data: ImageCommandData): XaafImageData {
        const { url, zOrder } = data;
        return { url, zOrder };
    }

    private _handleOnImageLoadingError(imageLoadingError: ImageLoadingError): void {
        try {
            this._loggerService.error(`[ShowImageCommand::_handleOnImageLoadingError] - ${imageLoadingError}`);

            const xaafError = ErrorUtils.exAdError(
                Core.ErrorCode.MediaErrorFailureRenderingMedia,
                `${imageLoadingError.message}, ${imageLoadingError.errorEndPoint}`,
                Core.ErrorSubDomain.ImageViewer,
                imageLoadingError.errorEndPoint
            );
            this._notifyError(xaafError);
        } catch (error) {
            this._loggerService.error(`[ShowImageCommand::_handleOnImageLoadingError] - ${error}`);
            this._notifyExecuteFailure(error, 'ShowImageCommand::_handleOnImageLoadingError');
        }
    }

    private _handleOnImageLoaded(): void {
        try {
            this._loggerService.debug('[ShowImageCommand::_handleOnImageLoaded] - image loaded');
            this._notifyCompleted();
            if (this._updateAndReturnCurrentState(State.Loaded) === State.ReadyLoadedAndShown) {
                this._notifyHandled();
            }
        } catch (error) {
            this._loggerService.error(`[ShowImageCommand::_handleOnImageLoaded] - ${error}`);
            this._notifyExecuteFailure(error, 'ShowImageCommand::_handleOnImageLoaded');
        }
    }

    protected _executeXaafElement(xaafElement: XaafImageElement): void {
        xaafElement.show();
    }

    private async _handleOnImageShown(): Promise<void> {
        try {
            this._loggerService.debug('[ShowImageCommand::_handleOnImageShown] - image shown');
            if (this._updateAndReturnCurrentState(State.Shown) === State.ReadyLoadedAndShown) {
                this._notifyHandled();
                ConfigService.getInstance().playerStartTime = new Date();
                const report: CommandReport = this._commandModel.report;
                if (!this._isOnPlayingReported) {
                    this._loggerService.debug('[ShowImageCommand::_handleOnImageShown] - onPlayingReported');
                    await this._report(report);
                    this._isOnPlayingReported = true;
                }
            }
        } catch (error) {
            this._loggerService.error(`[ShowImageCommand::_handleOnImageShown] - ${error}`);
            this._notifyExecuteFailure(error, 'ShowImageCommand::_handleOnImageShown');
        }
    }

    protected _stopXaafElement(xaafImageElement: XaafImageElement): void {
        xaafImageElement.hide();
        this._handleXaafElementCompleted();
    }
}
