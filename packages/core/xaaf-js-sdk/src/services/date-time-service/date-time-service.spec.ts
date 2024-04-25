import { DateTimeService } from './date-time-service';

describe('dateTimeService', () => {
    let dateTimeService: DateTimeService;

    jest.useFakeTimers();

    beforeEach(() => {
        dateTimeService = new DateTimeService();
    });

    it('delay method, should resolve the promise after spesified delay', () => {
        const SECOND = 1000;

        dateTimeService.delay(5 * SECOND);

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5 * SECOND);
    });
});
