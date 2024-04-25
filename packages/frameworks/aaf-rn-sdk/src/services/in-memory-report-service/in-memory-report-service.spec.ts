/* eslint-disable max-len */
import '../../mock';
import { ReportService } from '@xaaf/xaaf-js-sdk';
import { InMemoryReportService } from './in-memory-report-service';

const mockedReportingBulkSize = 5;
const mockedReportingBulkDelayMS = 500;

describe('InMemoryReportService tests', () => {
    let inMemoryReportServiceUnderTest: InMemoryReportService;

    beforeEach(() => {
        given_spiedReportService_withMockedSendReports();
        given_inMemoryReportServiceUnderTest();
    });

    afterEach(() => {
        terminate_inMemoryReportServiceUnderTest();
    });

    // eslint-disable-next-line jest/expect-expect
    it(
        'putInReportQueue() is executed fewer than bulkSize number of times - should store all reports without sending them, and upon timer expiration send all reports and remove all reports from storage',
        async (done) => {
            const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize - 1);

            await when_putInReportQueueIsExecutedSynchronously_numberOfTimesWith(
                mockedReportRecords,
                0,
                mockedReportingBulkSize - 1
            );

            then_sendReportsIsNotExecuted_onReportService();

            setTimeout(async () => {
                then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);
                done();
            }, mockedReportingBulkDelayMS + 500);
        },
        mockedReportingBulkDelayMS + 1000
    );

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() is executed bulkSize number of times - should send all reports and remove all reports from storage', async () => {
        const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);

        const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_numberOfTimesWith(
            mockedReportRecords,
            0,
            mockedReportingBulkSize
        );

        then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize, true);
        then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);
    });

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() is executed more than bulkSize number of times ,first bulkSize reports send immediately and other by timer ', async (done) => {
        const putInReportQueueResults = new Array<boolean>();

        const mockedReportRecords1 = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);
        //executes the first bulkSize - 1 putInReportQueue()
        await when_putInReportQueueIsExecuted_numberOfTimesWith(
            mockedReportRecords1,
            0,
            mockedReportingBulkSize - 1
        ).then((results) => {
            results.forEach((result) => putInReportQueueResults.push(result));
        });

        //put the bulkSize'th report which should send reports immediately
        await putInReportQueue(mockedReportRecords1[mockedReportingBulkSize - 1]).then(async (result) => {
            putInReportQueueResults.push(result);
        });

        const reportsSize2 = mockedReportingBulkSize - 2;
        const mockedReportRecords2 = given_numberOf_differentMockedReportRecords(reportsSize2);

        //executes the rest putInReportQueue() for other reports
        when_putInReportQueueIsExecuted_numberOfTimesWith(mockedReportRecords2, 0, reportsSize2).then((results) => {
            results.forEach((result) => putInReportQueueResults.push(result));

            //validate only first bulkSize report where sent immediately
            then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize + reportsSize2, true);
            then_sendReportsIsExecuted_onReportService_with(mockedReportRecords1);

            setTimeout(async () => {
                //last reports sent only after timer
                then_sendReportsIsExecuted_onReportService_with(mockedReportRecords2);
                done();
            }, mockedReportingBulkDelayMS + 500);
        });
    }, 2000);

    it('safeSendInMemoryReports() dont send 2 bulks in same time', async (done) => {
        const underTest: InMemoryReportService = new InMemoryReportService();
        underTest.init(2000, 1, true);
        const [
            mockedReportRecord1,
            mockedReportRecord2,
            mockedReportRecord3
        ] = given_numberOf_differentMockedReportRecords(3);
        Promise.all([
            underTest.putInReportQueue(mockedReportRecord1),
            underTest.putInReportQueue(mockedReportRecord2)
        ]).then(() => {
            //first bulk sent immediately
            expect(ReportService.getInstance().sendReports).toHaveBeenCalledTimes(1);
            underTest.putInReportQueue(mockedReportRecord3);
            //second bulk sent only after another putInReportQueue
            expect(ReportService.getInstance().sendReports).toHaveBeenCalledTimes(2);
            underTest.clearResources();
            done();
        });
    });

    it('when not put any report in queue, no report is sent', async (done) => {
        setTimeout(async () => {
            expect(ReportService.getInstance().sendReports).toHaveBeenCalledTimes(0);
            done();
        }, mockedReportingBulkDelayMS + 500);
    });

    it('when bulk feature flag is false, the timer not started and no report is sent', async (done) => {
        const underTest: InMemoryReportService = new InMemoryReportService();
        underTest.init(2000, 1, false);
        expect(underTest.isInitialized()).toBeFalsy();
        setTimeout(async () => {
            expect(ReportService.getInstance().sendReports).toHaveBeenCalledTimes(0);
            done();
        }, mockedReportingBulkDelayMS + 500);
    });

    it('isInitialized return true if InMemoryReportService was initialized', () => {
        const underTest: InMemoryReportService = new InMemoryReportService();
        underTest.init(2000, 1, true);
        expect(underTest.isInitialized()).toBeTruthy();
    });

    it('isInitialized return false if InMemoryReportService was not initialized', () => {
        const underTest: InMemoryReportService = new InMemoryReportService();
        expect(underTest.isInitialized()).toBeFalsy();
    });

    it('in case of sendReports failed, reports are sent in next cycle', async (done) => {
        const sendReportSpy = jest
            .spyOn(ReportService.getInstance(), 'sendReports')
            .mockReturnValue(Promise.resolve(false));
        await sendReportFailedAndThenSentAgain(sendReportSpy, done);
    });

    it('in case of sendReports throw error, reports are sent in next cycle', async (done) => {
        const sendReportSpy = jest
            .spyOn(ReportService.getInstance(), 'sendReports')
            .mockReturnValue(Promise.reject(new Error('mock error')));
        await sendReportFailedAndThenSentAgain(sendReportSpy, done);
    });

    async function sendReportFailedAndThenSentAgain(
        sendReportSpy: jest.SpyInstance,
        done: jest.DoneCallback
    ): Promise<void> {
        const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);

        const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_numberOfTimesWith(
            mockedReportRecords,
            0,
            mockedReportingBulkSize
        );

        then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize, true);
        then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);

        sendReportSpy.mockClear();
        given_spiedReportService_withMockedSendReports();

        setTimeout(async () => {
            then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);
            done();
        }, mockedReportingBulkDelayMS + 500);
    }

    function given_spiedReportService_withMockedSendReports(): void {
        jest.spyOn(ReportService.getInstance(), 'sendReports').mockReturnValue(Promise.resolve(true));
    }

    function given_inMemoryReportServiceUnderTest(): void {
        inMemoryReportServiceUnderTest = InMemoryReportService.getInstance();
        inMemoryReportServiceUnderTest.init(mockedReportingBulkDelayMS, mockedReportingBulkSize, true);
    }

    function given_numberOf_differentMockedReportRecords(
        numberOfReports: number
    ): Array<Record<string, string | number | boolean>> {
        const mockedReportRecords = new Array<Record<string, string | number | boolean>>();
        for (let index = 0; index < numberOfReports; ++index) {
            mockedReportRecords.push(createMockedReportRecordWithClientTime(index.toString()));
        }
        return mockedReportRecords;
    }

    function createMockedReportRecordWithClientTime(
        mockedClientTime: string
    ): Record<string, string | number | boolean> {
        return {
            appName: 'Sample App',
            appVersion: '3.0.21105.01005',
            device: 'mockedDevice',
            deviceGroup: 'NA',
            deviceManufacturer: 'mockedDeviceManufacturer',
            deviceModel: 'mockedDeviceModel',
            deviceType: 'tvos',
            deviceUUID: '5359ec9d-bb15-47f6-a831-2e137613275a',
            externalIP: 'NA',
            internalIP: 'NA',
            osName: 'mockedOSName',
            osVersion: 'mockedOSVersion',
            platform: 'dfw',
            platformAdvId: '3549c695-c7bf-4111-a2ce-5f6bb24a5e10',
            platformName: 'mockedPlatformName',
            sdkName: 'mockedSdkName',
            sdkVersion: '1.10.1',
            tenantName: '"directv',
            userType: '2',
            memUsageMb: 'NA',
            appMode: 'debug',
            clientTime: mockedClientTime,
            isSDKTrace: false,
            loginState: true,
            eventType: 'XandrSDK',
            sessionId: '2bad5366-fa79-47ac-817b-76aba7dfcb43',
            exeAdUUID: 'ee3c3eca-7107-47b1-b8dc-a7018f5bd671',
            opportunityType: 'screensaver',
            context: 'pause',
            name: 'AD_CREATED',
            featureFlags: 'xaafEnabled,httpTimeoutEnabled',
            timeSinceLastLifeCycleEvent: 8175,
            HOST_AD_CREATE: 8175,
            timeSinceAdCreatedEvent: 0,
            lastAdLifeCycleEventName: 'HOST_AD_CREATE'
        };
    }

    function convertMockedReportRecordsToJSONStrings(
        mockedReportRecords: Array<Record<string, string | number | boolean>>
    ): Array<string> {
        return mockedReportRecords.map((mockedReportRecord) => JSON.stringify(mockedReportRecord));
    }

    async function when_putInReportQueueIsExecuted_numberOfTimesWith(
        mockedReportRecords: Array<Record<string, string | number | boolean>>,
        firstIndex: number,
        lastIndexExcluded: number
    ): Promise<Array<boolean>> {
        return new Promise((resolve) => {
            const putInReportQueueResults = new Array<boolean>();
            for (let index = firstIndex; index < lastIndexExcluded; ++index) {
                putInReportQueue(mockedReportRecords[index]).then((result) => {
                    putInReportQueueResults.push(result);
                    if (putInReportQueueResults.length === lastIndexExcluded - firstIndex) {
                        resolve(putInReportQueueResults);
                    }
                });
            }
        });
    }

    async function when_putInReportQueueIsExecutedSynchronously_numberOfTimesWith(
        mockedReportRecords: Array<Record<string, string | number | boolean>>,
        firstIndex: number,
        lastIndexExcluded: number
    ): Promise<Array<boolean>> {
        const putInReportQueueResults = new Array<boolean>();
        for (let index = firstIndex; index < lastIndexExcluded; ++index) {
            putInReportQueueResults.push(await putInReportQueue(mockedReportRecords[index]));
        }

        return putInReportQueueResults;
    }

    async function putInReportQueue(mockedReportRecord: Record<string, string | number | boolean>): Promise<boolean> {
        return inMemoryReportServiceUnderTest.putInReportQueue(mockedReportRecord);
    }

    function then_putInReportQueueResultsAre(
        putInReportQueueResults: Array<boolean>,
        expectedNumberOfResults: number,
        expectedResult: boolean
    ): void {
        expect(putInReportQueueResults.length).toEqual(expectedNumberOfResults);
        putInReportQueueResults.forEach((putInReportQueueResult) => {
            expect(putInReportQueueResult).toEqual(expectedResult);
        });
    }

    function then_sendReportsIsNotExecuted_onReportService(): void {
        expect(ReportService.getInstance().sendReports).toHaveBeenCalledTimes(0);
    }

    function then_sendReportsIsExecuted_onReportService_with(
        mockedReportRecords: Array<Record<string, string | number | boolean>>
    ): void {
        const mockedReportRecordJSONStrings = convertMockedReportRecordsToJSONStrings(mockedReportRecords);
        expect(ReportService.getInstance().sendReports).toHaveBeenCalledWith(mockedReportRecordJSONStrings);
    }

    function terminate_inMemoryReportServiceUnderTest(): void {
        inMemoryReportServiceUnderTest.clearResources();
    }
});
