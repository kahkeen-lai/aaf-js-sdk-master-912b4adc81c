/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import '../../mock/mock';
import { ReportCommand } from '../../renderer';
import { Command } from './command';
import {
    XipEvent,
    XipProvider,
    ErrorDomain,
    ErrorSubDomain,
    ReportType,
    ReportDefaultValue,
    RecoveryAction,
    ErrorCode
} from '@xaaf/common';
import { ReportService } from '../../services/report-service/report-service';
import { FeatureFlagsService } from '../../services/feature-flags-service/feature-flags-service';

describe('Command report functions', () => {
    const reportCommandMock = require('../../mock/expectations/COMMAND_TEST_REPORT.json');
    const reporter = ReportService.getInstance();
    const featureFlagService = FeatureFlagsService.getInstance();
    let reportCommand: Command = null;
    beforeEach(() => {
        const newReportCommandMock = JSON.parse(JSON.stringify(reportCommandMock));
        reportCommand = new ReportCommand(newReportCommandMock.commands[0]);
        // @ts-ignore
        jest.spyOn(reportCommand, '_reportEvent');
        // @ts-ignore
        jest.spyOn(reportCommand, '_handleNrReportError');
        jest.spyOn(featureFlagService, 'measurementsImpressionsErrorReportEnabled', 'get').mockReturnValue(true);
        jest.spyOn(reporter, 'reportNoAdLifeCycleEvent');
    });

    it('test no report to NR if feature flag is disabled', async () => {
        jest.spyOn(featureFlagService, 'measurementsImpressionsErrorReportEnabled', 'get').mockReturnValue(false);
        expect(reporter.reportNoAdLifeCycleEvent).not.toBeCalled();
    });

    it('test retry with no report to NR if feature flag is disabled', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementation(() => {
            throw { httpErrorCode: 503, errorCode: ErrorCode.NA };
        });
        jest.spyOn(featureFlagService, 'measurementsImpressionsErrorReportEnabled', 'get').mockReturnValue(false);
        reportCommand.execute(undefined, undefined, new Set());
        expect(reportCommand['_reportEvent']).toBeCalledTimes(4);
        expect(reportCommand['_handleNrReportError']).toBeCalledTimes(4);
        expect(reporter.reportNoAdLifeCycleEvent).not.toBeCalled();
    });

    it('test report to NR in case of 30X http error code', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementation(() => {
            throw { httpErrorCode: 302, errorCode: ErrorCode.NA };
        });
        reportCommand.execute(undefined, undefined, new Set());
        expect(reportCommand['_reportEvent']).toBeCalledTimes(2);
        expect(reportCommand['_handleNrReportError']).toBeCalledTimes(2);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledTimes(2);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: false,
                didTryRecovery: RecoveryAction.None,
                errorCode: ErrorCode.NA,
                httpErrorCode: '302',
                provider: 'Emuse'
            })
        );
    });

    it('test report to NR in case of 400 error', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementation(() => {
            throw { httpErrorCode: 400 };
        });
        reportCommand.execute(undefined, undefined, new Set());
        expect(reportCommand['_reportEvent']).toBeCalledTimes(2);
        expect(reportCommand['_handleNrReportError']).toBeCalledTimes(2);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledTimes(2);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: false,
                didTryRecovery: RecoveryAction.None,
                errorCode: ErrorCode.NA,
                httpErrorCode: '400',
                provider: 'Emuse'
            })
        );
    });

    it('test report to NR with retry in case of 50X error - without recovery', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementation(() => {
            throw { httpErrorCode: 503 };
        });
        reportCommand.execute(undefined, undefined, new Set());
        expect(reportCommand['_reportEvent']).toBeCalledTimes(4);
        expect(reportCommand['_handleNrReportError']).toBeCalledTimes(4);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledTimes(4);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: true,
                recoveryActionTaken: RecoveryAction.Retry,
                errorCode: ErrorCode.NA,
                httpErrorCode: '503',
                provider: 'Emuse'
            })
        );

        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: false,
                didTryRecovery: RecoveryAction.Retry,
                errorCode: ErrorCode.NA,
                httpErrorCode: '503',
                provider: 'Emuse'
            })
        );
    });

    it('test report to NR with retry in case of 50X error - with recovery', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementationOnce(() => {
            throw { httpErrorCode: 503 };
        });
        reportCommand.execute(undefined, undefined, new Set());
        expect(reportCommand['_reportEvent']).toBeCalledTimes(3);
        expect(reportCommand['_handleNrReportError']).toBeCalledTimes(1);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledTimes(1);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: true,
                recoveryActionTaken: RecoveryAction.Retry,
                errorCode: ErrorCode.NA,
                httpErrorCode: '503',
                provider: 'Emuse'
            })
        );
    });

    it('test report to NR with retry in case of error status 501- with recovery', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementationOnce(() => {
            throw { status: 501 };
        });
        reportCommand.execute(undefined, undefined, new Set());
        expect(reportCommand['_reportEvent']).toBeCalledTimes(3);
        expect(reportCommand['_handleNrReportError']).toBeCalledTimes(1);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledTimes(1);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: true,
                recoveryActionTaken: RecoveryAction.Retry,
                errorCode: ErrorCode.NA,
                httpErrorCode: '501',
                provider: 'Emuse'
            })
        );
    });

    it('test report to NR with retry in case of HTTP timeout error', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementation(() => {
            throw { errorCode: ErrorCode.ResourceTimeout };
        });
        reportCommand.execute(undefined, undefined, new Set());
        expect(reportCommand['_reportEvent']).toBeCalledTimes(4);
        expect(reportCommand['_handleNrReportError']).toBeCalledTimes(4);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledTimes(4);
        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: true,
                recoveryActionTaken: RecoveryAction.Retry,
                errorCode: ErrorCode.ResourceTimeout,
                httpErrorCode: ReportDefaultValue.NP,
                provider: 'Emuse'
            })
        );

        expect(reporter.reportNoAdLifeCycleEvent).toBeCalledWith(
            ReportType.Error,
            expect.objectContaining({
                errorDomain: ErrorDomain.Http,
                errorSubDomain: ErrorSubDomain.Metrics,
                isRecoverable: false,
                didTryRecovery: RecoveryAction.Retry,
                errorCode: ErrorCode.ResourceTimeout,
                httpErrorCode: ReportDefaultValue.NP,
                provider: 'Emuse'
            })
        );
    });

    it('test no sensitive data is sent to NR', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementation(() => {
            throw { status: 400 };
        });
        reportCommand.execute(undefined, undefined, new Set());
        const reportObject = reporter.reportNoAdLifeCycleEvent['mock'].calls[0][1];
        [
            'deviceAdId',
            'userAdvrId',
            'fwSUSSId',
            'householdId',
            'deviceAdvrId',
            'deviceFWAdId',
            'platformAdvId',
            'xaafAdvId'
        ].forEach((reportKey: string) => {
            expect(Object.keys(reportObject)).not.toContain(reportKey);
        });
    });

    it('verify that http request is sent to each provider', async () => {
        reportCommand['_httpService'].get = jest.fn().mockImplementation(
            () =>
                new Promise<string>((resolve) => {
                    resolve('string');
                })
        );
        reportCommand.execute(undefined, undefined, new Set());
        reportCommand['_commandModel'].report.providers.forEach((provider: XipProvider) => {
            provider.events.forEach(async (event: XipEvent) => {
                expect(reportCommand['_reportEvent']).toBeCalledWith(provider, event);
                expect(reportCommand['_httpService'].get).toHaveBeenCalled();
            });
        });
    });

    // eslint-disable-next-line max-len
    // TODO - replace with measurements urls xaaf-metrics.att.com since measurementdemo2 is not supported by eMuse any more
    it('verify that all event outbounds params are concatenated correctly to basic url', async () => {
        const expectedString =
            'https://measurementdemo2.emuse-tech.com/44434/User-40332494/some-data-4342342348/default.xml?ClientTime=';

        expect.objectContaining({ url: expectedString });
    });

    it('verify that all event outbounds params are concatenated correctly to basic url with params', async () => {
        const expectedString =
            'https://measurementdemo2.emuse-tech.com/44434/User-40332494/some-data-4342342348/default.xml?PageID=143&MeasurementPointID=452&ClientTime=';

        expect.objectContaining({ url: expectedString });
    });
});
