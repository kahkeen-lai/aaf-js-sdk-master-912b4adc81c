/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');
const tunnel = require('tunnel');
import {
  MockedFeatureFlagDelegate,
  MockedLoginServiceDelegate,
  MockedXaafVideoElement,
  MockedXaafAdContainer,
  MockedReportServiceDelegate
} from './mock/';
import { XaafJsSdk, OpportunityType, ReportService } from '@xaaf/xaaf-js-sdk';
import * as Xaaf from '@xaaf/xaaf-js-sdk';
import { ReportingE2eHelper, ReportingServiceProvider, IReport, IQueryFilter } from '@xaaf/e2e-common';
import { HttpService } from '@xaaf/common';
export const newRelicOptionsTlvDev = {
  accountId: '2388469',
  queryKey: 'NRIQ-GvNyIn6HgUjD3dFzXMSFE68ZXyRITDiD'
};
export const newRelicOptionsTlvLal = {
  accountId: '2523000',
  queryKey: 'NRIQ-ze4RelPe84-2fccYtQuCSQAgdfzGLxCD'
};
export const rolloutOptionsTlvDev = {
  applicationId: '5c7e4d0f0de22c766f60678f',
  userToken: '91aa0af5-d513-48b1-908c-4b2257119444',
  environment: 'Development'
};

export const NR_TIMEOUT_MS = 10 * 1000;
export const JEST_TIMEOUT_MS = 60 * 1000;
export function setXaafJsSdkServiceMockDelegates(enabledFlagNames?: string[]): void {
  Xaaf.InjectionContainer.registerInstance(
    Xaaf.ContainerDef.featureFlagsDelegate,
    new MockedFeatureFlagDelegate(enabledFlagNames)
  );
  Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.storageService, new MockedLoginServiceDelegate());
  Xaaf.InjectionContainer.registerInstance(Xaaf.ContainerDef.reportServiceDelegate, new MockedReportServiceDelegate());
}

export async function doesNewRelicReportExist(platformAdvId: string, queryFilter: IQueryFilter[]): Promise<boolean> {
  const reportHelper: ReportingE2eHelper = new ReportingE2eHelper(
    ReportingServiceProvider.NewRelic,
    newRelicOptionsTlvDev,
    platformAdvId
  );
  const newRelicResults: IReport = await reportHelper.getReportsByMultipleFilter(queryFilter);
  if (!newRelicResults) {
    return false;
  }
  const result = newRelicResults.results;
  return result[0].events.length >= 1;
}

export async function getNewRelicReport(platformAdvId: string, queryFilter: IQueryFilter[]): Promise<number> {
  const reportHelper: ReportingE2eHelper = new ReportingE2eHelper(
    ReportingServiceProvider.NewRelic,
    newRelicOptionsTlvDev,
    platformAdvId
  );
  const newRelicResults: IReport = await reportHelper.getReportsByMultipleFilter(queryFilter);
  if (!newRelicResults) {
    return 0;
  }
  const result = newRelicResults.results;
  return result[0].events.length;
}

export async function getNewRelicReportByQueryString(platformAdvId: string, queryString: string): Promise<IReport> {
  const reportHelper: ReportingE2eHelper = new ReportingE2eHelper(
    ReportingServiceProvider.NewRelic,
    newRelicOptionsTlvDev,
    platformAdvId
  );
  return reportHelper.getReportsByQueryString(queryString);
}

export function clearAfterTest(sdk: XaafJsSdk): void {
  sdk.xaafInitListener = null;
}

const globalResponseBySession = {};
const responsePresets = {
  'https://xaaf-be-dev.att.com/mock/request/youi/404': () => {
    throw {
      response: {
        status: 404,
        data: {
          message: 'Page not found',
          data: 'Resource not found'
        }
      }
    };
  },
  'https://xaaf-be-dev.att.com/mock/request/youi/500': () => {
    throw {
      response: {
        status: 500,
        data: {
          message: 'Internal server error',
          data: 'Internal server error'
        }
      }
    };
  },
  'https://xaaf-be-dev.att.com/mock/request/youi/timeout': () => {
    throw { code: 'ETIMEDOUT' };
  }
};

export function setMockServerResponse(responsesArray: unknown, sessionId: string): void {
  const httpService = Xaaf.InjectionContainer.resolve<HttpService>(Xaaf.ContainerDef.httpService);

  globalResponseBySession[sessionId] = { counter: 0, responses: responsesArray };
  if (!httpService['_axiosInstance'].tempered) {
    const originalRequestFunction = httpService['_axiosInstance'].request;
    httpService['_axiosInstance'].tempered = originalRequestFunction;
    httpService['_axiosInstance'].request = async options => { // NOSONAR
      try {
        const url = options.url;
        if (!url) {
          throw new Error('Stop Test, no url in request');
        }

        const platformAdvId = options.params?.platformAdvId || sessionId;
        let presetUrl = url;
        if (url.indexOf('?') > 0) {
          presetUrl = url.split('?')[0];
        }

        if (responsePresets[presetUrl] !== undefined) {
          return responsePresets[presetUrl]();
        } else if (url && url.indexOf('xaaf-be') > -1) {
          const callCounter = globalResponseBySession[platformAdvId].counter;
          if (globalResponseBySession[platformAdvId] && globalResponseBySession[platformAdvId].responses[callCounter]) {
            const returnitem = globalResponseBySession[platformAdvId].responses[callCounter];
            globalResponseBySession[platformAdvId].counter++;
            if (returnitem.error && returnitem.data) {
              throw { response: { status: returnitem.status, data: returnitem.data } };
            } else {
              return returnitem;
            }
          } else {
            const result = await originalRequestFunction(options);
            return result;
          }
        } else {
          // console.log('actual request url', options.url, options.data || 'no data');
          const result = await originalRequestFunction(options);
          return result;
        }
      } catch (error) {
        console.log('error in mock server', error);
        // throw error;
      }
    };
  }
}

export function resetMockServerResponse(): void {
  const httpService = Xaaf.InjectionContainer.resolve<HttpService>(Xaaf.ContainerDef.httpService);
  if (httpService['_axiosInstance'].tempered) {
    httpService['_axiosInstance'].request = httpService['_axiosInstance'].tempered;
    delete httpService['_axiosInstance'].tempered;
  }
}

export function convertKeyValuePairsStringToMap(
  keyValuePairsString: string,
  pairsStringSplitter: string,
  singlePairKeyValueSplitter: string
): Map<string, string> {
  return new Map<string, string>(
    keyValuePairsString
      .split(pairsStringSplitter)
      .map(keyValuePairString => keyValuePairString.split(singlePairKeyValueSplitter) as [string, string])
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function initializeSDKParamsForBlacklist(
  platformAdvIdFilterValue: string,
  contentType: string,
  programName: string,
  programmerName: string,
  networkName: string,
  isDuringAd: string,
  channelName: string
): { configMap; el; initAdinfo; sdk; opportunityInfo } {
  const configMap = new Map();
  configMap.set('platformAdvId', platformAdvIdFilterValue);
  configMap.set('hostRequestId', '1234-5678');
  configMap.set('sdkName', 'integration-tests');
  const mockedXaafElement = new MockedXaafVideoElement();
  const el = new MockedXaafAdContainer(mockedXaafElement);
  const initAdinfo = new Map<string, string>([
    ['platform', 'dfw'],
    ['sdkName', 'tvos'],
    ['userType', '2'],
    ['sdkVersion', 'v1'],
    ['appName', 'integration-sdk'],
    ['tenantSystemName', 'directv'],
    ['contentType', contentType],
    ['programName', programName],
    ['programmerName', programmerName],
    ['networkName', networkName],
    ['isDuringAd', isDuringAd],
    ['channelName', channelName]
  ]);
  const sdk = new XaafJsSdk();
  sdk['_reportService']._isInitialized = false;
  const opportunityInfo = {
    opportunity: OpportunityType.Pause,
    arguments: new Map()
  };

  return { configMap, el, initAdinfo, sdk, opportunityInfo };
}

export function InitializeSDKParams(
  platformAdvIdFilterValue
): { configMap; el; initAdinfo; sdk: XaafJsSdk; opportunityInfo } {
  const configMap = new Map();
  configMap.set('platformAdvId', platformAdvIdFilterValue);
  configMap.set('hostRequestId', '1234-5678');
  configMap.set('sdkName', 'integration-tests');
  // configMap.set('consoleLogger', 'true');
  // configMap.set('loggerLevel', 'error');

  const mockedXaafElement = new MockedXaafVideoElement();
  const el = new MockedXaafAdContainer(mockedXaafElement);
  const initAdinfo = new Map<string, string>([
    ['platform', 'dfw'],
    ['sdkName', 'tvos'],
    ['contentType', 'vod'],
    ['userType', '2'],
    ['sdkVersion', 'v1'],
    ['appName', 'integration-sdk'],
    ['tenantSystemName', 'directv'],
    ['deviceType', 'tvos']
  ]);
  const sdk = new XaafJsSdk();
  const opportunityInfo = {
    opportunity: OpportunityType.Pause,
    arguments: new Map()
  };

  return { configMap, el, initAdinfo, sdk, opportunityInfo };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}
