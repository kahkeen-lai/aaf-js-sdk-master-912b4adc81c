import { AdScriptCommand } from './adscript-command';
import * as Core from '@xaaf/common';
import { AdScriptCommandData, Runner } from '@xaaf/ad-script';

import mockedPrintCommandXip from '../mock/expectations/04-print-with-args.json';
import mockedOpportunityJSONResponse from '../mock/expectations/Youi-Ad-Script-Show-Dynamic-Text-200.json';
import { CommandModel } from '@xaaf/common';

describe('ad-script command tests', () => {
    const mockedAdScriptDatabindCommand: CommandModel<AdScriptCommandData> = mockedOpportunityJSONResponse
        .commands[0] as CommandModel;
    const mockedAdScriptPrintCommand: CommandModel<AdScriptCommandData> = mockedPrintCommandXip
        .commands[0] as CommandModel;

    beforeEach(() => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.httpService, {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            request: jest.fn()
        });

        Core.InjectionContainer.registerInstance(Core.ContainerDef.executableAdStorageService, new Map<string, any>());
    });

    it('ad-script command should be defined', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);
        expect(adScriptCommand).toBeDefined();
    });

    it('ad-script execute calls should call runner init function', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);

        const runner = ({
            buildMethods: {},
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;

        adScriptCommand.execute();

        expect(runner.init).toBeCalled();
        expect(runner.init).toBeCalledWith(mockedAdScriptDatabindCommand.data);
    });

    it('ad-script execute should call the buildMethod on event Loaded', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);

        const runner = ({
            buildMethods: {
                '#setTemplate': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;

        adScriptCommand.execute();

        expect(runner.buildMethods['#setTemplate']).toBeCalled();
    });

    it('ad-script execute should call onLoad when it has Loaded event', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);
        const runner = ({
            buildMethods: {
                '#setTemplate': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;
        adScriptCommand.onLoad = jest.fn();
        adScriptCommand.execute();

        expect(adScriptCommand.onLoad).toBeCalled();
    });

    it('ad-script execute should call _notifyCompleted when it has Loaded event', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);
        adScriptCommand['_notifyCompleted'] = jest.fn();
        const runner = ({
            buildMethods: {
                '#setTemplate': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;
        adScriptCommand.execute();

        expect(adScriptCommand['_notifyCompleted']).toBeCalled();
    });

    it('ad-script execute should call _report when it has Loaded event', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);
        adScriptCommand['_report'] = jest.fn();
        const runner = ({
            buildMethods: {
                '#setTemplate': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;
        adScriptCommand.execute();

        adScriptCommand.execute();

        expect(adScriptCommand['_report']).toBeCalled();
        expect(adScriptCommand['_report']).toBeCalledWith(mockedAdScriptDatabindCommand.report);
    });

    it('ad-script execute should set template into context', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);

        const runner = ({
            buildMethods: {
                '#setTemplate': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;

        adScriptCommand.execute();

        const context: Map<string, any> = Core.InjectionContainer.resolve(Core.ContainerDef.executableAdStorageService);

        context.set('_$templates', mockedAdScriptDatabindCommand.data.templates);

        expect(context.get('_$templates')).toBeDefined();
        expect(context.get('_$templates')['myText']).toBeDefined();
        expect(context.get('_$templates')).toBe(mockedAdScriptDatabindCommand.data.templates);
    });

    it('ad-script execute should set runner buildMethods', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);

        const runner = ({
            buildMethods: {
                '#setTemplate': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;

        expect(adScriptCommand['_runner'].buildMethods['#setTemplate']).toBeDefined();
        expect(typeof adScriptCommand['_runner'].buildMethods['#setTemplate']).toBe('function');
    });

    it('ad-script execute to call $set with args', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptDatabindCommand);
        const context: Map<string, any> = Core.InjectionContainer.resolve(Core.ContainerDef.executableAdStorageService);

        const setFunction = jest.fn();
        const runner = ({
            buildMethods: {
                '#setTemplate': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'].functions['$set'] = setFunction;
        adScriptCommand['_runner'] = runner;

        adScriptCommand.execute();

        setFunction({
            name: '@myTemplate',
            value: {
                $databind: {
                    data: [{}],
                    templateName: 'myText'
                }
            }
        },
        context
        );

        expect(setFunction).toBeCalled();
        expect(setFunction).toBeCalledWith(
            {
                name: '@myTemplate',
                value: {
                    $databind: {
                        data: [{}],
                        templateName: 'myText'
                    }
                }
            },
            context
        );
    });

    it('ad-script execute should set runner buildMethods', () => {
        const { events } = mockedAdScriptPrintCommand.data;

        const adScriptCommand = new AdScriptCommand(mockedAdScriptPrintCommand);
        const runner = ({
            buildMethods: {
                '#helloWorld': jest.fn()
            },
            init: jest.fn()
        } as unknown) as Runner;
        adScriptCommand['_runner'] = runner;

        adScriptCommand.execute();

        expect(runner.buildMethods['#helloWorld']).toBeCalled();
        expect(runner.buildMethods['#helloWorld']).toBeCalledWith(events[0].args);
        expect(runner.buildMethods['#helloWorld']).not.toBeCalledWith(['foo']);
    });

    it('ad-script execute should initialize allMethods', () => {
        const adScriptCommand = new AdScriptCommand(mockedAdScriptPrintCommand);

        adScriptCommand.execute();

        expect(adScriptCommand['_runner'].allMethods['helloWorld']).toStrictEqual({
            input: ['value'],
            flow: [
                {
                    $print: {
                        value: 'My Passed Variable'
                    }
                }
            ]
        });
    });

    it('ad-script execute should call print with args', () => {
        const printFunction = jest.fn();
        const context: Map<string, any> = Core.InjectionContainer.resolve(Core.ContainerDef.executableAdStorageService);

        const adScriptCommand = new AdScriptCommand(mockedAdScriptPrintCommand);
        adScriptCommand['_runner'].functions['$print'] = printFunction;

        adScriptCommand.execute();

        expect(printFunction).toBeCalled();
        expect(printFunction).toBeCalledWith(
            {
                value: 'My Passed Variable'
            },
            context
        );
    });
});
