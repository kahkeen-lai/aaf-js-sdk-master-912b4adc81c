import { DateTimeService } from '../../../services';

export class MockDateTimeService implements DateTimeService {
    delay(delayMS: number): Promise<number> {
        return Promise.resolve(delayMS);
    }

    timeout(): Promise<never> {
        return Promise.reject();
    }
}
