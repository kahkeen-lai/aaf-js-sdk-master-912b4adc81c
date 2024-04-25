import * as Core from '@xaaf/common';
export class ValidatorService {
    isAFunction(functionCandidate: unknown): boolean {
        return typeof functionCandidate === 'function';
    }
}
Core.InjectionContainer.registerSingleton(Core.ContainerDef.validatorService, ValidatorService);
