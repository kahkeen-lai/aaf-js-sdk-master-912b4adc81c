import {
    BaseXaafElement,
    ContainerDef,
    InjectionContainer,
    CommandModel,
    StoppedCommandEventReason
} from '@xaaf/common';
import { Command } from '../executable-ad/commands';
import { XaafAdContainer, XaafContainerListener } from '../executable-ad/elements';
import { StateType, TriggerType } from '../fsm';

export abstract class XaafElementCommand<E extends BaseXaafElement<EL, ED>, EL, ED> extends Command<ED> {
    protected _xaafAdContainer: XaafAdContainer;
    protected _xaafElement: E;
    protected _xaafContainerListener: XaafContainerListener<E> = {
        onElementReady: (xaafElement) => {
            this._handleXaafElementReady(xaafElement);
        }
    };

    protected constructor(commandModel: CommandModel<ED>) {
        super();
        this._commandModel = commandModel;
    }

    init(xaafAdContainer: XaafAdContainer): void {
        try {
            this._xaafAdContainer = xaafAdContainer;
            this._setXaafAdContainerElementType(this._xaafAdContainer, this._xaafContainerListener);
        } catch (error) {
            this._loggerService.error(`[XaafElementCommand::init] - ${error}`);
            this._notifyExecuteFailure(error, 'XaafElementCommand::init');
        }
    }

    protected abstract _setXaafAdContainerElementType(
        xaafAdContainer: XaafAdContainer,
        xaafContainerListener: XaafContainerListener<E>
    ): void;

    private _handleXaafElementReady(xaafElement: E): void {
        try {
            this._xaafElement = xaafElement;
            this._onXaafElementReady(xaafElement, this._commandModel);
        } catch (error) {
            this._loggerService.error(`[XaafElementCommand::_handleXaafElementReady] - ${error}`);
            this._notifyExecuteFailure(error, 'XaafElementCommand::init');
        }
    }

    protected abstract _onXaafElementReady(xaafElement: E, commandModel: CommandModel): void;

    execute(xaafAdContainer: XaafAdContainer, state: StateType, stateInstanceHistory: Set<TriggerType>): void {
        this._loggerService.verbose(`state: ${state}, stateInstanceHistory: ${JSON.stringify(stateInstanceHistory)}`);
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

    protected abstract _executeXaafElement(xaafElement: E): void;

    protected createInteractiveEvent(event: { args: Record<string, string> }): void {
        const executableAdStorageService = InjectionContainer.resolve<Map<string, unknown>>(
            ContainerDef.executableAdStorageService
        );
        Object.keys(event.args).forEach((argKey: string) => {
            executableAdStorageService.set(argKey, event.args[argKey]);
        });
        try {
            this._notify(this._commandEventCreator.createInteractiveEvent(this));
        } catch (error) {
            this._notifyExecuteFailure(error, 'XaafElementCommand::stop');
        }
    }

    protected _handleXaafElementCompleted(CompleteAndStop: boolean = true): void {
        try {
            if (this._xaafAdContainer) {
                this._xaafAdContainer.clearElementType();
            }
            if (CompleteAndStop) {
                this._xaafAdContainer = undefined;
                this._notify(this._commandEventCreator.createStoppedEvent(StoppedCommandEventReason.COMMAND_STOPPED));
            }
            if (this._xaafElement) {
                this._xaafElement = undefined;
            }
        } catch (error) {
            this._notifyExecuteFailure(error, 'XaafElementCommand::stop');
        }
    }

    stop(): void {
        if (this._xaafElement) {
            this._stopXaafElement(this._xaafElement);
        }
    }

    protected abstract _stopXaafElement(xaafElement: E): void;
}
