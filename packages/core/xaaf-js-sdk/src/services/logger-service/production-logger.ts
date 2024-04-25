import * as Core from '@xaaf/common';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';

export class ProductionLogger implements Core.Logger {
    private readonly _featureFlagsService: FeatureFlagsService;

    private _logger: Core.Logger;

    constructor(featureFlagsService: FeatureFlagsService, logger: Core.Logger) {
        this._featureFlagsService = featureFlagsService;
        this._logger = logger;
    }

    static createProductionLogger(featureFlagService: FeatureFlagsService, logger: Core.Logger): ProductionLogger {
        return new ProductionLogger(featureFlagService, logger);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verbose(str: string): void {
        // This log level is never sent to new relic as it may contain secured or sensitive data
    }

    debug(str: string): void {
        if (this._featureFlagsService.nrDebugLogLevelEnabled) {
            this._logger.debug(str);
        }
    }

    info(str: string): void {
        if (this._featureFlagsService.nrDebugLogLevelEnabled || this._featureFlagsService.nrInfoLogLevelEnabled) {
            this._logger.info(str);
        }
    }

    warning(str: string): void {
        if (this._featureFlagsService.nrDebugLogLevelEnabled || this._featureFlagsService.nrInfoLogLevelEnabled) {
            this._logger.warning(str);
        }
    }

    error(str: string): void {
        if (
            this._featureFlagsService.nrDebugLogLevelEnabled ||
            this._featureFlagsService.nrInfoLogLevelEnabled ||
            this._featureFlagsService.nrErrorLogLevelEnabled
        ) {
            this._logger.error(str);
        }
    }
}
