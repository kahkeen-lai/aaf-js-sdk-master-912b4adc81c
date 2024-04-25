import * as Core from '@xaaf/common';
import { ConfigService } from '../config-service/config-service';

import { CircularLogContainer } from './circular-log-container';
import { LogTimeCapsule } from './log-time-capsule';

const debug = 'debug';
const info = 'info';
const warning = 'warning';
const error = 'error';
const applicationJson = 'application/json';

// All errors in this class are special cases
// This is a logger class and if problems occur when handling the log it cannot log it's own errors
// Therefore, errors are sent to the console
// If errors were sent to the logger class we could find ourselves in an infinite loop

export class NewRelicLogger implements Core.Logger {
    private _circularLogContainer: CircularLogContainer;
    private readonly _httpService: Core.HttpService;
    // URL for NR Logs unified to all environments
    // The environment identifier is the NR API Insert Key
    private readonly _newRelicUrl = 'https://log-api.newrelic.com/log/v1';
    private readonly _configService: ConfigService;
    private _dumpingToNewRelic: boolean;

    constructor(configService: ConfigService) {
        this._httpService = Core.InjectionContainer.resolve<Core.HttpService>(Core.ContainerDef.httpService);
        this._configService = configService;
        // 100 log lines are being circulated until we get access to NR
        this._circularLogContainer = new CircularLogContainer(100);
        this._dumpingToNewRelic = false;
    }

    private _canSendLogsToNewRelic(): boolean {
        return this._configService.nrApiKey !== undefined;
    }

    debug(str: string, options?: Core.LoggerOptions): void {
        if (options && options.sendOverNetwork === false) {
            return;
        }
        this._handleLogMessage(new LogTimeCapsule(debug, str))
            .then((res) => {
                if (res && res.status !== 202) {
                    console.log(`Failed sending debug log to New Relic with error code ${res.status}`);
                }
            })
            .catch((error_) => {
                console.log(`Failed sending debug log to New Relic: ${str}`);
                console.error(error_);
            });
    }

    error(str: string, options?: Core.LoggerOptions): void {
        if (options && options.sendOverNetwork === false) {
            return;
        }
        this._handleLogMessage(new LogTimeCapsule(error, str))
            .then((res) => {
                if (res && res.status !== 202) {
                    console.log(`Failed sending error log to New Relic with error code ${res.status}`);
                }
            })
            .catch((error_) => {
                console.log(`Failed sending error log to New Relic: ${str}`);
                console.error(error_);
            });
    }

    info(str: string, options?: Core.LoggerOptions): void {
        if (options && options.sendOverNetwork === false) {
            return;
        }
        this._handleLogMessage(new LogTimeCapsule(info, str))
            .then((res) => {
                if (res && res.status !== 202) {
                    console.log(`Failed sending info log to New Relic with error code ${res.status}`);
                }
            })
            .catch((error_) => {
                console.log(`Failed sending info log to New Relic: ${str}`);
                console.error(error_);
            });
    }

    verbose(str: string): void {
        str && console.error('New Relic logger should never log verbose');
    }

    warning(str: string, options?: Core.LoggerOptions): void {
        if (options && options.sendOverNetwork === false) {
            return;
        }
        this._handleLogMessage(new LogTimeCapsule(warning, str))
            .then((res) => {
                if (res && res.status !== 202) {
                    console.log(`Failed sending warning log to New Relic with error code ${res.status}`);
                }
            })
            .catch((error_) => {
                console.log(`Failed sending warning log to New Relic: ${str}`);
                console.error(error_);
            });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async _handleLogMessage(logLine: LogTimeCapsule): Promise<Core.HttpResponse<any>> {
        if (this._canSendLogsToNewRelic()) {
            if (!this._circularLogContainer.isEmpty) {
                this._dumpCircularLogContainerToNewRelic();
            }
            return this._sendToNewRelic(logLine);
        } else {
            this._circularLogContainer.push(logLine);
        }
    }

    private _dumpCircularLogContainerToNewRelic(): void {
        if (this._dumpingToNewRelic) {
            return;
        }
        this._dumpingToNewRelic = true;
        if (!this._circularLogContainer.isEmpty) {
            const oldLogs = this._circularLogContainer.clear();
            oldLogs.forEach((logTimeCapsule) => {
                this._sendToNewRelic(logTimeCapsule)
                    .then((res) => {
                        if (res && res.status !== 202) {
                            console.log(`Failed sending log to New Relic with error code ${res.status}`);
                        }
                    })
                    .catch((error_) => {
                        console.log('Failed sending log to New Relic: ');
                        console.error(error_);
                    });
            });
        }
        this._dumpingToNewRelic = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _prepareLogParams(logLine: LogTimeCapsule): any {
        return {
            message: logLine.message,
            logLevel: logLine.logLevel,
            localTimestamp: logLine.localTimeStamp,
            deviceUUID: this._configService.deviceUUID,
            deviceType: this._configService.deviceType,
            device: this._configService.device,
            deviceModel: this._configService.deviceModel,
            deviceManufacturer: this._configService.deviceManufacturer,
            osName: this._configService.osName,
            osVersion: this._configService.osVersion,
            userType: this._configService.userType,
            tenantName: this._configService.tenantName,
            tenantSystemName: this._configService.tenantSystemName,
            appName: this._configService.appName,
            appVersion: this._configService.appVersion,
            platform: this._configService.platform,
            sdkName: this._configService.sdkName,
            sdkVersion: this._configService.sdkVersion,
            platformName: this._configService.platformName
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _sendToNewRelic(logLine: LogTimeCapsule): Promise<Core.HttpResponse<any>> {
        const params = this._prepareLogParams(logLine);
        const reqBody = JSON.stringify(params);
        return this._httpService.post(
            this._newRelicUrl,
            {
                headers: {
                    'Content-Type': applicationJson,
                    'X-Insert-Key': this._configService.nrApiKey
                },
                timeout: Core.NO_TIMEOUT
            },
            reqBody
        );
    }
}
