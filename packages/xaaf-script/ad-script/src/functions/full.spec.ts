/**
 * @jest-environment jsdom
 */

import { Runner } from '../runner';
import * as Core from '@xaaf/common';

const mockedLogger = {
    info: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn()
};

const CASES = '../../cases';
const productsData = require(`${CASES}/the-take-data.json`);
const mockedHttpService: Core.HttpService = {
    get: jest.fn().mockReturnValue(Promise.resolve(productsData)),
    post: jest.fn(),
    put: jest.fn(),
    request: jest.fn(),
    interceptors: jest.fn()
};
const command: Core.CommandContract = { commandTriggerHandler: jest.fn() } as any;

describe('test full scenario', () => {
    beforeAll(() => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.httpService, mockedHttpService);
        Core.InjectionContainer.registerInstance(Core.ContainerDef.loggerService, mockedLogger);
        Core.InjectionContainer.registerInstance(
            Core.ContainerDef.executableAdStorageService,
            new Map<string, unknown>()
        );
    });

    it('full scenario', async () => {
        const codeData = require(`${CASES}/full.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#checkIsShoppable']({ media_item_id: 3892 }); // NOSONAR
        expect(runner.context.get('@rendredData')).toBeDefined();
        console.log(JSON.stringify(runner.context.get('@rendredData')));
        expect(JSON.stringify(runner.context.get('@rendredData')).indexOf('$databind')).toBe(-1);
    });
});
