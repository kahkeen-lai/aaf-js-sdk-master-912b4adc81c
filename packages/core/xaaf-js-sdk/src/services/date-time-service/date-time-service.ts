import { InjectionContainer, ContainerDef } from '@xaaf/common';
export class DateTimeService {
    delay(delayMS: number): Promise<number> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(delayMS);
            }, delayMS);
        });
    }

    timeout(timeoutMS: number): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject();
            }, timeoutMS);
        });
    }
}
InjectionContainer.registerSingleton(ContainerDef.dateTimeService, DateTimeService);
