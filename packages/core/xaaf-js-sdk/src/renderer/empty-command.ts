import { Command } from '../executable-ad/commands';

export class EmptyCommand extends Command {
    constructor() {
        super();
    }

    async execute(): Promise<void> {
        this._notifyHandled();
        return;
    }

    init(): undefined {
        return;
    }

    async stop(): Promise<void> {
        return;
    }
}
