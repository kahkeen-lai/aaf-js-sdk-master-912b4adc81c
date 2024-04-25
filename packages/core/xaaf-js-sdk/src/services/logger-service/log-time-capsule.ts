export class LogTimeCapsule {
    private readonly _localTimestamp: number;
    private readonly _logLevel: string;
    private readonly _message: string;

    constructor(logLevel: string, message: string) {
        this._localTimestamp = new Date().getTime();
        this._logLevel = logLevel;
        this._message = message;
    }

    get logLevel(): string {
        return this._logLevel;
    }

    get message(): string {
        return this._message;
    }

    get localTimeStamp(): number {
        return this._localTimestamp;
    }
}
