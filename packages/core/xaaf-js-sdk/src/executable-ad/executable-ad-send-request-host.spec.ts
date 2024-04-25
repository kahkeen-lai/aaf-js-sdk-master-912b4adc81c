/* eslint-disable @typescript-eslint/no-var-requires */
import { resetMocks } from '../mock/mock';
import { AdEventType, InjectionContainer, ContainerDef, ErrorProperties } from '@xaaf/common';
import { CommandTriggeredBy, ExecutableAd } from './executable-ad';
import { OpportunityType } from './opportunity';
import { Xip } from '@xaaf/common';
import { State, StateType } from '../fsm/state';
import { ReportService } from '../services';

describe('Send Request to Host', () => {
    const opportunity: Xip = require('../mock/expectations/SEND_REQUEST_TO_HOST.json');
    let executableAd: ExecutableAd;
    let triggerToCommandMap;
    beforeEach(() => {
        resetMocks();
        InjectionContainer.registerInstance(ContainerDef.executableAdStorageService, new Map<string, unknown>());
        executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });
        executableAd['_createCommandsDataStructures'](opportunity.commands);
        triggerToCommandMap = executableAd['_triggersToCommandsMap'];
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('test adEvent is Error when sendRequestToHost calls back with error', (done) => {
        jest.setTimeout(30 * 1000);
        const state = State.STATE_STARTED as StateType;
        const commands = triggerToCommandMap.get(state);

        executableAd.executableAdHostHandlerListener = (
            request,
            requestArguments,
            callback: (errorEvent?: Error) => void
        ) => {
            callback(new Error('Some error'));
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executableAd.executableAdEventListener = (adEvent: any) => {
            switch (adEvent.type) { // NOSONAR
                case AdEventType.Error:
                    expect(adEvent).toBeDefined();
                    expect(adEvent.error.comment).toEqual('Some error');
                    done();
            }
        };

        executableAd.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
    });

    it('test adEvent is Error when sendRequestToHost calls back after timeout', (done) => {
        jest.setTimeout(30 * 1000);
        const state = State.STATE_STARTED as StateType;
        const commands = triggerToCommandMap.get(state);
        const hostRequestTimeout = commands[0].getCommandModel().data.timeout_ms;

        executableAd.executableAdHostHandlerListener = (
            request,
            requestArguments,
            callback: (error?: Error) => void
        ) => {
            setTimeout(callback, hostRequestTimeout + 100);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executableAd.executableAdEventListener = (adEvent: any) => {
            switch (adEvent.type) { // NOSONAR
                case AdEventType.Error:
                    const errorCode = '6000-3';
                    const errorProperty = ErrorProperties.get(errorCode);
                    expect(adEvent.error).toBeDefined();
                    expect(adEvent.error.message).toEqual(errorProperty.message);
                    expect(adEvent.error.errorCode).toEqual(errorCode);
                    done();
            }
        };

        executableAd.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
    });

    it('test adEvent is Error when exeutableAdHostHandlerListener is not set', (done) => {
        jest.setTimeout(30 * 1000);
        const state = State.STATE_STARTED as StateType;
        const commands = triggerToCommandMap.get(state);

        executableAd.executableAdHostHandlerListener = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executableAd.executableAdEventListener = (adEvent: any) => {
            switch (adEvent.type) { // NOSONAR
                case AdEventType.Error:
                    const errorCode = '6000-4';
                    const errorProperty = ErrorProperties.get(errorCode);
                    expect(adEvent.error).toBeDefined();
                    expect(adEvent.error.message).toEqual(errorProperty.message);
                    expect(adEvent.error.errorCode).toEqual(errorCode);
                    done();
            }
        };

        executableAd.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
    });
});

describe('Send Non-Mandatory Request to Host', () => {
    const opportunity: Xip = require('../mock/expectations/SEND_NON_MANDATORY_REQUEST_TO_HOST.json');
    let executableAd: ExecutableAd;
    let triggerToCommandMap;
    beforeEach(() => {
        resetMocks();
        InjectionContainer.registerInstance(ContainerDef.executableAdStorageService, new Map<string, unknown>());
        executableAd = new ExecutableAd({
            opportunity: OpportunityType.Pause,
            arguments: new Map<string, string>()
        });
        executableAd['_createCommandsDataStructures'](opportunity.commands);
        triggerToCommandMap = executableAd['_triggersToCommandsMap'];
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('test adEvent is Error when sendRequestToHost calls back with error', (done) => {
        jest.setTimeout(30 * 1000);
        const reportService = ReportService.getInstance();
        const reportErrorSpy = jest.spyOn(reportService, 'reportError');
        const state = State.STATE_STARTED as StateType;
        const commands = triggerToCommandMap.get(state);

        executableAd.executableAdHostHandlerListener = (
            request,
            requestArguments,
            callback: (errorEvent?: Error) => void
        ) => {
            callback(new Error('Some error'));
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executableAd.executableAdEventListener = (adEvent: any) => {
            switch (adEvent.type) { // NOSONAR
                case AdEventType.Warning:
                    expect(adEvent).toBeDefined();
                    expect(adEvent.error.comment).toEqual('Some error');
                    expect(reportErrorSpy).toHaveBeenCalled();
                    done();
            }
        };

        executableAd.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
    });

    it('test adEvent is Error when sendRequestToHost calls back after timeout', (done) => {
        jest.setTimeout(30 * 1000);
        const reportService = ReportService.getInstance();
        const reportErrorSpy = jest.spyOn(reportService, 'reportError');
        const state = State.STATE_STARTED as StateType;
        const commands = triggerToCommandMap.get(state);
        const hostRequestTimeout = commands[0].getCommandModel().data.timeout_ms;

        executableAd.executableAdHostHandlerListener = (
            request,
            requestArguments,
            callback: (error?: Error) => void
        ) => {
            setTimeout(callback, hostRequestTimeout + 100);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executableAd.executableAdEventListener = (adEvent: any) => {
            switch (adEvent.type) { // NOSONAR
                case AdEventType.Warning:
                    const errorCode = '6000-3';
                    const errorProperty = ErrorProperties.get(errorCode);
                    expect(reportErrorSpy).toHaveBeenCalled();
                    expect(adEvent.error).toBeDefined();
                    expect(adEvent.error.message).toEqual(errorProperty.message);
                    expect(adEvent.error.errorCode).toEqual(errorCode);
                    done();
            }
        };

        executableAd.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
    });

    it('test adEvent is Error when exeutableAdHostHandlerListener is not set', (done) => {
        jest.setTimeout(30 * 1000);
        const reportService = ReportService.getInstance();
        const reportErrorSpy = jest.spyOn(reportService, 'reportError');
        const state = State.STATE_STARTED as StateType;
        const commands = triggerToCommandMap.get(state);

        executableAd.executableAdHostHandlerListener = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        executableAd.executableAdEventListener = (adEvent: any) => {
            switch (adEvent.type) { // NOSONAR
                case AdEventType.Warning:
                    const errorCode = '6000-4';
                    const errorProperty = ErrorProperties.get(errorCode);
                    expect(reportErrorSpy).toHaveBeenCalled();
                    expect(adEvent.error).toBeDefined();
                    expect(adEvent.error.message).toEqual(errorProperty.message);
                    expect(adEvent.error.errorCode).toEqual(errorCode);
                    done();
            }
        };

        executableAd.executeTriggeredCommands(commands, state, CommandTriggeredBy.StateTrigger);
    });
});
