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
const command: Core.CommandContract = { commandTriggerHandler: jest.fn() } as any;

const CASES = '../../cases';
describe('test fire-trigger function', () => {
    const triggerFunction = jest.fn();
    const contextMap = new Map<string, unknown>();
    contextMap.set(Core.COMMAND_TRIGGER_HANDLER, triggerFunction);

    beforeAll(() => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.loggerService, mockedLogger);
        Core.InjectionContainer.registerInstance(Core.ContainerDef.executableAdStorageService, contextMap);
    });

    it('fire-trigger', async () => {
        const codeData = require(`${CASES}/fire-trigger.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf);
        expect(runner.allMethods).toBeDefined();
        expect(runner.buildMethods['#checkIsShoppable']).toBeDefined();

        await runner.buildMethods['#checkIsShoppable']({ '@media_item_id': '5' }); // NOSONAR
        expect(triggerFunction).toHaveBeenCalled();
    });
});
