/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  MockedXaafVideoElement,
  MockedXaafAdContainer,
  createMockedOpportunityInfo,
  createMockedSDKArguments
} from '../mock';
import {
  AdEvent,
  AdEventType,
  CommandPlaybackReport,
  LoggerService,
  XaafJsSdk,
  XipEvent,
  XipProvider
} from '@xaaf/xaaf-js-sdk';
import { IntegrationApiKeyConfig } from '../environment';
import { JEST_TIMEOUT_MS, setXaafJsSdkServiceMockDelegates } from '../utils';
import * as Core from '@xaaf/common';
import { FileLogger } from '../file-logger';

const expectedMeasurementUrlParams = [
  'ExtSrc',
  'DeviceType',
  'PartnerProfileID',
  'OppType',
  'TransactionId',
  'ChannelName',
  'App'
];

describe('measurement reporting tests', () => {
  jest.setTimeout(JEST_TIMEOUT_MS * 2);
  jest.retryTimes(3);

  let _mockedSDKArguments;
  let _mockedOpportunityInfo;
  let _mockedXaafAdContainer;
  let _mockedInitAdinfo;
  const fileLogger = new FileLogger();
  let providers: XipProvider[];
  const xaafJsSdk = new XaafJsSdk();
  xaafJsSdk['_createLogger'] = jest.fn().mockImplementation(_createLogger.bind(xaafJsSdk));
  fileLogger.clearFileLog();
  const loggerService = LoggerService.getInstance();
  loggerService.debug = jest.fn().mockImplementation();

  function _createLogger(logLevel: string, consoleLoggerOut: string): void {
    const extractedLogLevel: Core.LogLevel = Core.LogLevel.LogVerbose;
    const loggerConstruct: Core.LoggerConstruct = {
      logLevel: extractedLogLevel,
      loggers: [fileLogger]
    };
    this._logger.createLogger(loggerConstruct);
    // Todo | CR: change the way we use prefixes in logger
    this._logger.debug('[XaafJsSdk::initialize] AAF SDK Application Logger started');
  }

  beforeAll(async () => {
    _mockedSDKArguments = createMockedSDKArguments();
    _mockedOpportunityInfo = createMockedOpportunityInfo();
    _mockedXaafAdContainer = new MockedXaafAdContainer(new MockedXaafVideoElement());
    _mockedInitAdinfo = new Map<string, string>([
      ['platform', 'dfw'],
      ['sdkName', 'tvos'],
      ['contentType', 'vod'],
      ['userType', '2'],
      ['sdkVersion', '3.0.1'],
      ['tenantSystemName', 'directv'],
      ['deviceType', 'tvos']
    ]);
    const projectId = process.env.EMUSE_PROJECT_ID || 6099;
    _mockedInitAdinfo.set('projectId', projectId);
    setXaafJsSdkServiceMockDelegates();
  });

  it('Measurement reporting to Emuse test - 3 URL’s on AD_STARTING', done => {
    const emuseName = 'Emuse';
    let clientTime;
    let deviceId;
    let initialized = false;
    xaafJsSdk.xaafInitListener = () => {
      const executableAd = xaafJsSdk.getExecutableAd(_mockedOpportunityInfo);
      executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
        providers = _mockedXaafAdContainer.mockedXaafElement.xaafElementListener._commandModel.report.providers;
        const emuseProvider = providers.find(provider => provider.name === emuseName);

        switch (adEvent.type) {
          case AdEventType.Loaded: {
            executableAd.startAd(_mockedXaafAdContainer);
            // @ts-ignore
            clientTime = executableAd._configService.getMeasurementParams('clientFormattedTimeStamp');
            // @ts-ignore
            deviceId = executableAd._configService.getMeasurementParams('deviceId');
            break;
          }
          case AdEventType.Started: {
            setTimeout(() => {
              emuseProvider.events.forEach(async (event: XipEvent) => {
                const expectedUrl = `${event.url}&ClientTime=${clientTime}&DeviceID=${deviceId}`;
                xaafJsSdk['_logger'].verbose('AD Starting measurement url ' + expectedUrl + '\n');
                try {
                  expect(loggerService.debug).toBeCalledWith(`[HttpService]:[request] success: ${expectedUrl}`);
                } catch (error) {
                  expect(error.message).toContain('init');
                }
                expectedMeasurementUrlParams.forEach(param => {
                  expect(verifyUrlParams(param, event.url)).toBeTruthy();
                });
              });
            }, 5000);
            setTimeout(() => {
              executableAd.stopAd();
            }, 5000);
            break;
          }
          case AdEventType.Stopped: {
            done();
          }
        }
      };
      executableAd.initAd(_mockedXaafAdContainer, _mockedInitAdinfo);
    };
    if (!initialized) {
      xaafJsSdk.initialize(IntegrationApiKeyConfig.tlvLal, _mockedSDKArguments);
    }
  });

  it('Measurement reporting to Emuse - 4 Quartiles during video play test', done => {
    let playbackReports: CommandPlaybackReport[];
    const clientStartTime: string[] = [];
    const positionSec: number[] = [];
    let initialized = false;
    xaafJsSdk.xaafInitListener = async () => {
      const executableAd = xaafJsSdk.getExecutableAd(_mockedOpportunityInfo);
      executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
        const videoCommand = _mockedXaafAdContainer.mockedXaafElement.xaafElementListener;
        switch (adEvent.type) {
          case AdEventType.Loaded: {
            playbackReports =
              _mockedXaafAdContainer.mockedXaafElement.xaafElementListener._commandModel.playback_reports;
            playbackReports.forEach(report => {
              positionSec.push(report.positionSec);
            });
            executableAd.startAd(_mockedXaafAdContainer);
            break;
          }
          case AdEventType.Started: {
            let time = 0;
            let quartileTime = positionSec.shift() * 1000;
            const interval = setInterval(() => {
              time = time + 1000;
              if (time === quartileTime) {
                // @ts-ignore
                const clientTime = executableAd._configService.getMeasurementParams('clientFormattedTimeStamp');
                clientStartTime.push(clientTime);
                quartileTime = positionSec.shift() * 1000;
              }
              videoCommand.onCurrentTimeUpdated(time);
            }, 1000);
            setTimeout(async () => {
              clearInterval(interval);
              time = 0;
              executableAd.stopAd();
              await videoCommand._onCommandCompleted();
              // @ts-ignore
              const clientTime = executableAd._configService.getMeasurementParams('clientFormattedTimeStamp');
              clientStartTime.push(clientTime);
            }, 60 * 1000);
            break;
          }
          case AdEventType.Stopped: {
            setTimeout(() => {
              console.log('Measurement reporting to Emuse test - 4 Quartiles during video play test');
              playbackReports.forEach(report => {
                report.providers.forEach(provider => {
                  const quartileUrl = provider.events[0].url;
                  const clientTime = clientStartTime.shift();
                  // @ts-ignore
                  const deviceId = executableAd._configService.getMeasurementParams('deviceId');
                  const expectedUrl = `${quartileUrl}&ClientTime=${clientTime}&DeviceID=${deviceId}`;
                  xaafJsSdk['_logger'].verbose('AD quartile measurement url ' + expectedUrl + '\n');
                  expectedMeasurementUrlParams.forEach(param => {
                    expect(verifyUrlParams(param, quartileUrl)).toBeTruthy();
                  });
                  try {
                    expect(loggerService.debug).toBeCalledWith(`[HttpService]:[request] success: ${expectedUrl}`);
                  } catch (error) {
                    expect(error.message).toContain('init');
                  }
                });
              });
              done();
            }, 5000);
          }
        }
      };
      executableAd.initAd(_mockedXaafAdContainer, _mockedInitAdinfo);
    };
    if (!initialized) {
      xaafJsSdk.initialize(IntegrationApiKeyConfig.tlvLal, _mockedSDKArguments);
    }
  });

  it('Measurement reporting to Emuse - 3 URLs on AD_STOP and duration test', done => {
    let commandReportProviders: XipProvider[];
    let duration: string;
    let initialized = false;
    xaafJsSdk.xaafInitListener = async () => {
      const executableAd = xaafJsSdk.getExecutableAd(_mockedOpportunityInfo);
      executableAd.executableAdEventListener = async (adEvent: AdEvent) => {
        const videoCommand = _mockedXaafAdContainer.mockedXaafElement.xaafElementListener;
        // @ts-ignore
        commandReportProviders = executableAd._commandsArray[1]._commandModel.report.providers;

        switch (adEvent.type) {
          case AdEventType.Loaded: {
            executableAd.startAd(_mockedXaafAdContainer);
            break;
          }
          case AdEventType.Started: {
            let time = 0;
            const interval = setInterval(() => {
              time = time + 1000;
              _mockedXaafAdContainer.mockedXaafElement.xaafElementListener.onCurrentTimeUpdated(time);
            }, 1000);
            setTimeout(async () => {
              clearInterval(interval);
              time = 0;
              executableAd.stopAd();
              // @ts-ignore
              duration = executableAd._configService.getMeasurementParams('timeFromStarted');
              await videoCommand._onCommandCompleted();
            }, 5000);
            break;
          }
          case AdEventType.Stopped: {
            // @ts-ignore
            const clientTime = executableAd._configService.getMeasurementParams('clientFormattedTimeStamp');
            // @ts-ignore
            const deviceId = executableAd._configService.getMeasurementParams('deviceId');

            setTimeout(() => {
              commandReportProviders.forEach(provider => {
                provider.events.forEach(event => {
                  const expectedUrl = `${event.url}&ClientTime=${clientTime}&Duration=${duration}&DeviceID=${deviceId}`;
                  xaafJsSdk['_logger'].verbose('AD Stopping measurement url ' + expectedUrl + '\n');
                  expectedMeasurementUrlParams.forEach(param => {
                    expect(verifyUrlParams(param, expectedUrl)).toBeTruthy();
                  });
                  try {
                    expect(loggerService.debug).toBeCalledWith(`[HttpService]:[request] success: ${expectedUrl}`);
                  } catch (error) {
                    expect(error.message).toContain('init');
                  }
                });
              });
              done();
            }, 10000);
          }
        }
      };
      executableAd.initAd(_mockedXaafAdContainer, _mockedInitAdinfo);
    };
    if (!initialized) {
      xaafJsSdk.initialize(IntegrationApiKeyConfig.tlvLal, _mockedSDKArguments);
    }
  });
});

function verifyUrlParams(param: string, url: string): boolean {
  const isParam = url.includes(param);
  if (!isParam) {
    console.error(`FAIL! This url ${url} - mandatory parameter ${param} is missing`);
  }
  return isParam;
}
