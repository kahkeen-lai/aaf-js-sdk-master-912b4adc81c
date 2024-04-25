export type ObjectConstructor<T> = new (...args: []) => T;
const CONTAINER_NAME = '_AAF_CONTAINER';

export enum ContainerDef {
    loginService = 'loginService',
    httpService = 'httpService',
    validatorService = 'validatorService',
    keyService = 'keyService',
    loggerService = 'loggerService',
    storageService = 'storageService',
    dateTimeService = 'dateTimeService',
    tokenService = 'tokenService',
    configService = 'configService',
    restApiService = 'restApiService',
    featureFlagsService = 'featureFlagsService',
    featureFlagsDelegate = 'featureFlagsDelegate',
    commandsDataStructuresCreator = 'commandsDataStructuresCreator',
    squeezeCommandService = 'squeezeCommandService',
    reportService = 'reportService',
    executableAdStorageService = 'executableAdStorageService',
    reportServiceDelegate = 'reportServiceDelegate'
}

let xaafDependencyContainer: Record<string, Map<string, unknown>> = {};
// eslint-disable-next-line unicorn/no-nested-ternary
const singleUniverse = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {};

export class DependencyContainer {
    private _dependencyMap: Map<string, unknown>;
    constructor(public readonly name: string) {
        /*
            node based code (jest runs node) may load multiple times,
            to avoid it we keep a reference in  global object and reuse it.
        */
        if (!singleUniverse['xaafDependencyContainer']) {
            singleUniverse['xaafDependencyContainer'] = xaafDependencyContainer;
        } else {
            xaafDependencyContainer = singleUniverse['xaafDependencyContainer'];
        }

        if (!xaafDependencyContainer[name]) {
            xaafDependencyContainer[name] = new Map<string, unknown>();
        }
        this._dependencyMap = xaafDependencyContainer[name];
    }

    registerSingleton(injectionToken: ContainerDef, Constructor: ObjectConstructor<unknown>): void {
        this._setServiceInMap(injectionToken, new Constructor());
    }

    registerInstance(injectionToken: ContainerDef, serviceInstance: unknown): void {
        this._setServiceInMap(injectionToken, serviceInstance);
    }

    resolve<T>(injectionToken: ContainerDef): T {
        const resolvedInstance = this._dependencyMap.get(injectionToken);
        if (!resolvedInstance) {
            throw new Error(`\x1b[31m Service ${injectionToken} was not found.
            Check the order in which services were registered, maybe one of them requires ${injectionToken}
            before ${injectionToken} was registered.
            Maybe you added ${injectionToken} as a member of a class recently?`);
        }
        return resolvedInstance as T;
    }

    private _setServiceInMap(injectionToken: ContainerDef, serviceInstance: unknown): void {
        if (!ContainerDef[injectionToken]) {
            throw `Symbol ${injectionToken} is not supported`;
        } else {
            this._dependencyMap.set(injectionToken, serviceInstance);
        }
    }
}

export const container = new DependencyContainer(CONTAINER_NAME);
