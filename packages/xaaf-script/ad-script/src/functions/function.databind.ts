import { activateIfMethodPrefix, logStatement } from './common.functions';
import * as dotProp from 'dot-prop';
import { DatabindOptions, ExecutionContext } from '../types';

async function findKeyToReplace( // NOSONAR
    dynamicData: Record<string, Record<string, string> | string>,
    dataItem: Record<string, string>,
    context: ExecutionContext
): Promise<Record<string, unknown> | unknown[]> {
    if (typeof dynamicData === 'string') {
        return dynamicData;
    }
    const retObject: Record<string, unknown> = {};
    if (Array.isArray(dynamicData)) {
        const retArray = [];
        for (const dataRow of dynamicData) {
            retArray.push(await findKeyToReplace(dataRow, dataItem, context));
        }
        return retArray;
    } else if (typeof dynamicData === 'object') {
        for (const keyToReplace of Object.keys(dynamicData)) {
            let replacementKey = dynamicData[keyToReplace];
            if (keyToReplace.startsWith('$')) {
                const eveluationResult = await activateIfMethodPrefix(dynamicData, context);
                return eveluationResult;
            }
            if (typeof replacementKey === 'string' && replacementKey.toString().startsWith('@')) {
                replacementKey = replacementKey.toString().substr(1);

                let trueData = dataItem;
                if (replacementKey.indexOf('[') === 0) {
                    const dataIndexArray = replacementKey.substr(1).split(']');
                    replacementKey = dataIndexArray[1];
                    trueData = dataItem[Number(dataIndexArray[0])] as any;
                }

                if (replacementKey.indexOf('.') > 0) {
                    retObject[keyToReplace] = dotProp.get(trueData, replacementKey);
                } else {
                    retObject[keyToReplace] = trueData[replacementKey];
                }
            } else if (
                typeof replacementKey === 'object' &&
                Object.keys(replacementKey)[0] &&
                Object.keys(replacementKey)[0].startsWith('$')
            ) {
                retObject[keyToReplace] = await activateIfMethodPrefix(replacementKey, context);
            } else {
                retObject[keyToReplace] = await findKeyToReplace(
                    replacementKey as Record<string, string>,
                    dataItem,
                    context
                );
            }
        }
    } else {
        return dynamicData;
    }
    return retObject;
}

export default async function databind(command: DatabindOptions, context: ExecutionContext): Promise<void> {
    const data = await activateIfMethodPrefix(command.data, context);
    const dataRoot = [] as any;

    let groupedData: any = [];
    if (command.take) {
        let takeIndex = 0;
        for (let index = 0; index < data.length; index++) {
            if (index > 0 && index % command.take === 0) {
                takeIndex++;
            }
            groupedData[takeIndex] = groupedData[takeIndex] || [];
            groupedData[takeIndex].push(data[index]);
        }
    } else {
        groupedData = data;
    }

    for (const dataItem of groupedData) {
        const templates = context.get('_$templates');
        const rawTemplate = templates[command.templateName];
        const templateData = JSON.parse(JSON.stringify(rawTemplate));
        const temperedNode = await findKeyToReplace(templateData, dataItem, context);
        dataRoot.push(temperedNode);
    }
    logStatement('dataRoot', `${JSON.stringify(dataRoot)} `);
    return dataRoot;
}
