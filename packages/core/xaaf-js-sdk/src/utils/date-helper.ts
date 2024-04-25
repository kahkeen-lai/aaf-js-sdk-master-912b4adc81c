import { LoggerService } from '../services/logger-service';

export class DateHelper {
    private static _logger = LoggerService.getInstance();

    static castEpochToDate(utcSeconds: number): Date {
        const date = new Date(0);
        date.setUTCSeconds(utcSeconds);
        return date;
    }

    static castDateToEpoch(date: Date): number {
        return new Date(date).getTime() / 1000;
    }

    /**
     * According to incorrect implementation on the offset standard
     * we invert here the native implementation and return opposite offset string.
     * for example is in israel it is -180 the function will invert it to +180
     * @param currentDate
     */
    static getClientTimeOffSet(currentDate: Date): string {
        let tzOffset: number = currentDate.getTimezoneOffset();
        tzOffset = tzOffset * -1;
        let parsedTzOffset: string = Math.abs(tzOffset).toString();
        const offsetSign: string = tzOffset > 0 ? '+' : '-';
        parsedTzOffset = `${offsetSign}${parsedTzOffset}`;
        DateHelper._logger.info('[DateHelper]:[castDateToEpoch] -> ' + parsedTzOffset);
        return parsedTzOffset;
    }

    static clientTime(): string {
        const currentDate = new Date(Date.now()); // Date.now() can be mocked
        const tzOffset: string = DateHelper.getClientTimeOffSet(currentDate);
        const fullDate = `${currentDate
            .getDate()
            .toString()
            .padStart(2, '0')}${(currentDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}${currentDate.getFullYear().toString()}${currentDate
            .getHours()
            .toString()
            .padStart(2, '0')}${currentDate
            .getMinutes()
            .toString()
            .padStart(2, '0')}${currentDate
            .getSeconds()
            .toString()
            .padStart(2, '0')}${tzOffset}`;
        DateHelper._logger.info('[DateHelper]:[clientTime] -> ' + fullDate);
        return fullDate;
    }

    static calcDuration(playerStartTime: Date, playerStopTime: Date): string {
        if (!playerStartTime && !playerStopTime) {
            throw new Error('adTime of timeFromAdStarts is undefined!');
        }
        const calc = playerStopTime.getTime() - playerStartTime.getTime();
        DateHelper._logger.info('[DateHelper]:[calcDuration] -> ' + calc);
        return calc.toString();
    }

    /**
     * The design in the native clients duplicated here.
     * We take the positionSec point as the minimum time to report until one second forward
     * @param positionSec
     * @param currentPlayerTime
     * @param maxPositionSec
     */
    static between(positionSec: number, currentPlayerTime: number, maxPositionSec = positionSec + 1): boolean {
        return currentPlayerTime >= positionSec && currentPlayerTime <= maxPositionSec;
    }
}
