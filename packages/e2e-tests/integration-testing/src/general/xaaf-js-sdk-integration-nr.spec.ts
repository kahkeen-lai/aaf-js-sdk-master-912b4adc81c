/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable unicorn/string-content */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { MockedFeatureFlagDelegate } from '../mock/mocked-feature-flag-delegate';
import { MockedReportServiceDelegate } from '../mock/mocked-report-service-delegate';
import { MockedLoginServiceDelegate } from '../mock/mocked-login-service-delegate';
import { MockedXaafVideoElement } from '../mock/mocked-xaaf-video-element';
import { MockedXaafAdContainer } from '../mock/mocked-xaaf-ad-container';
import {
  AdEvent,
  AdEventType,
  AttributeNames,
  ExecutableAd,
  XaafAdContainer,
  XaafEvent,
  XaafEventType,
  XaafJsSdk,
  Xip
} from '@xaaf/xaaf-js-sdk';
import { HttpService, ContainerDef, HttpResponse, InjectionContainer } from '@xaaf/common';
import {
  IEvent,
  ReportingE2eHelper,
  ReportingServiceProvider,
  commonParams,
  commonSDKMetricsParams,
  adSessionMetricParams,
  globalAdSessionMetricParams,
  hostSdkInitParamNames
} from '@xaaf/e2e-common';
import {
  createMockedInitAdInfo,
  createMockedOpportunityInfo,
  createMockedSDKArguments
} from '../mock/mocked-data-structures-happy-flow';
import {
  ExpectedAdLifecycleEventData,
  ExpectedFieldValue,
  getExpectedNRAdLifecycleEventsData,
  hostStoppingReason
} from '../expect/nr-ad-lifecycle-expectations-happy-flow';
import { IntegrationApiKeyConfig, IntegrationNRConfig } from '../environment';
import { SpiedHttpService, SpiedTransactionType } from '../spy/spied-http-service';
import { convertKeyValuePairsStringToMap } from '../utils';
jest.unmock('axios');

const timeInMS_betweenAdStartedEvent_toStopAdExecution = 0;
const timeInMS_toWaitBeforeQueryingNR = 1500;

function getNRQueryByDeviceUUID(deviceUUID: string): string {
  return `SELECT * from XandrSDK where deviceUUID='${deviceUUID}' SINCE 1 minute ago`;
}

describe('AAF JS SDK', () => {
  jest.retryTimes(3);
  // a timeout for the integration test, to be used with it() API as the last parameter
  const _integrationTestTimeoutMS = 1000 * 60;
  let _spiedHttpService;
  let _mockedSDKArguments;
  let _mockedOpportunityInfo;
  let _mockedXaafAdContainer;
  let _mockedInitAdinfo;
  let _executableAd;
  let _nrReportData;

  beforeEach(() => {
    _mockedSDKArguments = createMockedSDKArguments();
    _mockedOpportunityInfo = createMockedOpportunityInfo();
    _mockedXaafAdContainer = createMockedXaafAdContainer();
    _mockedInitAdinfo = createMockedInitAdInfo();
  });

  function createMockedXaafAdContainer(): XaafAdContainer {
    return new MockedXaafAdContainer(new MockedXaafVideoElement());
  }

  it.skip(
    'data validation',
    done => {
      given_DIFramework_suppliesSpiedHttpService_spyingOnOpportunityTransactions();
      const xaafJsSdk = given_xaafJsSdk_withMockedDelegateDependencies();
      xaafJsSdk.xaafInitListener = (xaafEvent: XaafEvent) => {
        if (isXaafEventTypeNotSuccess(xaafEvent)) {
          fail(`AAF event type is ${xaafEvent.type}`);
        }

        _executableAd = xaafJsSdk.getExecutableAd(_mockedOpportunityInfo);
        _executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
          switch (adEvent.type) {
            case AdEventType.Loaded: {
              _executableAd.startAd(_mockedXaafAdContainer);
              break;
            }
            case AdEventType.Started: {
              // executableAd.stopAd execution must be delayed to allow executable ad to reach PLAYING state
              executeWithDelay(() => {
                _executableAd.stopAd(hostStoppingReason);
              }, timeInMS_betweenAdStartedEvent_toStopAdExecution);
              break;
            }
            case AdEventType.Stopped: {
              executeWithDelay(async () => {
                await then_loginAndAdLifeCycleEvents_areReportedCorrectlyToNR();
                done();
              }, timeInMS_betweenAdStartedEvent_toStopAdExecution);
            }
          }
        };

        when_initAdIsExecuted_onExecutableAd(_executableAd);
      };

      when_initializeIsExecuted_onXaafJsSdk(xaafJsSdk);
    },
    _integrationTestTimeoutMS
  );

  function isXaafEventTypeNotSuccess(xaafEvent: XaafEvent): boolean {
    return xaafEvent.type !== XaafEventType.SUCCESS;
  }

  function given_DIFramework_suppliesSpiedHttpService_spyingOnOpportunityTransactions(): void {
    const existingHttpInstance = InjectionContainer.resolve<HttpService>(ContainerDef.httpService);
    if (existingHttpInstance instanceof SpiedHttpService) {
      _spiedHttpService = new SpiedHttpService(
        InjectionContainer.resolve(ContainerDef.httpService)['_realHttpService'],
        SpiedTransactionType.Opportunity
      );
      InjectionContainer.registerInstance(ContainerDef.httpService, _spiedHttpService);
    } else {
      _spiedHttpService = new SpiedHttpService(existingHttpInstance, SpiedTransactionType.Opportunity);
      InjectionContainer.registerInstance(ContainerDef.httpService, _spiedHttpService);
    }
  }

  function given_xaafJsSdk_withMockedDelegateDependencies(enabledFlagNames?: string[]): XaafJsSdk {
    const xaafJsSdk = new XaafJsSdk();

    setMockedReportServiceDelegateOnXaafJsSdk(xaafJsSdk);
    setMockedLoginServiceDelegateOnXaafJsSdk(xaafJsSdk);
    setMockedFeatureFlagServiceDelegateOnXaafJsSdk(xaafJsSdk, enabledFlagNames);

    return xaafJsSdk;
  }

  function setMockedReportServiceDelegateOnXaafJsSdk(xaafJsSdk: XaafJsSdk): void {
    xaafJsSdk['_reportService']._isInitialized = false;
    xaafJsSdk.persistentReportServiceDelegate = new MockedReportServiceDelegate();
  }

  function setMockedLoginServiceDelegateOnXaafJsSdk(xaafJsSdk: XaafJsSdk): void {
    InjectionContainer.registerInstance(ContainerDef.storageService, new MockedLoginServiceDelegate());
  }

  function setMockedFeatureFlagServiceDelegateOnXaafJsSdk(xaafJsSdk: XaafJsSdk, enabledFlagNames: string[]): void {
    InjectionContainer.registerInstance(
      ContainerDef.featureFlagsDelegate,
      new MockedFeatureFlagDelegate(enabledFlagNames)
    );
  }

  function when_initializeIsExecuted_onXaafJsSdk(xaafJsSdk: XaafJsSdk): void {
    xaafJsSdk.initialize(IntegrationApiKeyConfig.general, _mockedSDKArguments);
  }

  function when_initAdIsExecuted_onExecutableAd(executableAd: ExecutableAd): void {
    executableAd.initAd(_mockedXaafAdContainer, _mockedInitAdinfo);
  }

  async function then_loginAndAdLifeCycleEvents_areReportedCorrectlyToNR() {
    const nrQuery = getNRQueryByDeviceUUID(_mockedSDKArguments.get('deviceUUID'));
    await queryAndStoreNRReportData(nrQuery);
    then_nrLoginAndAdLifeCycle_reportData_isAsExpected();
  }

  async function queryAndStoreNRReportData(nrQuery: string): Promise<void> {
    const newRelicOptions = {
      accountId: IntegrationNRConfig.generalAccountId,
      queryKey: IntegrationNRConfig.generalQueryKey
    };

    await new Promise(resolve => {
      setTimeout(async () => {
        const reportHelper = new ReportingE2eHelper(
          ReportingServiceProvider.NewRelic,
          newRelicOptions,
          _mockedSDKArguments.get('platformAdvId')
        );

        _nrReportData = await reportHelper.getReportsByQueryString(nrQuery);
        resolve({});
      }, timeInMS_toWaitBeforeQueryingNR);
    });
  }

  function then_nrLoginAndAdLifeCycle_reportData_isAsExpected(): void {
    if (!_nrReportData) {
      fail('no report data has been retrieved from NR');
    }

    const nrEventsData = _nrReportData.results[0].events;
    if (!nrEventsData) {
      fail('NR retrieved report data has wrong structure');
    }

    sortNREventsDataAccordingToClientTime(nrEventsData);

    const nrLoginEventData = getNRLoginEventData(nrEventsData);
    then_nrLogin_reportData_isAsExpected(nrLoginEventData);

    const nrAdLifeCycleEventsData = getOnlyNRAdLifeCycleEventsData(nrEventsData);

    const expectedNRAdLifeCycleEventsData = getExpectedNRAdLifecycleEventsData();
    sortDataByExpectedOrderOfEvents(nrAdLifeCycleEventsData, expectedNRAdLifeCycleEventsData);
    then_nrAdLifeCycle_reportData_isAsExpected(nrAdLifeCycleEventsData, expectedNRAdLifeCycleEventsData);
  }

  function then_nrLogin_reportData_isAsExpected(nrLoginEventData: IEvent): void {
    then_nrLoginEvent_success_isAsExpected(nrLoginEventData.success, true);
    then_nrLoginEvent_isSilent_isAsExpected(nrLoginEventData.isSilent, false);
    then_nrLoginEvent_mode_isAsExpected(nrLoginEventData.mode, 'PRE_AUTH');
    then_nrLoginEvent_hostRequestId_isAsExpected(
      nrLoginEventData.loginRequestId,
      _mockedSDKArguments.get('hostRequestId')
    );
    then_nrLoginEvent_isSDKTrace_isAsExpected(nrLoginEventData.isSDKTrace, false);
    then_nrLoginEvent_loginState_isAsExpected(nrLoginEventData.loginState, true);
    then_nrLoginEvent_hostSdkInitParams_isAsInSdkArguments(nrLoginEventData.hostSdkInitParams);
  }

  function then_nrAdLifeCycle_reportData_isAsExpected(
    nrAdLifeCycleEventsData: IEvent[],
    expectedNRAdLifeCycleEventsData: ExpectedAdLifecycleEventData[]
  ): void {
    const opportunityResponseValues = getOpportunityResponseValues();

    for (let index = 0; index < nrAdLifeCycleEventsData.length; ++index) {
      const nrAdLifeCycleEventData = nrAdLifeCycleEventsData[index];
      const previousNRAdLifeCycleEventData = index > 0 ? nrAdLifeCycleEventsData[index - 1] : undefined;
      const expectedNRAdLifeCycleEventData = expectedNRAdLifeCycleEventsData[index];

      then_nrAdLifeCycleEvent_clientTime_isAsExpected(
        nrAdLifeCycleEventData.clientTime,
        previousNRAdLifeCycleEventData?.clientTime,
        expectedNRAdLifeCycleEventData.clientTime
      );

      then_nrAdLifeCycleEvent_name_isAsExpected(nrAdLifeCycleEventData.name, expectedNRAdLifeCycleEventData.name);

      then_nrAdLifeCycleEvent_hostAdInitParams_isAsExpected(nrAdLifeCycleEventData, expectedNRAdLifeCycleEventData);

      then_nrAdLifeCycleEvent_exeAdUUID_isAsExpected(
        nrAdLifeCycleEventData.exeAdUUID,
        opportunityResponseValues.exeAdUUID
      );

      then_nrAdLifeCycleEvent_expID_isAsExpected(
        nrAdLifeCycleEventData.expID,
        expectedNRAdLifeCycleEventData.expId,
        opportunityResponseValues.expId
      );

      then_nrAdLifeCycleEvent_projectBuildNumber_isAsExpected(
        nrAdLifeCycleEventData.projectBuildNumber,
        expectedNRAdLifeCycleEventData.projectBuildNumber,
        opportunityResponseValues.projectBuildNumber
      );

      then_nrAdLifeCycleEvent_projectId_isAsExpected(
        nrAdLifeCycleEventData.projectId,
        expectedNRAdLifeCycleEventData.projectId,
        opportunityResponseValues.projectId
      );

      then_nrAdLifeCycleEvent_calculatedData_isAsExpected(
        nrAdLifeCycleEventData,
        previousNRAdLifeCycleEventData,
        expectedNRAdLifeCycleEventData
      );

      then_nrAdLifeCycleEvent_commonParams_isAsExpected(nrAdLifeCycleEventData);
      then_nrAdLifeCycleEvent_commonSDKMetricsParams_isAsExpected(nrAdLifeCycleEventData);

      then_nrAdLifeCycleEvent_adSessionMetricsParams_isAsExpected(
        expectedNRAdLifeCycleEventData.adSessionParam,
        nrAdLifeCycleEventData
      );

      then_nrAdLifeCycleEvent_hostStoppingReason_isAsExpected(
        expectedNRAdLifeCycleEventData.hostStoppingReason,
        nrAdLifeCycleEventData.hostStoppingReason
      );
    }
  }

  function sortDataByExpectedOrderOfEvents(
    nrAdLifeCycleEventsData: IEvent[],
    expectedNRAdLifeCycleEventData: ExpectedAdLifecycleEventData[]
  ) {
    const expectedOrderOfEventsByName = expectedNRAdLifeCycleEventData.map(event => event.name);

    nrAdLifeCycleEventsData.sort(
      (previousAdLifeCycleEvent, currentAdLifeCycleEvent) =>
        expectedOrderOfEventsByName.indexOf(previousAdLifeCycleEvent.name) -
        expectedOrderOfEventsByName.indexOf(currentAdLifeCycleEvent.name)
    );
  }

  function sortNREventsDataAccordingToClientTime(nrAdLifeCycleEventsData: IEvent[]) {
    nrAdLifeCycleEventsData.sort((e1, e2) => e1.clientTime.localeCompare(e2.clientTime));
  }

  function getNRLoginEventData(sortedByClientTimeNRAdLifeCycleEventsData: IEvent[]): IEvent {
    // first event is login
    return sortedByClientTimeNRAdLifeCycleEventsData[0];
  }

  function getOnlyNRAdLifeCycleEventsData(sortedByClientTimeNRAdLifeCycleEventsData: IEvent[]): IEvent[] {
    // first event is login which is omitted, other events are ad life cycle
    return sortedByClientTimeNRAdLifeCycleEventsData.slice(1, sortedByClientTimeNRAdLifeCycleEventsData.length);
  }

  function getOpportunityResponseValues(): {
    exeAdUUID: string;
    expId: string;
    projectBuildNumber: string;
    projectId: string;
  } {
    const exeAdUUID = _executableAd.getAttribute(AttributeNames.EXECUTABLE_AD_UUID);

    const opportunityHttpResponse = _spiedHttpService.lastSpiedHttpResponse as HttpResponse<Xip>;
    const expId = opportunityHttpResponse.body.experienceId;

    let projectBuildNumber = '';
    let projectId = '';
    opportunityHttpResponse.body.commands[0].report.adLifeCycle.forEach(xipAdLifeCycle => {
      if (xipAdLifeCycle.paramType === 'projectBuildNumber') {
        projectBuildNumber = xipAdLifeCycle.paramName.toString();
      }

      if (xipAdLifeCycle.paramType === 'projectId') {
        projectId = xipAdLifeCycle.paramName.toString();
      }
    });

    return { exeAdUUID: exeAdUUID, expId: expId, projectBuildNumber: projectBuildNumber, projectId: projectId };
  }

  function then_nrLoginEvent_success_isAsExpected(
    nrLoginEventSuccessFieldValue: boolean,
    expectedNRLoginEventSuccessFieldValue: boolean
  ): void {
    expect(nrLoginEventSuccessFieldValue).toEqual(expectedNRLoginEventSuccessFieldValue);
  }

  function then_nrLoginEvent_isSilent_isAsExpected(
    nrLoginEventIsSilentFieldValue: boolean,
    expectedNRLoginEventIsSilentFieldValue: boolean
  ): void {
    expect(nrLoginEventIsSilentFieldValue).toEqual(expectedNRLoginEventIsSilentFieldValue);
  }

  function then_nrLoginEvent_mode_isAsExpected(
    nrLoginEventModeFieldValue: string,
    expectedNRLoginEventModeFieldValue: string
  ): void {
    expect(nrLoginEventModeFieldValue).toEqual(expectedNRLoginEventModeFieldValue);
  }

  function then_nrLoginEvent_hostRequestId_isAsExpected(
    nrLoginEventHostRequestIdFieldValue: string,
    expectedNRLoginEventHostRequestIdFieldValue: string
  ): void {
    expect(nrLoginEventHostRequestIdFieldValue).toEqual(expectedNRLoginEventHostRequestIdFieldValue);
  }

  function then_nrLoginEvent_isSDKTrace_isAsExpected(
    nrLoginEventIsLoginTraceFieldValue: boolean,
    expectedNRLoginEventIsLoginTraceFieldValue: boolean
  ): void {
    expect(nrLoginEventIsLoginTraceFieldValue).toEqual(expectedNRLoginEventIsLoginTraceFieldValue);
  }

  function then_nrLoginEvent_loginState_isAsExpected(
    nrLoginEventLoginStateFieldValue: boolean,
    expectedNRLoginEventLoginStateFieldValue: boolean
  ): void {
    expect(nrLoginEventLoginStateFieldValue).toEqual(expectedNRLoginEventLoginStateFieldValue);
  }

  function then_nrLoginEvent_hostSdkInitParams_isAsInSdkArguments(
    nrLoginEventHostHostSdkInitParamsFieldValue: string
  ): void {
    const nrLoginHostSdkInitParamsData = convertKeyValuePairsStringToMap(
      nrLoginEventHostHostSdkInitParamsFieldValue,
      '&',
      '='
    );
    hostSdkInitParamNames.forEach(hostSdkInitParamName => {
      expect(nrLoginHostSdkInitParamsData.get(hostSdkInitParamName)).toEqual(
        _mockedSDKArguments.get(hostSdkInitParamName)
      );
    });
  }

  function then_nrAdLifeCycleEvent_name_isAsExpected(
    nrEventNameFieldValue: string,
    expectedNREventNameFieldValue: string
  ): void {
    expect(nrEventNameFieldValue).toEqual(expectedNREventNameFieldValue);
  }

  function then_nrAdLifeCycleEvent_hostAdInitParams_isAsExpected(
    nrEventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ): void {
    if (expectedNREventData.hostAdInitParams === ExpectedFieldValue.AsInHostAdInitParams) {
      then_nrAdLifeCycleEvent_hostAdInitParams_areAsInInitAdInfo(nrEventData.hostAdInitParams);
    } else {
      expect(nrEventData.hostAdInitParams).toEqual(expectedNREventData.hostAdInitParams);
    }
  }

  function then_nrAdLifeCycleEvent_hostAdInitParams_areAsInInitAdInfo(actualHostAdInitParams: string): void {
    _mockedInitAdinfo.forEach((value, key) => {
      expect(actualHostAdInitParams).toContain(`${key}=${value}`);
    });
  }

  function then_nrAdLifeCycleEvent_exeAdUUID_isAsExpected(
    nrEventExeAdUUIDFieldValue: string,
    expectedNREventExAdUUIDFieldValue: string
  ): void {
    expect(nrEventExeAdUUIDFieldValue).toEqual(expectedNREventExAdUUIDFieldValue);
  }

  function then_nrAdLifeCycleEvent_expID_isAsExpected(
    nrEventExpIdFieldValue: string,
    expectedNREventExpIdFieldValue: number | undefined,
    opportunityResponseExpId: string
  ): void {
    then_nrAdLifeCycleEvent_field_isAsInOpportunityResponse_ifNeeded(
      nrEventExpIdFieldValue,
      expectedNREventExpIdFieldValue,
      opportunityResponseExpId
    );
  }

  function then_nrAdLifeCycleEvent_projectBuildNumber_isAsExpected(
    nrEventProjectBuildNumberFieldValue: string,
    expectedNREventProjectBuildNumberFieldValue: number | undefined,
    opportunityResponseProjectBuildNumber: string
  ): void {
    then_nrAdLifeCycleEvent_field_isAsInOpportunityResponse_ifNeeded(
      nrEventProjectBuildNumberFieldValue,
      expectedNREventProjectBuildNumberFieldValue,
      opportunityResponseProjectBuildNumber
    );
  }

  function then_nrAdLifeCycleEvent_projectId_isAsExpected(
    nrEventProjectIdFieldValue: string,
    expectedNREventProjectIdFieldValue: number | undefined,
    opportunityResponseProjectId: string
  ): void {
    then_nrAdLifeCycleEvent_field_isAsInOpportunityResponse_ifNeeded(
      nrEventProjectIdFieldValue,
      expectedNREventProjectIdFieldValue,
      opportunityResponseProjectId
    );
  }

  function then_nrAdLifeCycleEvent_calculatedData_isAsExpected(
    nrEventData: IEvent,
    previousNREventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ): void {
    then_nrAdLifeCycleEvent_lastAdLifeCycleEvent_isAsExpected(
      nrEventData.lastAdLifeCycleEventName,
      expectedNREventData.lastAdLifeCycleEventName
    );
    then_nrAdLifeCycleEvent_timeSinceLastLifeCycleEvent_isAsExpected(
      nrEventData,
      expectedNREventData.timeSinceLastLifeCycleEvent
    );
    then_nrAdLifeCycleEvent_hostAdCreate_isAsExpected(nrEventData, previousNREventData, expectedNREventData);
    then_nrAdLifeCycleEvent_timeSinceAdCreatedEvent_isAsExpected(nrEventData, previousNREventData, expectedNREventData);
    then_nrAdLifeCycleEvent_hostAdInit_isAsExpected(nrEventData, previousNREventData, expectedNREventData);
    then_nrAdLifeCycleEvent_hostAdStart_isAsExpected(nrEventData, previousNREventData, expectedNREventData);
    then_nrAdLifeCycleEvent_timeSinceStarted_isAsExpected(nrEventData, previousNREventData, expectedNREventData);
    then_nrAdLifeCycleEvent_hostAdStop_isAsExpected(nrEventData, previousNREventData, expectedNREventData);
  }

  function then_nrAdLifeCycleEvent_lastAdLifeCycleEvent_isAsExpected(
    nrEventLastAdLifeCycleFieldValue: string,
    expectedNREventNameFieldValue: string
  ): void {
    expect(nrEventLastAdLifeCycleFieldValue).toEqual(expectedNREventNameFieldValue);
  }

  function then_nrAdLifeCycleEvent_timeSinceLastLifeCycleEvent_isAsExpected(
    nrEventTimeSinceLastLifeCycleEventFieldValue: IEvent,
    expectedNREventTimeSinceLastLifeCycleFieldValue: number
  ): void {
    if (expectedNREventTimeSinceLastLifeCycleFieldValue === ExpectedFieldValue.GreaterThanOrEqual_0) {
      expect(nrEventTimeSinceLastLifeCycleEventFieldValue.timeSinceLastLifeCycleEvent).toBeGreaterThanOrEqual(0);
    } else {
      expect(nrEventTimeSinceLastLifeCycleEventFieldValue.timeSinceLastLifeCycleEvent).toEqual(0);
    }
  }

  function then_nrAdLifeCycleEvent_clientTime_isAsExpected(
    currentClientTime: string,
    previousClientTime: string,
    expectedNREventClientTimeFieldValue: number
  ): void {
    const currentEpochTime: number = new Date(currentClientTime).getTime();
    if (expectedNREventClientTimeFieldValue === ExpectedFieldValue.GreaterThan_0) {
      expect(currentEpochTime).toBeGreaterThan(0);
    } else if (expectedNREventClientTimeFieldValue === ExpectedFieldValue.GreaterThanOrEqual_Previous) {
      const previousEpochTime: number = new Date(previousClientTime).getTime();
      expect(currentEpochTime).toBeGreaterThanOrEqual(previousEpochTime);
    }
  }

  function then_nrAdLifeCycleEvent_hostAdCreate_isAsExpected(
    nrEventData: IEvent,
    previousNREventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ) {
    then_nrAdLifeCycleEvent_field_isAsCalculated_ifNeeded(
      nrEventData.HOST_AD_CREATE,
      nrEventData.timeSinceLastLifeCycleEvent,
      previousNREventData?.HOST_AD_CREATE,
      expectedNREventData.hostAdCreate
    );
  }

  function then_nrAdLifeCycleEvent_timeSinceAdCreatedEvent_isAsExpected(
    nrEventData: IEvent,
    previousNREventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ) {
    then_nrAdLifeCycleEvent_field_isAsCalculated_ifNeeded(
      nrEventData.timeSinceAdCreatedEvent,
      nrEventData.timeSinceLastLifeCycleEvent,
      previousNREventData?.timeSinceAdCreatedEvent,
      expectedNREventData.timeSinceAdCreatedEvent
    );
  }

  function then_nrAdLifeCycleEvent_hostAdInit_isAsExpected(
    nrEventData: IEvent,
    previousNREventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ) {
    then_nrAdLifeCycleEvent_field_isAsCalculated_ifNeeded(
      nrEventData.HOST_AD_INIT,
      nrEventData.timeSinceLastLifeCycleEvent,
      previousNREventData?.HOST_AD_INIT,
      expectedNREventData.hostAdInit
    );
  }

  function then_nrAdLifeCycleEvent_hostAdStart_isAsExpected(
    nrEventData: IEvent,
    previousNREventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ) {
    then_nrAdLifeCycleEvent_field_isAsCalculated_ifNeeded(
      nrEventData.HOST_AD_START,
      nrEventData.timeSinceLastLifeCycleEvent,
      previousNREventData?.HOST_AD_START,
      expectedNREventData.hostAdStart
    );
  }

  function then_nrAdLifeCycleEvent_timeSinceStarted_isAsExpected(
    nrEventData: IEvent,
    previousNREventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ) {
    then_nrAdLifeCycleEvent_field_isAsCalculated_ifNeeded(
      nrEventData.timeSinceStarted,
      nrEventData.timeSinceLastLifeCycleEvent,
      previousNREventData?.timeSinceStarted,
      expectedNREventData.timeSinceStarted
    );
  }

  function then_nrAdLifeCycleEvent_hostAdStop_isAsExpected(
    nrEventData: IEvent,
    previousNREventData: IEvent,
    expectedNREventData: ExpectedAdLifecycleEventData
  ) {
    then_nrAdLifeCycleEvent_field_isAsCalculated_ifNeeded(
      nrEventData.HOST_AD_STOP,
      nrEventData.timeSinceLastLifeCycleEvent,
      previousNREventData?.HOST_AD_STOP,
      expectedNREventData.hostAdStop
    );
  }

  function then_nrAdLifeCycleEvent_field_isAsCalculated_ifNeeded(
    nrEventDataFieldValue: number | undefined,
    nrEventDataTimeSinceLastLifeCycleFieldValue: number | undefined,
    previousNREventFieldValue: number | undefined,
    expectedNREventFieldValue: number | undefined
  ) {
    if (expectedNREventFieldValue === ExpectedFieldValue.ToBeCalculated) {
      expect(nrEventDataFieldValue).toEqual(nrEventDataTimeSinceLastLifeCycleFieldValue + previousNREventFieldValue);
    } else {
      expect(nrEventDataFieldValue).toEqual(expectedNREventFieldValue);
    }
  }

  function then_nrAdLifeCycleEvent_field_isAsInOpportunityResponse_ifNeeded(
    nrEventFieldValue: string | undefined,
    expectedNREventFieldValue: number | undefined,
    opportunityResponseFieldValue: string
  ): void {
    if (expectedNREventFieldValue === ExpectedFieldValue.AsInOpportunityResponse) {
      expect(nrEventFieldValue).toEqual(opportunityResponseFieldValue);
    } else {
      expect(nrEventFieldValue).toEqual(expectedNREventFieldValue);
    }
  }

  function then_nrAdLifeCycleEvent_commonParams_isAsExpected(nrEventData: IEvent) {
    commonParams.forEach(param => {
      const value = nrEventData[param];
      expect(value).toBeDefined;
    });
  }

  function then_nrAdLifeCycleEvent_commonSDKMetricsParams_isAsExpected(nrEventData: IEvent) {
    commonSDKMetricsParams.forEach(param => {
      const value = nrEventData[param];
      expect(value).toEqual(_mockedSDKArguments.get(param));
    });
  }

  function then_nrAdLifeCycleEvent_adSessionMetricsParams_isAsExpected(
    expectedNRAdSessionFieldValue: number | undefined,
    nrEventData: IEvent
  ) {
    adSessionMetricParams.forEach(param => {
      const value = nrEventData[param];
      if (expectedNRAdSessionFieldValue === ExpectedFieldValue.AsInInitAdInfo) {
        expect(value).toEqual(_mockedInitAdinfo.get(param));
      } else {
        expect(value).toEqual(expectedNRAdSessionFieldValue);
      }
    });

    globalAdSessionMetricParams.forEach(param => {
      const value = nrEventData[param];
      expect(value).toEqual(_mockedInitAdinfo.get(param));
    });
  }

  function then_nrAdLifeCycleEvent_hostStoppingReason_isAsExpected(
    nrEventHostStoppingReasonFieldValue: string,
    expectedNREventHostStoppingReasonFieldValue: string
  ): void {
    expect(nrEventHostStoppingReasonFieldValue).toEqual(expectedNREventHostStoppingReasonFieldValue);
  }

  function executeWithDelay(functionToExecute: () => void, delayInMS: number): void {
    setTimeout(functionToExecute, delayInMS);
  }
});
