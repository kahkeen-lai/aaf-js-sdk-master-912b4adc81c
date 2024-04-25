import { VideoCommandData } from '../executable-ad/commands';
import {
    PlayerError,
    XaafVideoData,
    BooleanVideoOptions,
    XaafVideoElement,
    XaafVideoListener,
    XaafAdContainer,
    XaafContainerListener,
    XaafElementType,
    Miliseconds,
    Seconds
} from '../executable-ad/elements';
import {
    PlayerConfiguration,
    ErrorCode,
    ErrorSubDomain,
    AdInfoType,
    Reporter,
    ReportType,
    ErrorUtils,
    AssertUtils,
    CommandModel,
    CommandPlaybackReport,
    CommandReport,
    InjectionContainer,
    ContainerDef
} from '@xaaf/common';
import { ConfigService, ReportService } from '../services';
import { TriggerType } from '../fsm/trigger';
import { DateHelper } from '../utils/date-helper';
import { XaafElementCommand } from './xaaf-element-command';
import { StateType } from '../fsm/state';

export interface PositionSecReport {
    positionSec: Seconds;
    isReported: boolean;
}

export enum BufferStopReason {
    bufferEnd = 'buffer_end',
    adStopped = 'ad_stopped'
}

export const enum ShowVideoFireAction {
    Play = 'PLAY',
    Stop = 'STOP'
}

export class ShowVideoCommand extends XaafElementCommand<XaafVideoElement, XaafVideoListener, XaafVideoData>
    implements XaafVideoListener {
    private _stopRequested: boolean = false;
    private readonly _quartilesArray: PositionSecReport[];
    // private _lastQuartile: PositionSecReport;
    private _isOnPlayingReported: boolean = false;

    private _xaafVideoElement: XaafVideoElement;
    private _videoDuration: Miliseconds;
    private _videoRepeatCount: number = 1;
    private _remainingRepeatCount: number = 1;
    private _bufferingStartTime: number = 0;
    private _bufferForPlayback: Miliseconds;
    private _bufferPollInterval: Miliseconds;
    private _bufferTimeoutId;
    private _bufferIntervalId;

    constructor(commandModel: CommandModel, private _playerConfig: PlayerConfiguration) {
        super(commandModel);
        this._quartilesArray = [];
        // this._lastQuartile = {
        //     positionSec: 0,
        //     isReported: false
        // };
        this._bufferForPlayback = _playerConfig?.bufferForPlayback ?? 2500;
        this._bufferPollInterval = _playerConfig?.bufferPollInterval ?? 1000;
        this._getQuartiles();
    }

    protected _setXaafAdContainerElementType(
        xaafAdContainer: XaafAdContainer,
        xaafContainerListener: XaafContainerListener<XaafVideoElement>
    ): void {
        xaafAdContainer.setElementType(XaafElementType.Video, xaafContainerListener);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _onXaafElementReady(xaafVideoElement: XaafVideoElement, commandModel: CommandModel): void {
        this._xaafVideoElement = xaafVideoElement;
        xaafVideoElement.xaafElementListener = this;

        if (typeof commandModel.data !== 'string') {
            const videoData = this._convertToXaafVideoData(commandModel.data);
            xaafVideoElement.setData(videoData);
        } else {
            // if is not a key string - we buffer on init (only on execute)
            this._loggerService.verbose(`no data to start buffering, data key: ${commandModel.data}`);
        }
    }

    private static _parseBooleanVideoOptions({
        transparent = false,
        autoplay = true,
        muted = true,
        preload = false,
        videoOptions = []
    }: VideoCommandData): BooleanVideoOptions {
        /*
         * boolean options in XiP < 5.0.0 are retrieved from videoOptions string[]
         * for backwards compatibility we still parse them
         */
        const videoOptionsMap: Record<string, boolean> = {};
        videoOptions.forEach((videoOption: string) => {
            videoOptionsMap[videoOption] = true;
        });

        return {
            transparent,
            autoplay,
            muted,
            preload,
            ...videoOptionsMap
        };
    }

    private _convertToXaafVideoData(videoCommandData: VideoCommandData): XaafVideoData {
        const { videoRepeatCount = 1, url, zOrder } = videoCommandData;
        const { minBuffer, maxBuffer } = this._playerConfig;
        const booleanVideoOptions: BooleanVideoOptions = ShowVideoCommand._parseBooleanVideoOptions(videoCommandData);

        /**
         * changing invalid values to valid values would create legal problems with duration and quartiles reporting
         * */
        AssertUtils.assertIsNumber(videoRepeatCount);
        AssertUtils.assert(videoRepeatCount > 0, `videoRepeatCount is an invalid value: ${videoRepeatCount}`);
        this._videoRepeatCount = videoRepeatCount;
        this._remainingRepeatCount = videoRepeatCount;

        return {
            url,
            ...booleanVideoOptions,
            buffer: { minBuffer, maxBuffer },
            zOrder,
        };
    }

    protected async _executeXaafElement(xaafVideoElement: XaafVideoElement): Promise<void> {
        // if data is a key, get value from executableAdStorageService
        if (typeof this._commandModel.data === 'string') {
            this._xaafAdContainer.setElementType(XaafElementType.Video, this._xaafContainerListener); // <- creates new xaafVideoElement
            const sharedStorage = InjectionContainer.resolve<Map<string, unknown>>(
                ContainerDef.executableAdStorageService
            );
            const alternativeData = sharedStorage.get(this._commandModel.data);
            this._commandModel.data = alternativeData[0] as VideoCommandData;
            const videoData = this._convertToXaafVideoData(this._commandModel.data as VideoCommandData);
            this._xaafVideoElement.setData(videoData);
            // only now player will start buffering
        }

        await this._playWhenReady(xaafVideoElement);
    }

    protected async _stopXaafElement(xaafVideoElement: XaafVideoElement): Promise<void> {
        this._stopRequested = true;
        xaafVideoElement.stop();
        this._handleXaafElementCompleted();
        await this._clearBufferTimeout(BufferStopReason.adStopped);
    }

    private _getCommandPlayedTime(currentTime: Miliseconds): Miliseconds {
        AssertUtils.assert(
            this._videoDuration,
            'video duration not provided by the player, xaafVideoElement should call onDurationChanged(duration) before playback'
        );
        AssertUtils.assertIsNumber(this._videoDuration);

        const currentLoop: number = this._videoRepeatCount - this._remainingRepeatCount;
        const loopDuration: Miliseconds = currentLoop * this._videoDuration;
        return loopDuration + currentTime;
    }

    private async _isBufferForPlaybackReached(): Promise<boolean> {
        const currentBuffer: number = await this._xaafVideoElement?.getCurrentBuffer();
        const requiredBuffer: number = Math.min(this._bufferForPlayback, this._videoDuration);
        return currentBuffer >= requiredBuffer;
    }

    private _handleFirstPlay(): void {
        this._notifyHandled();
        if (this._commandModel.data?.autoplay !== false) {
            this._xaafVideoElement.play();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async _playWhenReady(_xaafVideoElement: XaafVideoElement): Promise<void> {
        if (await this._isBufferForPlaybackReached()) {
            this._loggerService.info('[ShowVideoCommand::_playWhenReady] playing');
            this._handleFirstPlay();
        } else {
            const { player: timeout } = ConfigService.getInstance().timeouts;
            try {
                await this._waitForBuffer(timeout);
                if (!this._stopRequested) {
                    this._handleFirstPlay();
                }
            } catch (error) {
                this._loggerService.error(`[ShowVideoCommand::_playWhenReady] ${error}`);
                if (error === 'timeout') {
                    this._createPlayerTimeoutError(timeout, ErrorSubDomain.Player);
                } else {
                    this._notifyExecuteFailure(error, 'ShowVideoCommand::stop');
                }
            }
        }
    }

    private _clearBufferInterval(): void {
        if (this._bufferIntervalId) {
            clearInterval(this._bufferIntervalId);
            this._bufferIntervalId = null;
        }
    }

    private async _awaitBufferForPlaybackReached(timeout: number, timeoutEnabled: boolean): Promise<void> {
        let playerTimeoutId;

        return new Promise((resolve, reject) => {
            if (timeoutEnabled) {
                playerTimeoutId = setTimeout(() => {
                    this._clearBufferInterval();
                    reject('timeout');
                }, timeout);
            }

            this._bufferIntervalId = setInterval(async () => {
                if (await this._isBufferForPlaybackReached()) {
                    this._clearBufferInterval();
                    clearTimeout(playerTimeoutId);
                    resolve();
                }
            }, this._bufferPollInterval);
        });
    }

    private async _waitForBuffer(timeout: number): Promise<void> {
        this._loggerService.info(
            `[ShowVideoCommand::_waitForBuffer] buffer for playback not reached, waiting with player timeout: ${timeout}ms`
        );
        this._markBufferingStartTime();
        const isTimeoutEnabled = this._featureFlagsService.playerTimeoutEnabled;
        await this._awaitBufferForPlaybackReached(timeout, isTimeoutEnabled);
        await this._reportBufferEvent(BufferStopReason.bufferEnd);
        this._loggerService.info('[ShowVideoCommand::_waitForBuffer] buffer reached');
    }

    private _getQuartiles(): void {
        if (this._commandModel.playback_reports) {
            this._commandModel.playback_reports.forEach((event: CommandPlaybackReport) => {
                const condition: PositionSecReport = { positionSec: event.positionSec, isReported: false };
                if (this._quartilesArray.indexOf(condition) < 0) {
                    this._quartilesArray.push(condition);
                }
            });
        }
        // this._lastQuartile = this._firstThreeQuartilesArray.pop();
        this._loggerService.info(`ShowVideoCommand:_getQuartiles -> ${JSON.stringify(this._quartilesArray)}`);
    }

    private async _reportQ(quartileElement: PositionSecReport, currentPlayerTime: Seconds): Promise<void> {
        this._loggerService.info(`ShowVideoCommand:_reportQ (quartilesArray)-> ${currentPlayerTime}`);
        let playbackReport: CommandPlaybackReport;
        if (this._commandModel.playback_reports) {
            playbackReport = this._commandModel.playback_reports.find((eventSection) =>
                DateHelper.between(eventSection.positionSec, currentPlayerTime)
            );
        }

        if (playbackReport) {
            await this._report(playbackReport);
            quartileElement.isReported = true;
        } else {
            this._loggerService.error(`ShowVideoCommand:_reportQ (error reporting) -> ${playbackReport}`);
        }
    }

    private _reportQuartiles(playerTime: Miliseconds): void {
        const currentPlayerTime: Seconds = Math.floor(playerTime / 1000);
        this._quartilesArray.forEach(async (quartileElement: PositionSecReport) => {
            const isInRange = DateHelper.between(quartileElement.positionSec, currentPlayerTime);
            if (isInRange && !quartileElement.isReported) {
                await this._reportQ(quartileElement, currentPlayerTime);
            }
        });
    }

    private _getTimestamp(): number {
        return Date.now();
    }

    private _markBufferingStartTime(): void {
        this._bufferingStartTime = this._getTimestamp();
    }

    private _getBufferingTime(): number {
        const bufferingTime = this._getTimestamp() - this._bufferingStartTime;
        this._bufferingStartTime = 0;
        return bufferingTime;
    }

    private _createPlayerTimeoutError(timeout: number, type: ErrorSubDomain.Player | ErrorSubDomain.Buffer): void {
        const timeoutError = ErrorUtils.exAdError(
            ErrorCode.ResourceTimeout,
            `${type} timeout reached: ${timeout}ms`,
            type
        );
        this._loggerService.error(`[ShowVideoCommand::_createPlayerTimeoutError] ${timeoutError.comment}`);
        this._notifyError(timeoutError);
    }

    private async _reportBufferEvent(reason: BufferStopReason): Promise<void> {
        const _reportService: Reporter = ReportService.getInstance();
        const bufferingTime = this._getBufferingTime();
        await _reportService.report(ReportType.AdInfo, {
            type: AdInfoType.Buffer,
            reason,
            bufferingTime
        });
    }

    onPlayerError({ message, errorEndPoint }: PlayerError): void {
        try {
            this._loggerService.error(`[ShowVideoCommand::onPlayerError] ${message} ${errorEndPoint}`);

            const xaafError = ErrorUtils.exAdError(
                ErrorCode.MediaErrorFailureRenderingMedia,
                `${message}, ${errorEndPoint}`,
                ErrorSubDomain.Player,
                errorEndPoint
            );
            this._notifyError(xaafError);
        } catch (error) {
            this._loggerService.error(`[ShowVideoCommand::onPlayerError] ${error}`);
        }
    }

    private async _onCommandCompleted(): Promise<void> {
        try {
            this._loggerService.info('[ShowVideoCommand::onPlaybackComplete]');
            this._notifyCompleted();
            // let playbackReport: CommandPlaybackReport;
            // if (this._commandModel.playback_reports) {
            //     playbackReport = this._commandModel.playback_reports.find((eventSection) =>
            //         DateHelper.between(eventSection.positionSec, this._lastQuartile.positionSec)
            //     );
            // }
            // if (playbackReport) {
            //     await this._report(playbackReport);
            //     this._lastQuartile.isReported = true;
            // } else {
            //     this._loggerService.error(`ShowVideoCommand:onPlaybackComplete (error reporting) -> ${playbackReport}`);
            // }
        } catch (error) {
            this._loggerService.error(`ShowVideoCommand:onPlaybackComplete ${error}`);
        }
    }

    onPlaybackComplete(): void {
        this._remainingRepeatCount--;
        if (this._remainingRepeatCount > 0) {
            if (this._xaafVideoElement) {
                this._xaafVideoElement.rewind();
                this._xaafVideoElement.play();
            }
        } else {
            this._onCommandCompleted();
        }
    }

    onBufferingStarted(): void {
        try {
            this._loggerService.info('[ShowVideoCommand::onBufferingStarted]');
            this._markBufferingStartTime();

            if (this._featureFlagsService.bufferTimeoutEnabled) {
                const { buffer: timeout } = ConfigService.getInstance().timeouts;
                this._bufferTimeoutId = setTimeout(() => {
                    this._createPlayerTimeoutError(timeout, ErrorSubDomain.Buffer);
                }, timeout);
                this._loggerService.warning(
                    `[ShowVideoCommand::onBufferingStarted] started buffer timeout ${timeout} ms, id: ${this._bufferTimeoutId}`
                );
            }
        } catch (error) {
            this._loggerService.error(`[ShowVideoCommand::onBufferingStarted] ${error}`);
        }
    }

    async onBufferingEnded(): Promise<void> {
        try {
            this._loggerService.info('[ShowVideoCommand::onBufferingEnded]');
            await this._clearBufferTimeout(BufferStopReason.bufferEnd);
        } catch (error) {
            this._loggerService.error(`[ShowVideoCommand::onBufferingEnded] ${error}`);
        }
    }

    async onPlaying(): Promise<void> {
        try {
            this._loggerService.info('[ShowVideoCommand::onPlaying]');
            ConfigService.getInstance().playerStartTime = new Date();
            const report: CommandReport = this._commandModel.report;
            if (!this._isOnPlayingReported) {
                await this._report(report);
                this._isOnPlayingReported = true;
            }
        } catch (error) {
            this._loggerService.error(`[ShowVideoCommand::onPlaying] ${error}`);
        }
    }

    onCurrentTimeUpdated(time: number): void {
        const commandPlayedTime: Miliseconds = this._getCommandPlayedTime(time);
        try {
            this._loggerService.verbose(
                `[ShowVideoCommand::onCurrentTimeUpdated] -> ${time}, command time: ${commandPlayedTime}ms`
            );
            if (this._commandModel.playback_reports) {
                this._reportQuartiles(commandPlayedTime);
            }
        } catch (error) {
            this._loggerService.error(`[ShowVideoCommand::onCurrentTimeUpdated] ${error}`);
        }
    }

    onDurationChanged(duration: Miliseconds): void {
        this._loggerService.info(`[ShowVideoCommand::onDurationChanged] new video duration set ${duration}`);
        this._videoDuration = duration;
    }

    async onFinalized(): Promise<void> {
        try {
            await this._clearBufferTimeout(BufferStopReason.adStopped);
        } catch (error) {
            this._loggerService.verbose(`[ShowVideoCommand::onFinalized] ${error}`);
        }
    }

    private async _clearBufferTimeout(reason: BufferStopReason): Promise<void> {
        if (this._bufferTimeoutId) {
            clearTimeout(this._bufferTimeoutId);
            this._loggerService.info(
                `[ShowVideoCommand::onBufferingEnded] cleared buffer timeout id: ${this._bufferTimeoutId}, reason: ${reason}`
            );
            await this._reportBufferEvent(reason);
            this._bufferTimeoutId = null;
        }
    }

    handleAction(action: string, state: StateType, stateInstanceHistory: Set<TriggerType>): void {
        try {
            this._loggerService.info(`[Command:handleAction] ${this._commandModel.commandName} action ${action}`);
            if (!this._xaafElement) {
                this._loggerService.error('[ShowVideoCommand::handleAction] - AAF element does not exist');
                this._notifyExecuteFailure(new Error('AAF element does not exist'), 'ShowVideoCommand::handleAction');
                return;
            }

            switch (action) {
                case ShowVideoFireAction.Play: {
                    this._loggerService.verbose(
                        `state: ${state}, stateInstanceHistory: ${JSON.stringify(stateInstanceHistory)}`
                    );
                    this._xaafVideoElement.play();
                    break;
                }
                case ShowVideoFireAction.Stop: {
                    this._xaafElement.stop();
                    this._clearBufferTimeout(BufferStopReason.adStopped);
                    break;
                }
                default: {
                    const unsupportedAction = ErrorUtils.exAdError(
                        ErrorCode.MissingResource,
                        `action ${action} is not supported in ShowVideoCommand`,
                        null
                    );
                    this._loggerService.error(`[ShowVideoCommand::handleAction] action ${action} is not supported`);
                    this._notifyError(unsupportedAction);
                    break;
                }
            }
        } catch (error) {
            const handleActionError = ErrorUtils.exAdError(
                ErrorCode.GeneralError,
                `ShowVideoCommand::handleAction error during ${action} action`,
                null
            );
            this._loggerService.error(`[ShowVideoCommand::handleAction] - ${error}`);
            this._notifyError(handleActionError);
        }
    }
}
