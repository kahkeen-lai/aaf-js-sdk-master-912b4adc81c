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
const command: Core.CommandContract = { commandTriggerHandler: jest.fn() } as any;

describe('test child-expressions scenario', () => {
    beforeAll(() => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.loggerService, mockedLogger);
        Core.InjectionContainer.registerInstance(
            Core.ContainerDef.executableAdStorageService,
            new Map<string, unknown>()
        );
    });

    it('child expressions in node', async () => {
        const codeData = require(`${CASES}/child-expressions.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#loadProducts'](3892); // NOSONAR
        expect(runner.context.get('resultData')).toBeDefined();
        console.log(JSON.stringify(runner.context.get('resultData')));
        expect(JSON.stringify(runner.context.get('resultData')).indexOf('$databind')).toBe(-1);
    });
});
