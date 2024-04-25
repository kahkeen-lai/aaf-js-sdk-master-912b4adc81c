/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Command, RendererCommandFactory } from '../executable-ad/commands';
import {
    XaafElement,
    XaafAdContainer,
    XaafContainerListener,
    XaafElementType,
    XaafVideoData
} from '../executable-ad/elements';
import { CommandModel } from '@xaaf/common';

export class CommandMock extends Command {
    constructor(commandModel: CommandModel) {
        super();
        this._commandModel = commandModel;
    }

    execute(xaafAdContainer: XaafAdContainer): void {
        this._notifyHandled();
        return;
    }

    init(xaafAdContainer: XaafAdContainer): void {
        return;
    }

    stop(): void {
        return;
    }
}

export class RendererMock implements RendererCommandFactory {
    createCommand(commandModel: CommandModel): Command {
        return new CommandMock(commandModel);
    }
}

export const mockXaafElement = {
    xaafVideoListener: null,
    play: () => {},
    pause: () => {},
    stop: () => {},
    setData: (data: XaafVideoData) => {},
    getCurrentBuffer: () =>
        new Promise<number>((resolve) => {
            resolve(0);
        }),
    isBufferForPlaybackReached: () =>
        new Promise<boolean>((resolve) => {
            resolve(true);
        }),
    _onPlaying(): void {
        mockXaafElement.xaafVideoListener?.onPlaying();
    }
};

export class ElementMock implements XaafElement {}

export class XaafAdContainerMock implements XaafAdContainer {
    setElementType(elementType: XaafElementType, xaafContainerListener: XaafContainerListener<unknown>): void {}
    clearElementType(): void {}
}
