/* eslint-disable prettier/prettier */
import { XaafAdContainer, XaafElementType, XaafContainerListener } from '../executable-ad/elements';
import { CommandModel, CommandReport, StateType, TriggerType } from '@xaaf/common';
import { XaafElementCommand } from './xaaf-element-command';
import { XaafDynamicElement, XaafError, XaafDynamicViewData, XaafDynamicElementListener, InjectionContainer, ContainerDef } from '@xaaf/common';

enum State {
    NotReady = 0x0,
    Ready = 0x1,
    Loaded = 0x2,
    Shown = 0x4,
    ReadyLoadedAndShown = 0x7
}

export class ShowDynamicViewCommand
    extends XaafElementCommand<XaafDynamicElement, XaafDynamicElementListener, XaafDynamicViewData>
    implements XaafDynamicElementListener {
    private _currentState: State = State.NotReady;
    constructor(commandModel: CommandModel) {
        super(commandModel);
    }

    async onLoad(): Promise<void> {
        this._notifyHandled();
        // this._notifyCompleted();
        const report: CommandReport = this._commandModel.report;
        await this._report(report);
    }

    init(xaafAdContainer: XaafAdContainer): void {
        try {
            this._xaafAdContainer = xaafAdContainer;
        } catch (error) {
            this._loggerService.error(`[XaafElementCommand::init] - ${error}`);
            this._notifyExecuteFailure(error, 'XaafElementCommand::init');
        }
    }

    execute(xaafAdContainer: XaafAdContainer, state: StateType, stateInstanceHistory: Set<TriggerType>): void {
        try {
            this._loggerService.verbose(`state: ${state}, stateInstanceHistory: ${JSON.stringify(stateInstanceHistory)}`);
            this._setXaafAdContainerElementType(this._xaafAdContainer, this._xaafContainerListener);
        } catch (error) {
            this._loggerService.error(`[XaafElementCommand::execute] - ${error}`);
            this._notifyExecuteFailure(error, 'XaafElementCommand::execute');
        }
    }

    async onError(error: XaafError): Promise<void> {
        this._notifyError(error);
    }

    onCompleted(shouldStop: boolean): void {
        this._handleXaafElementCompleted(shouldStop);
    }

    onCommandError(error: XaafError): void {
        try {
            this._loggerService.error(`[ShowDynamicViewCommand::onCommandError] ${error.message} ${error.errorCode}`);
            this._notifyError(error);
        } catch (error_) {
            this._loggerService.error(`[ShowDynamicViewCommand::onCommandError] ${error_}`);
        }
    }

    protected _setXaafAdContainerElementType(
        xaafAdContainer: XaafAdContainer,
        xaafContainerListener: XaafContainerListener<XaafDynamicElement>
    ): void {
        xaafAdContainer.setElementType(XaafElementType.DynamicView, xaafContainerListener);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _onXaafElementReady(xaafDynamicElement: XaafDynamicElement, commandModel: CommandModel): void {
        this._updateAndReturnCurrentState(State.Ready);
        xaafDynamicElement.xaafElementListener = this;
        try {
            if (!this._xaafElement) {
                this._loggerService.error('[XaafElementCommand::execute] - AAF element does not exist');
                this._notifyExecuteFailure(new Error('AAF element does not exist'), 'XaafElementCommand::execute');
                return;
            }
            this._executeXaafElement(this._xaafElement);
            this._notify(this._commandEventCreator.createExecutedEvent());
        } catch (error) {
            this._loggerService.error(`[XaafElementCommand::execute] - ${error}`);
            this._notifyExecuteFailure(error, 'XaafElementCommand::execute');
        }


    }

    protected _executeXaafElement(xaafDynamicElement: XaafDynamicElement): void {
        if (typeof this._commandModel.data === 'string') {
            const sharedStorage = InjectionContainer.resolve<Map<string, unknown>>(
                ContainerDef.executableAdStorageService
            );
            const alternativeData = sharedStorage.get(this._commandModel.data);
            xaafDynamicElement.setData(alternativeData[0] as XaafDynamicViewData);
        } else {
            xaafDynamicElement.setData(this._commandModel.data);
        }
        xaafDynamicElement.show();
    }

    protected _stopXaafElement(xaafElement: XaafDynamicElement): void {
        xaafElement.hide();
    }

    private _updateAndReturnCurrentState(stateToAdd: State): State {
        this._loggerService.debug(
            `[ShowViewCommand::_updateAndReturnCurrentState] - updating current state with ${stateToAdd}`
        );
        this._currentState |= stateToAdd;
        return this._currentState;
    }
}
