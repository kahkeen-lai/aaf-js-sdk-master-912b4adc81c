/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { MockedFeatureFlagDelegate } from '../mock/mocked-feature-flag-delegate';
import { MockedReportServiceDelegate } from '../mock/mocked-report-service-delegate';
import { MockedLoginServiceDelegate } from '../mock/mocked-login-service-delegate';
import { XaafEvent, XaafEventType, XaafJsSdk } from '@xaaf/xaaf-js-sdk';
import { ContainerDef, default as Core, BulkConfiguration, InjectionContainer } from '@xaaf/common';
import { IEvent, ReportingE2eHelper, ReportingServiceProvider, hostSdkInitParamNames } from '@xaaf/e2e-common';
import { createMockedSDKArguments } from '../mock/mocked-data-structures-happy-flow';
import { IntegrationApiKeyConfig, IntegrationNRConfig } from '../environment';
import { convertKeyValuePairsStringToMap, JEST_TIMEOUT_MS } from '../utils';
import { ConfigService } from '@xaaf/xaaf-js-sdk';
jest.unmock('axios');

const timeInMS_toWaitBeforeQueryingNR = 1500;
const invalidApiKey =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.IEtk2ESbme76dfcj1nERZqM_Vt_GERGqgF1joqqMnrEBOffZ9tP3chSdD5SWmRfCdiiVEWYK4GLqwEVey5DTYYy7fqGr9noTQq2A-dUK4QdYLOGymlG2H4jDwveK4cb4B0Kjfhjn1uqLO3DucSM94FskuGTT8hdVK-Uhij1WcSTWPkkJtso_VTQx4ssjBxVJdbpoJ5WNZqZzv2V0qR2oY5-_vGMuQ0k4_GAiB2uKcVP-Hn6nvWlsfWhHo_7-zuAG-07XQ2OMx8iBfYFKZukUnnSTrAI8_vZPtrDKjEoApK-Vq_SW_Ij4Qxr9GnEsv2nh0Z6O3eYy90IeSBA7BXipjQ';

function getNRQueryByDeviceUUID(deviceUUID: string): string {
  return `SELECT * from XandrSDK where deviceUUID='${deviceUUID}' SINCE 1 minute ago`;
}

const mockedReportingBulkSize = 2;
const mockedReportingBulkDelayMS = 1000;

class MockedConfigService extends ConfigService {
  private mockedBulkConfiguration: BulkConfiguration = {
    reportingBulk: mockedReportingBulkSize,
    reportingBulkDelay: mockedReportingBulkDelayMS
  };

  get bulkConfiguration(): Core.BulkConfiguration {
    return this.mockedBulkConfiguration;
  }
}

function given_mockedConfigurationService(): void {
  InjectionContainer.registerSingleton(ContainerDef.configService, MockedConfigService);
}

describe('AAF JS SDK', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);
  jest.retryTimes(2);

  let _mockedSDKArguments;
  let _nrReportData;

  beforeEach(() => {
    _mockedSDKArguments = createMockedSDKArguments();
  });

  it.skip('given login failure, and bulk disabled. upon login success, only login success is reported to nr', done => {
    const xaafJsSdk = given_xaafJsSdk_withMockedDelegateDependencies();
    xaafJsSdk.xaafInitListener = (xaafEvent: XaafEvent) => {
      if (isXaafEventTypeNotFailure(xaafEvent)) {
        fail(`AAF event type is ${xaafEvent.type}`);
      }

      xaafJsSdk.xaafInitListener = async (xaafEvt: XaafEvent) => {
        if (isXaafEventTypeNotSuccess(xaafEvt)) {
          fail(`AAF event type is ${xaafEvt.type}`);
        }
        await then_loginEvents_areReportedCorrectlyToNR();
        done();
      };

      when_initializeIsExecuted_onXaafJsSdk(xaafJsSdk);
    };

    const failOnLogin = true;
    when_initializeIsExecuted_onXaafJsSdk(xaafJsSdk, failOnLogin);
  });

  function isXaafEventTypeNotSuccess(xaafEvent: XaafEvent): boolean {
    return xaafEvent.type !== XaafEventType.SUCCESS;
  }

  function isXaafEventTypeNotFailure(xaafEvent: XaafEvent): boolean {
    return xaafEvent.type !== XaafEventType.FAILURE;
  }

  function given_xaafJsSdk_withMockedDelegateDependencies(enabledFlagNames?: string[]): XaafJsSdk {
    const xaafJsSdk = new XaafJsSdk();

    given_mockedConfigurationService();
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

  function when_initializeIsExecuted_onXaafJsSdk(xaafJsSdk: XaafJsSdk, failLogin: boolean = false): void {
    failLogin
      ? xaafJsSdk.initialize(invalidApiKey, _mockedSDKArguments)
      : xaafJsSdk.initialize(IntegrationApiKeyConfig.general, _mockedSDKArguments);
  }

  async function then_loginEvents_areReportedCorrectlyToNR() {
    const nrQuery = getNRQueryByDeviceUUID(_mockedSDKArguments.get('deviceUUID'));
    await queryAndStoreNRReportData(nrQuery);
    then_nrLogin_reportData_isAsExpected();
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

  function then_nrLogin_reportData_isAsExpected(): void {
    if (!_nrReportData) {
      fail('no report data has been retrieved from NR');
    }

    const nrEventsData = _nrReportData.results[0].events;
    if (!nrEventsData) {
      fail('NR retrieved report data has wrong structure');
    }

    sortNREventsDataAccordingToClientTime(nrEventsData);

    const nrLoginEventData = getNRLoginEventData(nrEventsData);
    then_nrLoginData_isAsExpected(nrLoginEventData);
  }

  function then_nrLoginData_isAsExpected(nrLoginEventData: IEvent): void {
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

  function sortNREventsDataAccordingToClientTime(nrAdLifeCycleEventsData: IEvent[]) {
    nrAdLifeCycleEventsData.sort((e1, e2) => e1.clientTime.localeCompare(e2.clientTime));
  }

  function getNRLoginEventData(sortedByClientTimeNRAdLifeCycleEventsData: IEvent[]): IEvent {
    // first event is login
    return sortedByClientTimeNRAdLifeCycleEventsData[0];
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
});
