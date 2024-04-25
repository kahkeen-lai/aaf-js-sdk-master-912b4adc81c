import { ContainerDef, DependencyContainer } from './di-service';
interface Name {
    name: string;
}

class ForDI implements Name {
    name: string = 'container-name';
    constructor() {}
}
class AclassWithName implements Name {
    name: string = 'AclassWithName';
}
describe('Dependecy Injection', () => {
    let container: DependencyContainer;

    beforeEach(() => {
        container = new DependencyContainer('test-container');
    });

    it('registerInstance', () => {
        container.registerInstance(ContainerDef.httpService, AclassWithName);
        const service = container.resolve<AclassWithName>(ContainerDef.httpService);
        expect(service.name).toEqual('AclassWithName');
    });
    it('registerSingleton', () => {
        container.registerSingleton(ContainerDef.storageService, ForDI);
        const service = container.resolve<Name>(ContainerDef.storageService);
        expect(service.name).toEqual('container-name');
    });

    it('registerInstance for invalid symbol', () => {
        try {
            expect(container.registerSingleton('some symbol' as any, ForDI)).toThrow();
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('resolve error for invalid symbol', () => {
        try {
            expect(container.resolve('some symbol' as any)).toThrow();
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('new Container', () => {
        const testContainer = new DependencyContainer('test');
        expect(testContainer.name).toEqual('test');
    });
});
