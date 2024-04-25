/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NewRelicReportReader } from './new-relic/new-relic-reader';
export interface IQueryFilter {
  Field: string;
  Value: string | boolean;
  Operator: string;
}
export const ReportingServiceProvider = {
  NewRelic: 1
};

export interface IEvent {
  appName: string;
  appVersion: string;
  clientTime: string;
  device: string;
  deviceGroup: string;
  deviceManufacturer: string;
  deviceModel: string;
  deviceType: string;
  deviceUUID: string;
  externalIp: string;
  exeAdUUID: string;
  expID: string;
  featureFlags: string;
  hostAdInitParams?: string;
  hostSdkInitParams: string;
  internalIp: string;
  isSDKTrace: boolean;
  isSilent: boolean;
  lastAdLifeCycleEventName: string;
  loginRequestId: string;
  loginState: boolean;
  mode: string;
  name: string;
  osName: string;
  osVersion: string;
  platform: string;
  platformAdvId: string;
  platformName: string;
  projectBuildNumber: string;
  projectId: string;
  sdkName: string;
  sdkVersion: string;
  sessionId: string;
  success: boolean;
  tenantName: string;
  timestamp: number;
  timeSinceLastLifeCycleEvent: number;
  HOST_AD_CREATE: number;
  timeSinceAdCreatedEvent: number;
  HOST_AD_INIT: number;
  HOST_AD_START: number;
  timeSinceStarted: number;
  HOST_AD_STOP: number;
  userType: string;
  hostStoppingReason: string;
}

export const hostSdkInitParamNames = [
  'appMode',
  'appName',
  'appVersion',
  'consoleLogger',
  'device',
  'deviceId',
  'deviceManufacturer',
  'deviceModel',
  'deviceType',
  'deviceUUID',
  'hostRequestId',
  'loggerLevel',
  'osName',
  'osVersion',
  'platform',
  'platformName',
  'sdkName',
  'sdkVersion',
  'tenantName',
  'tenantSystemName',
  'userType'
];

export const commonParams = ['sessionId', 'featureFlags'];

// externalIP, internalIP, deviceGroup are not under test.
export const commonSDKMetricsParams = [
  'appName',
  'appVersion',
  'device',
  'deviceManufacturer',
  'deviceModel',
  'deviceType',
  'deviceUUID',
  'osName',
  'osVersion',
  'platform',
  'platformAdvId',
  'platformName',
  'sdkName',
  'sdkVersion',
  'tenantName',
  'userType'
];

export const adSessionMetricParams = [
  'adStartDelayHint',
  'channelId',
  'channelName',
  'expType',
  'isDuringAd',
  'networkName',
  'programName',
  'programmerName'
];

export const globalAdSessionMetricParams = ['context', 'opportunityType'];

interface IPerformanceStats {
  inspectedCount: number;
  omittedCount: number;
  matchCount: number;
  wallClockTime: number;
}

export interface IReport {
  results?: [
    {
      events: IEvent[];
    }
  ];
  performanceStats?: IPerformanceStats;
  metadata?: {
    eventTypes: string[];
    eventType: string;
    openEnded: boolean;
    beginTime: string;
    endTime: string;
    beginTimeMillis: number;
    endTimeMillis: number;
    rawSince: string;
    rawUntil: string;
    rawCompareWith: string;
    guid: string;
    routerGuid: string;
    messages: [];
    contents: [
      {
        function: string;
        limit: number;
        order: {
          column: string;
          descending: boolean;
        };
      }
    ];
  };
}

Object.freeze(ReportingServiceProvider);

export class ReportingE2eHelper {
  reportingHelper: NewRelicReportReader;

  constructor(reportingServiceProvider, options, platformAdvId) {
    if (reportingServiceProvider === ReportingServiceProvider.NewRelic) {
      if (!options.accountId) {
        console.error('accoundId must be supplied');
        return;
      }
      if (!options.queryKey) {
        console.error('key must be supplied');
        return;
      }
      if (!platformAdvId) {
        console.error('platformAdvId must be supplied');
        return;
      }
      this.reportingHelper = new NewRelicReportReader(options.accountId, options.queryKey, platformAdvId);
    } else {
      console.error(`Only 'New Relic' is supported`);
      this.reportingHelper = undefined;
    }
  }

  async getReports(field: string, expectedValue: string): Promise<IReport> {
    console.debug('#####################' + `looking for ${field} with value [${expectedValue}]`);
    return this.reportingHelper.runQuery(field, expectedValue);
  }

  async getReportsByMultipleFilter(SearchQuery: IQueryFilter[]): Promise<IReport> {
    return this.reportingHelper.runQueryByMultipleFilters(SearchQuery);
  }

  async getReportsByQueryString(query: string): Promise<IReport> {
    return this.reportingHelper.runQueryString(query);
  }
}
