import { LogTimeCapsule } from './log-time-capsule';

export class CircularLogContainer {
    private readonly _size: number;
    private _isEmpty: boolean;
    private static _container: Array<LogTimeCapsule>;

    constructor(size: number) {
        this._size = size;
        this._isEmpty = true;
        CircularLogContainer._container = new Array<LogTimeCapsule>(size);
    }

    push(logTimeCapsule: LogTimeCapsule): void {
        this._isEmpty = false;
        if (CircularLogContainer._container.length === this._size) {
            CircularLogContainer._container.pop();
        }
        CircularLogContainer._container.unshift(logTimeCapsule);
    }

    clear(): Array<LogTimeCapsule> {
        const res = [];
        const reversedListOfLogLines = [...CircularLogContainer._container].reverse();
        reversedListOfLogLines.forEach((logTimeCapsule) => {
            if (logTimeCapsule) {
                res.push(logTimeCapsule);
            }
        });
        CircularLogContainer._container = new Array<LogTimeCapsule>(this._size);
        this._isEmpty = true;
        return res;
    }

    get isEmpty(): boolean {
        return this._isEmpty;
    }
}
