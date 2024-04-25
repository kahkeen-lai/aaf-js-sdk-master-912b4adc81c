/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import '../../mock/mock';
import * as Core from '@xaaf/common';
import { ExecutableAd } from '../executable-ad';
import { Renderer, ShowVideoCommand } from '../../renderer';
import { OpportunityType } from '../opportunity';
import { XaafAdContainerMock } from '../../mock/models';
import { CommandEventCreator } from './command-events/command-event-creator';

describe('Events', () => {
    describe('Command events tests', () => {
        const rendererAtTest = new Renderer();
        const opportunity: Core.Xip = require('../../mock/expectations/SHOW_VIDEO.json') as Core.Xip;
        const commandWithListener = rendererAtTest.createCommand(opportunity.commands[0]) as ShowVideoCommand;
        const xaafAdContainerMock = new XaafAdContainerMock();

        it('handleError is called when init fails', async () => {
            commandWithListener.init(xaafAdContainerMock);
            expect(commandWithListener['_notifyError']).toHaveBeenCalled;
        });
        it('notify function changes the listener', async () => {
            let hasLoaded = false;
            const commandEvent: Core.CommandEvent = { type: Core.CommandEventType.Loaded };
            commandWithListener.commandEventListener = () => {
                hasLoaded = true;
            };

            commandWithListener['_notify'](commandEvent);
            expect(hasLoaded).toBeTruthy();
        });
        it('notify function changes the listener', async () => {
            let hasLoaded = false;
            const commandEvent: Core.CommandEvent = { type: Core.CommandEventType.Loaded };
            commandWithListener.commandEventListener = () => {
                hasLoaded = true;
            };

            commandWithListener['_notify'](commandEvent);
            expect(hasLoaded).toBeTruthy();
        });
        it('commandEventCreator needs to return a command event', async () => {
            const commandEventCreator: CommandEventCreator = new CommandEventCreator();
            const loadedEvent = commandEventCreator.createLoadedEvent();
            expect(loadedEvent.type).toBe('Loaded');
        });
    });
    describe('Ad events tests', () => {
        const executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });

        it('notify function changes the listener', async () => {
            let hasLoaded = false;
            const adEvent: Core.AdEvent = { type: Core.AdEventType.Loaded };
            executableAd.executableAdEventListener = (commandEvent) => {
                hasLoaded = true;
            };

            executableAd['_notify'](adEvent);
            expect(hasLoaded).toBeTruthy();
        });
        it('commandEventCreator needs to return a command event', async () => {
            const adEventCreator: Core.AdEventCreator = new Core.AdEventCreator();
            const loadedEvent = adEventCreator.createLoadedEvent();
            expect(loadedEvent.type).toBe('Loaded');
        });
    });
});
