import { UuidGenerator } from './uuid-generator';
import uuid from 'uuid-random';

test('uuid generator to return a value that is in format backend expects', async () => {
    const generatedId: string = UuidGenerator.generate();
    const isGood: boolean = uuid.test(generatedId);
    expect(isGood).toBeTruthy();
});
