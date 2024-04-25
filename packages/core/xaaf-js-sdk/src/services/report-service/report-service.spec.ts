/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { resetMocks } from '../../mock/mock';
import { ReportService, ReportServiceDelegate } from './report-service';
import { adSessionParamsMock, sdkCommonParamsMock } from '../../mock/report';
import { UuidGenerator } from '../../utils/uuid-generator';
import { FeatureFlagsService } from '../feature-flags-service/feature-flags-service';
import {
    ContainerDef,
    HttpService,
    InjectionContainer,
    ReportDefaultValue,
    ReportType,
    TimeSinceEvent,
    ReportLoginMode
} from '@xaaf/common';
import { ConfigService } from '../config-service/config-service';
import { ArrayHelper } from '../../utils/array-helper';

describe('reportService - general tests', () => {
    class mockedDelegate implements ReportServiceDelegate {
        init(intervalInMilliseconds, bulkSize, bulkFFEnable): void {}
        isInitialized(): boolean {
            return true;
        }

        async putInReportQueue(report): Promise<boolean> {
            return true;
        }
    }

    describe('reportService - adLifeCycleParameters', () => {
        let httpService;
        let reportService: ReportService;
        let adLifeCycleParameters: Map<string, string>;
        beforeEach(async () => {
            resetMocks();
            httpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            reportService = ReportService.getInstance();

            InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new mockedDelegate());

            jest.spyOn(httpService, 'post').mockImplementation(
                (url: string, options: {}, reqBody: {}) => JSON.parse(reqBody.toString())
            );

            ConfigService.getInstance().update({
                loginRes: { configuration: { nr_url: 'https://log-api.newrelic.com/log/v1' } } as any
            });
            reportService.init();
        });
        it('report service shall not send empty reports to new relic', async () => {
            const emptyListOfReports = [];
            const res = await reportService.sendReports(emptyListOfReports);
            expect(res).toBe(true);
            expect(httpService.post).not.toBeCalled();
        });
        it('report service shall send reports to new relic', async () => {
            const emptyListOfReports = ['rtere'];
            await reportService.sendReports(emptyListOfReports);
            expect(httpService.post).toBeCalledTimes(1);
        });
        it('adLifeCycleParameters map has values', async () => {
            jest.spyOn(reportService['_featureFlagsService'], 'reportInBulksEnabled', 'get').mockReturnValue(false);

            adLifeCycleParameters = new Map<string, string>();
            adLifeCycleParameters.set('projectId', '6028');
            adLifeCycleParameters.set('projectBuildNumber', '1');

            reportService.setAdLifeCycleParameters(adLifeCycleParameters);

            await reportService.report(ReportType.AdLoaded);

            expect(httpService.post).toReturnWith(
                expect.objectContaining({ projectId: '6028', projectBuildNumber: '1' })
            );
        });
        it('adLifeCycleParameters map is empty', async () => {
            adLifeCycleParameters = new Map<string, string>();
            reportService.setAdLifeCycleParameters(adLifeCycleParameters);

            await reportService.report(ReportType.AdLoaded);

            expect(httpService.post).toReturnWith(
                expect.not.objectContaining({ projectId: '6028', projectBuildNumber: '1' })
            );
        });
        it('adLifeCycleParameters map is null', async () => {
            adLifeCycleParameters = null;
            reportService.setAdLifeCycleParameters(adLifeCycleParameters);

            await reportService.report(ReportType.AdLoaded);

            expect(httpService.post).toReturnWith(
                expect.not.objectContaining({ projectId: '6028', projectBuildNumber: '1' })
            );
        });
    });

    describe('reportService - lastAdLifeCycleEventName including errors', () => {
        let httpService;
        let reportService;
        let _counter;
        beforeEach(async () => {
            resetMocks();
            httpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            reportService = ReportService.getInstance();
            reportService['_featureFlagsService']['_delegate'].isFlagEnabled = jest.fn(
                (flagName, defaultValue) => false
            );
            _counter = 0;
            InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new mockedDelegate());

            jest.spyOn(httpService, 'post').mockImplementation((url: string, options: {}, reqBody: {}) => {
                _counter++;
                return JSON.parse(reqBody.toString())
            });
            ConfigService.getInstance().update({
                loginRes: { configuration: { nr_url: 'https://log-api.newrelic.com/log/v1' } } as any
            });
            reportService.init();
            reportService['_lastErrorEvent'].reportEvent['lastAdLifeCycleEventName'] = null;
        });
        it('Test previous event name is ERROR and current event name is HOST_AD_CREATE - lastAdLifeCycleEventName is NA', async () => {
            await reportService.report(ReportType.Error, adSessionParamsMock);
            await reportService.report(ReportType.HostAdCreate, adSessionParamsMock);

            expect(_counter).toEqual(2);
            expect(httpService.post).toReturnWith(
                expect.objectContaining({ lastAdLifeCycleEventName: ReportDefaultValue.NA })
            );
        });

        it('Test previous event name is ERROR and current event name is HOST_AD_INIT - lastAdLifeCycleEventName is ERROR', async () => {
            await reportService.report(ReportType.Error, adSessionParamsMock);
            await reportService.report(ReportType.HostAdInit, adSessionParamsMock);

            expect(_counter).toEqual(2);
            expect(httpService.post).toReturnWith(
                expect.objectContaining({ lastAdLifeCycleEventName: ReportType.Error })
            );
        });

        it('Test previous previous event name is AD_CREATED, previous event name is ERROR and current event name is HOST_AD_INIT - lastAdLifeCycleEventName is AD_CREATED', async () => {
            await reportService.report(ReportType.AdCreated, adSessionParamsMock);
            await reportService.report(ReportType.Error, adSessionParamsMock);
            await reportService.report(ReportType.AdInit, adSessionParamsMock);

            expect(_counter).toEqual(3);
            expect(httpService.post).toReturnWith(
                expect.objectContaining({ lastAdLifeCycleEventName: ReportType.AdCreated })
            );
        });

        it('Test previous event name is AD_ERROR and current event name is HOST_AD_CREATE - lastAdLifeCycleEventName is NA', async () => {
            await reportService.report(ReportType.AdError, adSessionParamsMock);
            await reportService.report(ReportType.HostAdCreate, adSessionParamsMock);

            expect(_counter).toEqual(2);
            expect(httpService.post).toReturnWith(
                expect.objectContaining({ lastAdLifeCycleEventName: ReportDefaultValue.NA })
            );
        });

        it('Test previous event name is AD_ERROR and current event name is HOST_AD_INIT - lastAdLifeCycleEventName is AD_ERROR', async () => {
            await reportService.report(ReportType.AdError, adSessionParamsMock);
            await reportService.report(ReportType.HostAdInit, adSessionParamsMock);

            expect(_counter).toEqual(2);
            expect(httpService.post).toReturnWith(
                expect.objectContaining({ lastAdLifeCycleEventName: ReportType.AdError })
            );
        });

        it('Test previous previous event name is AD_CREATED, previous event name is AD_ERROR and current event name is AD_LOADED - lastAdLifeCycleEventName is AD_CREATED', async () => {
            await reportService.report(ReportType.AdCreated, adSessionParamsMock);
            await reportService.report(ReportType.AdError, adSessionParamsMock);
            await reportService.report(ReportType.AdLoaded, adSessionParamsMock);

            expect(_counter).toEqual(3);
            expect(httpService.post).toReturnWith(
                expect.objectContaining({ lastAdLifeCycleEventName: ReportType.AdCreated })
            );
        });
    });

    describe('reportService - check reporting of adLifeCycle events', () => {
        let reportService;
        let httpService;
        let response;
        beforeEach(async () => {
            resetMocks();
            httpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            reportService = ReportService.getInstance();
            InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new mockedDelegate());

            jest.spyOn(httpService, 'post').mockImplementation((url: string, options: {}, reqBody: {}) => {
                response = JSON.parse(reqBody.toString())
                return response;
            });
            ConfigService.getInstance().update({
                loginRes: { configuration: { nr_url: 'https://log-api.newrelic.com/log/v1' } } as any
            });
            reportService.init();
        });

        it('check params are defined and numeric in adLifeCycle events', async () => {
            await reportService.report(ReportType.AdStarting, adSessionParamsMock);

            await reportService.report(ReportType.AdStarted, adSessionParamsMock);

            expect(response.lastAdLifeCycleEventName).toBeDefined();

            expect(response.timeSinceLastLifeCycleEvent).toBeDefined();
            expect(typeof response.timeSinceLastLifeCycleEvent).toEqual('number');

            expect(response.timeSinceStarted).toBeDefined();
            expect(typeof response.timeSinceStarted).toEqual('number');
        });

        it('check params are undefined if event name is REFRESH', async () => {
            reportService.setupAdSessionMetricsParams(adSessionParamsMock as any);

            await reportService.reportNoAdLifeCycleEvent(ReportType.Refresh, adSessionParamsMock);

            expect(response.opportunityType).not.toBeDefined();
            expect(response.context).not.toBeDefined();
        });

        it('check params are undefined if event name is LOGIN', async () => {
            reportService.setupAdSessionMetricsParams(adSessionParamsMock as any);

            await reportService.reportNoAdLifeCycleEvent(ReportType.Login, adSessionParamsMock);

            expect(response.opportunityType).not.toBeDefined();
            expect(response.context).not.toBeDefined();
        });
        it('check params are undefined if event name is ERROR', async () => {
            reportService.setupAdSessionMetricsParams(adSessionParamsMock as any);

            await reportService.reportNoAdLifeCycleEvent(ReportType.Error, adSessionParamsMock);

            expect(response.opportunityType).not.toBeDefined();
            expect(response.context).not.toBeDefined();
        });
    });

    describe('reportService - general tests', () => {
        let httpService: HttpService;
        let reportService: ReportService;
        beforeAll(async () => {
            resetMocks();
            UuidGenerator.generate = jest.fn().mockImplementation(() => '1234-5678');
            reportService = ReportService.getInstance();
            InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new mockedDelegate());
            ConfigService.getInstance().update({
                loginRes: { configuration: { nr_url: 'https://log-api.newrelic.com/log/v1' } } as any
            });
            reportService.init();
            reportService['_addAdditionalMetricsParams'] = jest.fn().mockImplementation(() => ({
                isSDKTrace: false,
                loginState: true
            }));
            // @ts-ignore
            reportService._commonSDKMetricsParams = sdkCommonParamsMock;
            httpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
        });

        it('Test that reportService is initialized as default', async () => {
            expect(reportService.isInitialized()).toBe(true);
        });

        it('Test that reportService is initialized', async () => {
            reportService['_isInitialized'] = true;
            const isUuidGeneratorCalled = jest.spyOn(UuidGenerator, 'generate');
            reportService.init();

            expect(isUuidGeneratorCalled).not.toBeCalled();
        });

        it('Test that reportService is NOT initialized', async () => {
            reportService['_isInitialized'] = false;
            const isUuidGeneratorCalled = jest.spyOn(UuidGenerator, 'generate');
            reportService.init();

            expect(isUuidGeneratorCalled).toBeCalled();
        });
        it('Test reportService report function with LOGIN report type in bulks', async () => {
            reportService['delegate'].putInReportQueue = jest.fn().mockImplementation();
            const featureFlagService = FeatureFlagsService.getInstance();
            jest.spyOn(featureFlagService, 'reportInBulksEnabled', 'get').mockReturnValue(true);
            const args = new Map<string, string>();
            args.set('test', 'test');
            args.set('name', 'moti');
            await reportService.reportLogin(
                args,
                {
                    loginRequestId: 'test',
                    isSilent: false,
                    success: true,
                    mode: ReportLoginMode.PreAuth
                },
                ReportType.Login
            );
            expect(reportService.delegate.putInReportQueue).toBeCalledTimes(1);
        });

        it('Test reportService report function with LOGIN report type', async (done) => {
            jest.spyOn(reportService['_featureFlagsService'], 'reportInBulksEnabled', 'get').mockReturnValue(false);
            const args = new Map<string, string>();
            args.set('test', 'test');
            args.set('name', 'moti');
            jest.spyOn(httpService, 'post').mockImplementation(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                async (url: string, options: Record<string, unknown>, reqBody: Record<string, unknown>) => ({} as any)
            );
            await reportService.reportLogin(
                args,
                {
                    loginRequestId: 'test',
                    isSilent: false,
                    success: true,
                    mode: ReportLoginMode.PreAuth
                },
                ReportType.Login
            );

            expect(httpService.post).toBeCalledTimes(1);
            done();
        });

        // it('Test reportService  report function with LOGIN report type', async () => {
        //     await reportService.report(ReportType.Login, { test: 'test', name: 'LOGIN' });
        //     expect(httpService.post).toBeCalledTimes(1);
        // });

        it('Test reportService report function with LOGIN report type bulks enabled', async () => {
            reportService['_putInBulkQueue'] = jest.fn().mockImplementation();
            const featureFlagService = FeatureFlagsService.getInstance();
            jest.spyOn(featureFlagService, 'reportInBulksEnabled', 'get').mockReturnValue(true);
            await reportService.report(ReportType.Login, { test: 'test', name: 'LOGIN' });
            expect(reportService['_putInBulkQueue']).toBeCalledTimes(1);
            expect(httpService.post).toBeCalledTimes(0);
        });

        it('Test reportService report function with AD_INIT report type - Add adSessionMetricsParams', async () => {
            reportService['_returnLastAdLifeCycleEventName'] = jest.fn().mockImplementation(() => ({
                lastAdLifeCycleEventName: 'AD_CREATED'
            }));
            reportService['_updateSinceTimeParams'] = jest.fn().mockImplementation(() => ({
                timeSinceLastLifeCycleEvent: 15
            }));
            reportService['_putInBulkQueue'] = jest.fn().mockImplementation();
            await reportService.report(ReportType.AdInit, adSessionParamsMock);
            expect(reportService['_putInBulkQueue']).toBeCalledTimes(1);
        });

        it('Test reportService report function with AD_STOPPING report type - clean adSessionMetricsParams', async (done) => {
            await reportService.report(ReportType.AdStopped, adSessionParamsMock);
            expect(reportService['_adSessionMetricsParams']).toEqual({});
            done();
        });
    });

    describe('reportService - lastAdLifeCycleEventName', () => {
        let reportService: ReportService;

        beforeEach(async () => {
            // @ts-ignore
            reportService = new ReportService();
            InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new mockedDelegate());
            reportService.init();
        });

        it('Test previous event name in LOGIN event - toEqual {}', async (done) => {
            await reportService.report(ReportType.Login, adSessionParamsMock);
            const lastAdLifeCycleEventName = reportService['_returnLastAdLifeCycleEventName'](ReportType.Login);
            expect(lastAdLifeCycleEventName).toEqual({});
            done();
        });

        it('Test reportLogin', async (done) => {
            const args = new Map<string, string>();
            args.set('a', '1');
            args.set('b', '2');
            await reportService.reportLogin(
                args,
                {
                    loginRequestId: '3214324',
                    isSilent: true,
                    success: true,
                    mode: ReportLoginMode.PreAuth
                },
                ReportType.Login
            );
            // @ts-ignore
            const lastAdLifeCycleEventName = reportService._returnLastAdLifeCycleEventName(ReportType.Login);
            expect(lastAdLifeCycleEventName).toEqual({});
            done();
        });

        it('Test previous event name in HOST_AD_CREATE event - toEqual NA ', async () => {
            await reportService.report(ReportType.HostAdCreate, adSessionParamsMock);

            expect(reportService['_lastEvent'].reportEvent).toEqual({
                lastAdLifeCycleEventName: ReportType.HostAdCreate
            });
            const stateBeforeLast = reportService['_returnLastAdLifeCycleEventName'](ReportType.HostAdCreate);
            expect(stateBeforeLast).toEqual({ lastAdLifeCycleEventName: ReportDefaultValue.NA });
        });

        it('Test previous event name in AD_CREATED event - toEqual HOST_AD_CREATE', async () => {
            await reportService.report(ReportType.HostAdCreate, adSessionParamsMock);
            const stateBeforeLast = reportService['_returnLastAdLifeCycleEventName'](ReportType.AdCreated);
            expect(reportService['_lastEvent'].reportEvent).toEqual({ lastAdLifeCycleEventName: ReportType.AdCreated });
            expect(stateBeforeLast).toEqual({ lastAdLifeCycleEventName: ReportType.HostAdCreate });
        });

        it('Test previous event name in AD_LOADED event - toEqual AD_INIT', async () => {
            await reportService.report(ReportType.AdInit, adSessionParamsMock);
            const stateBeforeLast = reportService['_returnLastAdLifeCycleEventName'](ReportType.AdLoaded);
            expect(reportService['_lastEvent'].reportEvent).toEqual({ lastAdLifeCycleEventName: ReportType.AdLoaded });
            expect(stateBeforeLast).toEqual({ lastAdLifeCycleEventName: ReportType.AdInit });
        });
    });

    describe('reportService - Time Since Params', () => {
        let httpService;
        let reportService: ReportService;
        beforeAll(async () => {
            // @ts-ignore
            reportService = new ReportService();
            InjectionContainer.registerInstance(ContainerDef.reportServiceDelegate, new mockedDelegate());
            reportService.init();
            httpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            jest.spyOn(httpService, 'post').mockImplementation((url: string, options: {}, reqBody: {}) => reqBody);
        });
        const sleep = (ms): Promise<void> => new Promise((res) => setTimeout(res, ms));
        it('Test time Since Parameters ', async () => {
            await reportService.report(ReportType.HostAdCreate);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.LastLifeCycleEvent)).toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            await reportService.report(ReportType.AdCreated);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.LastLifeCycleEvent)).not.toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.AdCreated)).toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.AdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            reportService.report(ReportType.AdLoaded);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            reportService.report(ReportType.HostAdInit);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            reportService.report(ReportType.AdInit);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            await reportService.report(ReportType.HostAdStart);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.LastLifeCycleEvent)).not.toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.AdCreated)).not.toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.AdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            reportService.report(ReportType.AdStarting);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            await reportService.report(ReportType.AdStarted);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.LastLifeCycleEvent)).not.toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.AdCreated)).not.toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).not.toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.AdStarted)).toEqual(0);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            reportService.report(ReportType.AdPlaying);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);

            await sleep(10);
            reportService.report(ReportType.HostAdStop);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(0);

            await sleep(10);
            reportService.report(ReportType.AdStopping);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).not.toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).not.toEqual(undefined);

            await sleep(10);
            reportService.report(ReportType.AdStopped);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdCreated)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdInit)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStarted)).toEqual(undefined);
            expect(reportService['_timeSinceParams'].get(TimeSinceEvent.HostAdStop)).toEqual(undefined);
        });

        it('verify that timeSinceParams map is converted to object', () => {
            reportService['_timeSinceParams'] = new Map();
            reportService['_lastEvent'].eventTime = Date.now();
            reportService['_timeSinceParams'].set(TimeSinceEvent.AdStart, 2);
            reportService['_timeSinceParams'].set(TimeSinceEvent.HostAdStarted, 3);
            const timeSinceObj = reportService['_updateSinceTimeParams'](ReportType.AdStarting);
            expect(timeSinceObj).toEqual({ HOST_AD_START: 3, timeSinceLastLifeCycleEvent: 0, timeSinceStart: 2 });
        });
    });

    describe('reportService - buildStringFromArgsMap', () => {
        it('buildStringFromArgsMap function retrieves a string that includes opportunityType=screensaver if it gets it from initAdinfo', async () => {
            const initAdinfo = new Map<string, string>([
                ['foo', 'bar'],
                ['platform', 'dfw'],
                ['sdkName', 'tvos'],
                ['contentType', 'vod'],
                ['userType', '2'],
                ['sdkVersion', 'v1'],
                ['tenantSystemName', 'directv'],
                ['deviceType', 'tvos'],
                ['opportunityType', 'screensaver'],
                ['context', 'pause']
            ]);

            const stringToReport = ArrayHelper.buildStringFromArgsMap(initAdinfo);
            expect(stringToReport).toContain('opportunityType=screensaver');
            expect(stringToReport).toContain('context=pause');
        });

        it('buildStringFromArgsMap function retrieves a string that does NOT include opportunityType=screensaver if initAdinfo does NOT include it', async () => {
            const initAdinfo = new Map<string, string>([
                ['foo', 'bar'],
                ['platform', 'dfw'],
                ['sdkName', 'tvos'],
                ['contentType', 'vod'],
                ['userType', '2'],
                ['sdkVersion', 'v1'],
                ['tenantSystemName', 'directv'],
                ['deviceType', 'tvos']
            ]);

            const stringToReport = ArrayHelper.buildStringFromArgsMap(initAdinfo);
            expect(stringToReport).not.toContain('opportunityType=screensaver');
            expect(stringToReport).not.toContain('context=pause');
        });
    });

    describe('reportService - report _isInitialized and reportInBulksEnabled params ', () => {
        let featureFlagService;
        let httpService;
        let reportService: ReportService;
        beforeEach(async () => {
            resetMocks();
            httpService = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
            jest.spyOn(httpService, 'post').mockImplementation((url: string, options: {}, reqBody: {}) => reqBody);
            featureFlagService = FeatureFlagsService.getInstance();
            reportService = ReportService.getInstance();
            ConfigService.getInstance().update({
                loginRes: { configuration: { nr_url: 'https://log-api.newrelic.com/log/v1' } } as any
            });

            reportService.init();
            reportService['_isInitialized'] = false;
        });
        afterEach(() => {
            jest.resetAllMocks();
        });
        it('Test reportService  report function with LOGIN report type isInitialized false reportInBulksEnabled false', async () => {
            jest.spyOn(featureFlagService, 'reportInBulksEnabled', 'get').mockReturnValue(false);
            await reportService.report(ReportType.Login, { test: 'test', name: 'LOGIN' });
            expect(httpService.post).toBeCalledTimes(0);
        });
        it('Test reportService  report function with LOGIN Failed report type isInitialized true reportInBulksEnabled false', async () => {
            jest.spyOn(featureFlagService, 'reportInBulksEnabled', 'get').mockReturnValue(false);
            reportService['_isInitialized'] = true;
            await reportService.report(ReportType.Login, { test: 'test', name: 'LOGIN' });
            expect(httpService.post).toBeCalledTimes(1);
        });
        it('Test reportService  report function with LOGIN Failed report false reportInBulksEnabled true', async () => {
            reportService['_putInBulkQueue'] = jest.fn();
            jest.spyOn(reportService['_featureFlagsService'], 'reportInBulksEnabled', 'get').mockReturnValue(true);
            await reportService.report(ReportType.Login, { test: 'test', name: 'LOGIN' });
            expect(reportService['_putInBulkQueue']).toBeCalledTimes(1);
        });
        it('Test reportService  report function with LOGIN Failed report false reportInBulksEnabled true', async () => {
            reportService['_putInBulkQueue'] = jest.fn();
            reportService['_isInitialized'] = true;
            jest.spyOn(reportService['_featureFlagsService'], 'reportInBulksEnabled', 'get').mockReturnValue(true);
            await reportService.report(ReportType.Login, { test: 'test', name: 'LOGIN' });
            expect(reportService['_putInBulkQueue']).toBeCalledTimes(1);
        });
    });
});
