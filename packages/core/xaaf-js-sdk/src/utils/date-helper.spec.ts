/* eslint-disable @typescript-eslint/naming-convention */
import { DateHelper } from './date-helper';

describe('DateHelper functions', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });
    it('getMeasurementParams with clientFormattedTimeStamp param validate 22.03.2020 14:05:38 +120 date format', () => {
        const spy = jest.spyOn(Date, 'now').mockImplementation(() => 1584878738817);
        expect(DateHelper.clientTime().startsWith("2203202020")).toBeTruthy;
        expect(DateHelper.clientTime()).toContain('0538');
        spy.mockRestore();
    });

    it('calcDuration test', (done) => {
        const adTime = new Date();
        setTimeout(() => {
            const timeFromAdStarts = new Date();
            expect(Number(DateHelper.calcDuration(adTime, timeFromAdStarts))).toBeGreaterThan(400);
            done();
        }, 500);
    });
    it('should throw an error if no playerStartTime and no playerStopTime', () => {
        expect(() => DateHelper.calcDuration(null, null)).toThrowError('adTime of timeFromAdStarts is undefined!');
    });

    it('castEpochToDate function gets an epoch and return a date', () => {
        const date: Date = DateHelper.castEpochToDate(1584349956);
        expect(date).toStrictEqual(new Date('2020-03-16T09:12:36.000Z'));
    });

    it('castDateToEpoch function gets a date and return an epoch', () => {
        const utcSeconds: number = DateHelper.castDateToEpoch(new Date('2020-03-16T09:12:36.000Z'));
        expect(utcSeconds).toBe(1584349956);
    });

    it('between - good range', () => {
        const rangeToReport1: boolean = DateHelper.between(16, 16);
        const rangeToReport2: boolean = DateHelper.between(16, 17);
        expect(rangeToReport1).toBe(true);
        expect(rangeToReport2).toBe(true);
    });

    it('between - bad ranges', () => {
        const rangeToReport1: boolean = DateHelper.between(16, 15);
        const rangeToReport2: boolean = DateHelper.between(16, 14);
        const rangeToReport3: boolean = DateHelper.between(16, 18);
        expect(rangeToReport1).toBe(false);
        expect(rangeToReport2).toBe(false);
        expect(rangeToReport3).toBe(false);
    });

    it.skip('verify Client TimeOff Set in client timestamp string', () => {
        const date = new Date();
        const offset: string = DateHelper.getClientTimeOffSet(date);
        const janOffset: number = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
        const julOffset: number = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();

        const isDst = Math.max(janOffset, julOffset) !== date.getTimezoneOffset();
        const expectedOffset = isDst ? `+${julOffset * -1}` : `+${janOffset * -1}`;

        expect(offset).toEqual(expectedOffset);
    });
});
