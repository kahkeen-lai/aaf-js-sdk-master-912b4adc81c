export class AssertUtils {
    static assertValueIsDefined<T>(val: T, msg?: string): asserts val is NonNullable<T> {
        if (val === undefined || val === null) {
            throw new Error(msg || `Expected value to be defined, but received ${val}`);
        }
    }

    static assert(condition: unknown, msg?: string): asserts condition {
        if (!condition) {
            throw new Error(msg);
        }
    }

    static assertIsString(val: unknown): asserts val is string {
        if (typeof val !== 'string') {
            throw new Error('value not a string');
        }
    }

    static assertIsNumber(val: unknown): asserts val is number {
        if (typeof val !== 'number') {
            throw new Error('value not a number');
        }
    }
}
