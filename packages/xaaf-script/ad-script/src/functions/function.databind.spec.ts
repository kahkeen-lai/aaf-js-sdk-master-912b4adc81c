/**
 * @jest-environment jsdom
 */

import { Runner } from '../runner';
import * as Core from '@xaaf/common';
const command: Core.CommandContract = { commandTriggerHandler: jest.fn() } as any;
const mockedLogger = {
    info: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn()
};

const CASES = '../../cases';
describe('test databind function', () => {
    beforeAll(() => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.loggerService, mockedLogger);
        Core.InjectionContainer.registerInstance(
            Core.ContainerDef.executableAdStorageService,
            new Map<string, unknown>()
        );
    });

    it('databind', async () => {
        const codeData = require(`${CASES}/databind.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#loadProducts']('5'); // NOSONAR
        console.log(JSON.stringify(runner.context.get('resultData')));
        expect(runner.context.get('resultData')).toBeDefined();
    });
});
