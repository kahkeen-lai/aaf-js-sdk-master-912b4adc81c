/* eslint-disable max-len */
import '../../mock';
import { PersistentReportService } from './persistent-report-service';
import { ConfigService, ReportService } from '@xaaf/xaaf-js-sdk';
import { BulkConfiguration, ContainerDef, default as Core, InjectionContainer } from '@xaaf/common';
import { mockedSecureAsyncStorage } from '../../mock';

const mockedStorageDefaultGetItemMethod = mockedSecureAsyncStorage.getItem;
const mockedStorageDefaultSetItemMethod = mockedSecureAsyncStorage.setItem;
const mockedStorageDefaultGetAllKeysMethod = mockedSecureAsyncStorage.getAllKeys;
const mockedStorageDefaultMultiRemoveMethod = mockedSecureAsyncStorage.multiRemove;
const mockedStorageDefaultMultiGetMethod = mockedSecureAsyncStorage.multiGet;

const mockedReportingBulkSize = 5;
const mockedReportingBulkDelayMS = 5000;

class MockedConfigService extends ConfigService {
    private mockedBulkConfiguration: BulkConfiguration = {
        reportingBulk: mockedReportingBulkSize,
        reportingBulkDelay: mockedReportingBulkDelayMS
    };

    get bulkConfiguration(): Core.BulkConfiguration {
        return this.mockedBulkConfiguration;
    }
}

describe('PersistentReportService tests', () => {
    const mockedStorage = mockedSecureAsyncStorage;
    let persistentReportServiceUnderTest;

    // eslint-disable-next-line jest/expect-expect
    it(
        'putInReportQueue() is executed fewer than bulkSize number of times - should store all reports without sending them, and upon timer expiration send all reports and remove all reports from storage',
        async (done) => {
            given_mockedConfigurationService();
            given_mockedStorage();
            given_spiedReportService_withMockedSendReports();

            given_persistentReportServiceUnderTest();
            const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize - 1);

            const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_onPersistentReportService_numberOfTimesWith(
                mockedReportRecords,
                0,
                mockedReportingBulkSize - 1
            );

            then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize - 1, true);
            await then_storage_containsReports(mockedReportRecords);
            then_sendReportsIsNotExecuted_onReportService();

            setTimeout(async () => {
                then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);
                await then_storage_containsNoReports();

                terminate_persistentReportServiceUnderTest();
                done();
            }, mockedReportingBulkDelayMS + 1000);
        },
        mockedReportingBulkDelayMS + 2000
    );

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() is executed bulkSize number of times - should send all reports and remove all reports from storage', async () => {
        given_mockedConfigurationService();
        given_mockedStorage();
        given_spiedReportService_withMockedSendReports();

        given_persistentReportServiceUnderTest();
        const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);

        const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_onPersistentReportService_numberOfTimesWith(
            mockedReportRecords,
            0,
            mockedReportingBulkSize
        );

        then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize, true);
        then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);
        await then_storage_containsNoReports();

        terminate_persistentReportServiceUnderTest();
    });

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() is executed more than bulkSize number of times - should send all reports and remove all reports from storage', async (done) => {
        //Note:

        /* when putInReportQueue() is executed on persistent report service and number of reports reaches
        bulkSize, a bulk report is triggered. this leads to the question how can more than bulkSize reports
        can be stored. since a check whether number of stored reports reached bulkSize happens only AFTER
        storing the report to storage, which is an ASYNCHRONOUS action,
        it allows the next call (if exists) to putInReportQueue() to occur, which may increase the number
        of reports above bulkSize.
        */
        given_mockedConfigurationService();
        given_mockedStorage();
        given_spiedReportService_withMockedSendReports();

        given_persistentReportServiceUnderTest();
        const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize + 3);

        const putInReportQueueResults = new Array<boolean>();

        //executes the first bulkSize - 1 putInReportQueue()
        when_putInReportQueueIsExecuted_onPersistentReportService_numberOfTimesWith(
            mockedReportRecords,
            0,
            mockedReportingBulkSize - 1
        ).then((results) => {
            results.forEach((result) => putInReportQueueResults.push(result));
        });

        //putInReportQueue() for the bulkSize'th triggers the bulk reporting, therefore is executed differently with a
        //then lambda, to be able to perform test validations only after bulk is handled
        when_putInReportQueueIsExecuted_onPersistentReportService_with(
            mockedReportRecords[mockedReportingBulkSize - 1]
        ).then(async (result) => {
            putInReportQueueResults.push(result);

            then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize + 3, true);
            then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);
            await then_storage_containsNoReports();

            terminate_persistentReportServiceUnderTest();
            done();
        });

        //executes the rest putInReportQueue()
        when_putInReportQueueIsExecuted_onPersistentReportService_numberOfTimesWith(
            mockedReportRecords,
            mockedReportingBulkSize,
            mockedReportRecords.length
        ).then((results) => {
            results.forEach((result) => putInReportQueueResults.push(result));
        });
    }, 5000);

    // eslint-disable-next-line jest/expect-expect
    it(
        'putInReportQueue() is executed bulkSize number of times - and fewer than bulkSize during bulk is sent - should sent first bulk and remove from storage, and upon timer expiration send second bulk and remove it from storage',
        async (done) => {
            given_mockedConfigurationService();
            given_mockedStorage();
            let extraReportRecords;
            given_spiedReportService_withMockedSendReports(() => {
                extraReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize - 1);
                when_putInReportQueueIsExecuted_onPersistentReportService_numberOfTimesWith(
                    extraReportRecords,
                    0,
                    mockedReportingBulkSize - 1
                );
            });

            given_persistentReportServiceUnderTest();
            const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);

            const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_onPersistentReportService_numberOfTimesWith(
                mockedReportRecords,
                0,
                mockedReportingBulkSize
            );

            then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize, true);
            then_sendReportsIsExecuted_onReportService_with(mockedReportRecords);
            await then_storage_containsReports(extraReportRecords);

            setTimeout(async () => {
                then_sendReportsIsExecuted_onReportService_with(extraReportRecords);
                await then_storage_containsNoReports();

                terminate_persistentReportServiceUnderTest();
                done();
            }, mockedReportingBulkDelayMS + 1000);
        },
        mockedReportingBulkDelayMS + 2000
    );

    //error handling tests

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() - error when storing report - should not send report and have no reports stored in storage', async () => {
        given_mockedConfigurationService();
        given_mockedStorage_throwingErrorOn_setItem();
        given_spiedReportService_withMockedSendReports();

        given_persistentReportServiceUnderTest();
        const mockedReportRecord = given_numberOf_differentMockedReportRecords(1)[0];

        const putInQueueResult = await when_putInReportQueueIsExecuted_onPersistentReportService_with(
            mockedReportRecord
        );

        setTimeout(async () => {
            then_putInReportQueueResultIs(putInQueueResult, false);
            then_sendReportsIsNotExecuted_onReportService();
            await then_storage_containsNoReports();

            terminate_persistentReportServiceUnderTest();
        }, mockedReportingBulkDelayMS + 1000);
    });

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() is executed bulkSize number of times - error when getting keys of reports to send - should not send any report and have all reports stored in storage', async () => {
        given_mockedConfigurationService();
        given_mockedStorage_throwingErrorOn_getAllKeys();
        given_spiedReportService_withMockedSendReports();

        given_persistentReportServiceUnderTest();
        const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);

        const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_onPersistentReportService_numberOfTimesWith(
            mockedReportRecords,
            0,
            mockedReportingBulkSize
        );

        setTimeout(async () => {
            then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize, true);
            await then_storage_containsReports(mockedReportRecords);
            then_sendReportsIsNotExecuted_onReportService();

            terminate_persistentReportServiceUnderTest();
        }, mockedReportingBulkDelayMS + 1000);
    });

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() is executed bulkSize number of times - error when getting reports to send - should not send any report and have all reports stored in storage', async () => {
        given_mockedConfigurationService();
        given_mockedStorage_throwingErrorOn_multiGet();
        given_spiedReportService_withMockedSendReports();

        given_persistentReportServiceUnderTest();
        const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);

        const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_onPersistentReportService_numberOfTimesWith(
            mockedReportRecords,
            0,
            mockedReportingBulkSize
        );

        setTimeout(async () => {
            then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize, true);
            await then_storage_containsReports(mockedReportRecords);
            then_sendReportsIsNotExecuted_onReportService();

            terminate_persistentReportServiceUnderTest();
        }, mockedReportingBulkDelayMS + 1000);
    });

    // eslint-disable-next-line jest/expect-expect
    it('putInReportQueue() is executed bulkSize number of times - error when removing sent reports - should send all reports and have all reports stored in storage', async () => {
        given_mockedConfigurationService();
        given_mockedStorage_throwingErrorOn_multiRemove();
        given_spiedReportService_withMockedSendReports();

        given_persistentReportServiceUnderTest();
        const mockedReportRecords = given_numberOf_differentMockedReportRecords(mockedReportingBulkSize);

        const putInReportQueueResults = await when_putInReportQueueIsExecutedSynchronously_onPersistentReportService_numberOfTimesWith(
            mockedReportRecords,
            0,
            mockedReportingBulkSize
        );

        setTimeout(async () => {
            then_putInReportQueueResultsAre(putInReportQueueResults, mockedReportingBulkSize, true);
            await then_storage_containsReports(mockedReportRecords);
            await then_sendReportsIsExecuted_onReportService_with(mockedReportRecords); // NOSONAR

            terminate_persistentReportServiceUnderTest();
        }, mockedReportingBulkDelayMS + 1000);
    });

    function given_mockedConfigurationService(): void {
        InjectionContainer.registerSingleton(ContainerDef.configService, MockedConfigService);
    }

    function given_mockedStorage(): void {
        mockedStorage.getItem = mockedStorageDefaultGetItemMethod;
        mockedStorage.setItem = mockedStorageDefaultSetItemMethod;
        mockedStorage.getAllKeys = mockedStorageDefaultGetAllKeysMethod;
        mockedStorage.multiRemove = mockedStorageDefaultMultiRemoveMethod;
        mockedStorage.multiGet = mockedStorageDefaultMultiGetMethod;

        mockedStorage.removeAll();
    }

    function given_mockedStorage_throwingErrorOn_setItem(): void {
        given_mockedStorage();
        mockedStorage.setItem = jest.fn().mockImplementation(() => {
            throw 'error';
        });
    }

    function given_mockedStorage_throwingErrorOn_getAllKeys(): void {
        given_mockedStorage();
        mockedStorage.getAllKeys = jest.fn().mockImplementation(() => {
            throw 'error';
        });
    }

    function given_mockedStorage_throwingErrorOn_multiGet(): void {
        given_mockedStorage();
        mockedStorage.multiGet = jest.fn().mockImplementation(() => {
            throw 'error';
        });
    }

    function given_mockedStorage_throwingErrorOn_multiRemove(): void {
        given_mockedStorage();
        mockedStorage.multiRemove = jest.fn().mockImplementation(() => {
            throw 'error';
        });
    }

    function given_spiedReportService_withMockedSendReports(executeOnceFromMockedMethod?: () => void): void {
        jest.spyOn(ReportService.getInstance(), 'sendReports').mockImplementation(async () => {
            executeOnceFromMockedMethod && executeOnceFromMockedMethod();

            //re-mock sendReports() method to not execute the callback the next time it is executed
            jest.spyOn(ReportService.getInstance(), 'sendReports').mockImplementation(async () => true);

            return true;
        });
    }

    function given_persistentReportServiceUnderTest(): void {
        persistentReportServiceUnderTest = PersistentReportService.getInstance();
        //must be used, since _itemsInStorage counter is static private in PersistentReportService
        PersistentReportService['_itemsInStorage'] = 0;
        persistentReportServiceUnderTest.init(mockedReportingBulkDelayMS, mockedReportingBulkSize);
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

    // function getLatestNumberOfMockedReportRecords(mockedReportRecords: Array<Record<string, string | number | boolean>>, mockedReportingBulkSize: number): Array<Record<string, string | number | boolean>> {
    //     return mockedReportRecords.slice(mockedReportRecords.length - mockedReportingBulkSize, mockedReportRecords.length);
    // }

    // function getOldestNumberOfMockedReportRecords(mockedReportRecords: Array<Record<string, string | number | boolean>>, mockedReportingBulkSize: number): Array<Record<string, string | number | boolean>> {
    //     return mockedReportRecords.slice(0, mockedReportRecords.length - mockedReportingBulkSize);
    // }

    function convertMockedReportRecordsToJSONStrings(
        mockedReportRecords: Array<Record<string, string | number | boolean>>
    ): Array<string> {
        return mockedReportRecords.map((mockedReportRecord) => JSON.stringify(mockedReportRecord));
    }

    async function when_putInReportQueueIsExecuted_onPersistentReportService_numberOfTimesWith(
        mockedReportRecords: Array<Record<string, string | number | boolean>>,
        firstIndex: number,
        lastIndexExcluded: number
    ): Promise<Array<boolean>> {
        return new Promise((resolve) => {
            const putInReportQueueResults = new Array<boolean>();
            for (let index = firstIndex; index < lastIndexExcluded; ++index) {
                when_putInReportQueueIsExecuted_onPersistentReportService_with(mockedReportRecords[index]).then(
                    (result) => {
                        putInReportQueueResults.push(result);
                        if (putInReportQueueResults.length === lastIndexExcluded - firstIndex) {
                            resolve(putInReportQueueResults);
                        }
                    }
                );
            }
        });
    }

    async function when_putInReportQueueIsExecutedSynchronously_onPersistentReportService_numberOfTimesWith(
        mockedReportRecords: Array<Record<string, string | number | boolean>>,
        firstIndex: number,
        lastIndexExcluded: number
    ): Promise<Array<boolean>> {
        const putInReportQueueResults = new Array<boolean>();
        for (let index = firstIndex; index < lastIndexExcluded; ++index) {
            putInReportQueueResults.push(
                await when_putInReportQueueIsExecuted_onPersistentReportService_with(mockedReportRecords[index])
            );
        }

        return putInReportQueueResults;
    }

    async function when_putInReportQueueIsExecuted_onPersistentReportService_with(
        mockedReportRecord: Record<string, string | number | boolean>
    ): Promise<boolean> {
        const a = await persistentReportServiceUnderTest.putInReportQueue(mockedReportRecord);
        return a;
    }

    function then_putInReportQueueResultIs(putInReportQueueResult: boolean, expectedResult: boolean): void {
        expect(putInReportQueueResult).toBe(expectedResult);
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

    async function then_storage_containsReports(
        mockedReportRecords: Array<Record<string, string | number | boolean>>
    ): Promise<void> {
        const mockedReportRecordJSONStrings = convertMockedReportRecordsToJSONStrings(mockedReportRecords);
        mockedStorage.getAllKeys = mockedStorageDefaultGetAllKeysMethod;
        const storedReportKeys = (await mockedStorage.getAllKeys(undefined)) as string[];

        expect(storedReportKeys.length).toEqual(mockedReportRecordJSONStrings.length);

        for (const key of storedReportKeys) {
            const storedReportJSONStringForKey = await mockedStorage.getItem(key);
            expect(mockedReportRecordJSONStrings).toContain(storedReportJSONStringForKey);
        }
    }

    async function then_storage_containsNoReports(): Promise<void> {
        mockedStorage.getAllKeys = mockedStorageDefaultGetAllKeysMethod;
        const storedReportKeys = (await mockedStorage.getAllKeys(undefined)) as string[];
        expect(storedReportKeys.length).toEqual(0);
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

    function terminate_persistentReportServiceUnderTest(): void {
        persistentReportServiceUnderTest.terminate();
    }
});
