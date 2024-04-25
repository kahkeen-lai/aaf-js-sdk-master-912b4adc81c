/* eslint-disable @typescript-eslint/no-explicit-any */
import { HostParams } from '@xaaf/common';

export class ArrayHelper {
    static convertMapToArray<K>(map: NonNullable<Map<string, K>>): Record<string, K> {
        return [...map].reduce((obj, [key, value]) => Object.assign(obj, { [key]: value }), {});
    }

    static convertObjectToMap(objectInfo: Record<string, string>): Map<string, string> {
        const map = new Map<string, string>();
        Object.keys(objectInfo).forEach((key) => {
            map.set(key, objectInfo[key]);
        });
        return map;
    }

    static mapToRecord(args: Map<string, string>): Record<string, string> {
        if (!args) {
            return {};
        }
        return [...args].reduce((prev, [key, value]) => {
            prev[key] = value;
            return prev;
        }, {} as Record<string, string>);
    }

    static assertIsMap(mapOrRecord: Map<string, string> | Record<string, string>): mapOrRecord is Map<string, string> {
        return mapOrRecord && !!mapOrRecord.get;
    }

    static validateMapObject(mapOrRecord: Map<string, string> | Record<string, string>): Map<string, string> {
        if (this.assertIsMap(mapOrRecord)) {
            return mapOrRecord;
        } else {
            return ArrayHelper.convertObjectToMap(mapOrRecord);
        }
    }

    private static _isKeySensitive(key: HostParams): boolean {
        return [
            HostParams.deviceAdId,
            HostParams.userAdvrId,
            HostParams.fwSUSSId,
            HostParams.householdId,
            HostParams.deviceAdvrId,
            HostParams.deviceFWAdId,
            HostParams.platformAdvId,
            HostParams.xaafAdvId
        ].includes(key);
    }

    static buildStringFromArgsMap(argsMap: Map<string, string>): string {
        let stringToReport = '';
        for (const [key, value] of argsMap.entries()) {
            if (!this._isKeySensitive(key as HostParams)) {
                stringToReport += `${key}=${value}&`;
            }
        }
        // remove the last &
        return stringToReport.substring(0, stringToReport.length - 1);
    }
}
