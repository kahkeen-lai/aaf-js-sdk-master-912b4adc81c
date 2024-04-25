import { activateIfMethodPrefix, logStatement } from './common.functions';
import * as Core from '@xaaf/common';
import { ExecutionContext, GetDataOptions } from '../types';

export default async function getData(command: GetDataOptions, context: ExecutionContext): Promise<any> {
    const url = await activateIfMethodPrefix(command.source, context);
    const data = await fetch(url, command.options);
    if (data) {
        return data.body;
    }
}

async function fetch(url: string, options: any): Promise<Core.HttpResponse<unknown> | undefined> {
    const httpService = Core.InjectionContainer.resolve<Core.HttpService>(Core.ContainerDef.httpService);
    try {
        return httpService.get<Core.HttpResponse<unknown>>(url, options);
    } catch (error) {
        logStatement('getData', JSON.stringify(error));
    }
}
