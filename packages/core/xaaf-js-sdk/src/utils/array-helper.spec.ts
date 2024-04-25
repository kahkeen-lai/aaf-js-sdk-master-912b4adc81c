import { ArrayHelper } from './array-helper';

describe('ArrayHelper functions', () => {
    it('convertMapToArray gets a map with a string key and a string value', () => {
        const map: Map<string, string> = new Map<string, string>();
        map.set('testKey1', 'testVal1');
        map.set('testKey2', 'testVal2');
        map.set('testKey3', 'testVal3');

        expect(ArrayHelper.convertMapToArray(map)).toEqual({
            testKey1: 'testVal1',
            testKey2: 'testVal2',
            testKey3: 'testVal3'
        });
    });

    it('convertMapToArray gets an empty map', () => {
        const map: Map<string, number> = new Map<string, number>();

        expect(ArrayHelper.convertMapToArray(map)).toEqual({});
    });
});

describe('mapToRecord function', () => {
    it('mapToRecord functions succeeds', async () => {
        const globalParamsTypeMapper = new Map<string, string>();
        globalParamsTypeMapper.set('platform', 'dfw');
        globalParamsTypeMapper.set('deviceType', 'tvos');
        const spreadedParams = ArrayHelper.mapToRecord(globalParamsTypeMapper);
        expect(spreadedParams['platform']).toEqual('dfw');
        expect(spreadedParams['deviceType']).toEqual('tvos');
    });

    it('checks mapToRecord helper function', () => {
        const mapData: Map<string, string> = new Map<string, string>([
            ['foo', 'bar'],
            ['baz', 'xaaf']
        ]);
        const record: Record<string, string> = ArrayHelper.mapToRecord(mapData);
        expect(record['foo']).toBe(mapData.get('foo'));
        expect(record['baz']).toBe(mapData.get('baz'));

        const emptyRecord: Record<string, string> = ArrayHelper.mapToRecord(null);
        expect(emptyRecord).toStrictEqual({});
    });
});

it('given record validateMapObject should return map', () => {
    const result = ArrayHelper.validateMapObject({
        foo: 'bar'
    });
    expect(result.get('foo')).toBe('bar');
    expect(result['foo']).not.toBe('bar');
});

it('given map validateMapObject should return map', () => {
    const result = ArrayHelper.validateMapObject(new Map([['foo', 'bar']]));
    expect(result.get('foo')).toBe('bar');
    expect(result['foo']).not.toBe('bar');
});
