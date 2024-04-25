import { Runner } from '../runner';
import * as Core from '@xaaf/common';
const CASES = '../../cases';
const productsData = require(`${CASES}/the-take-data.json`);
const mockedHttpService: Core.HttpService = {
    get: jest.fn().mockReturnValue(Promise.resolve(productsData)),
    post: jest.fn(),
    put: jest.fn(),
    request: jest.fn(),
    interceptors: jest.fn()
};

const mockedLogger = {
    info: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn()
};

const mockedRenderer = {
    transform: jest.fn() as any
};

const mockedElement = {
    type: 'image'
};

const command: Core.CommandContract = {
    getCommandModel: jest.fn()
};

describe('test workflow', () => {
    beforeAll(() => {
        Core.InjectionContainer.registerInstance(Core.ContainerDef.httpService, mockedHttpService);
        Core.InjectionContainer.registerInstance(Core.ContainerDef.loggerService, mockedLogger);
        Core.InjectionContainer.registerInstance(
            Core.ContainerDef.executableAdStorageService,
            new Map<string, unknown>()
        );
    });

    it('set', async () => {
        const codeData = require(`${CASES}/set.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf, mockedRenderer, mockedElement);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#checkIsShoppable']({ '@media_item_id': 'shoppable_item_id' }); // NOSONAR
        expect(runner.context.get('@apiUrlWithParams')).toBe('http://apirest/get-something?param=5');
    });

    it('set-get', async () => {
        const codeData = require(`${CASES}/set-get.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf, mockedRenderer, mockedElement);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#checkIsShoppable']({ '@media_item_id': 'shoppable_item_id' }); // NOSONAR
        expect(runner.context.get('@apiUrlWithParams')).toBe('http://apirest/get-something?param=5');
        expect(runner.context.get('@newVariable')).toBe('http://apirest/get-something?param=5');
    });

    it('choose', async () => {
        const codeData = require(`${CASES}/choose.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf, mockedRenderer, mockedElement);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#checkIsShoppable']({ '@media_item_id': '5' }); // NOSONAR
        expect(runner.context.get('@from_switch')).toBe('data from switch 5');
    });

    it('condition', async () => {
        const codeData = require(`${CASES}/condition.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf, mockedRenderer, mockedElement);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#checkIsShoppable']({ '@conditionValue': 5 }); // NOSONAR
        expect(runner.context.get('@apiUrlWithParams')).toBe('http://apirest/get-something?param=65');
    });

    it('set-replace', async () => {
        const codeData = require(`${CASES}/set-replace.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf, mockedRenderer, mockedElement);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#checkIsShoppable']({ '@topic': '5' }); // NOSONAR
        expect(runner.context.get('@apiUrlWithParams')).toBe('http://thetake/get-products-for-topic?param=5');
    });

    it('set-replace-getData', async () => {
        const codeData = require(`${CASES}/set-replace-getdata.json`);
        const runner = new Runner(command);
        runner.init(codeData.xaaf, mockedRenderer, mockedElement);
        expect(runner.allMethods).toBeDefined();
        await runner.buildMethods['#checkIsShoppable']({ '@media_item_id': '5' }); // NOSONAR
        expect(runner.context.get('@apiUrlWithParams')).toBe('http://apirest/get-something?param=5');
        expect(runner.context.get('@apiResponse')).toBeDefined();
    });
});
