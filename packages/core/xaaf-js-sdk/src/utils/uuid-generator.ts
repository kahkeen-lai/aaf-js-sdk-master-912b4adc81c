import uuid from 'uuid-random';

export class UuidGenerator {
    static generate(): string {
        return uuid();
    }
}
