import { OpportunityInfo, OpportunityType, UuidGenerator } from '@xaaf/xaaf-js-sdk';

export function createMockedSDKArguments(): Map<string, string> {
  // mocking client's SDK arguments
  const mockedSDKArguments = new Map([
    ['platform', 'dfw'],
    ['deviceType', 'tvos'],
    ['deviceAdId', 'aaec17dc-ec32-517b-8f34-074db4c9f5d5'],
    ['userAdvrId', 'fVxL8dkHB10Exi1+/kjYhQ=='],
    ['fwSUSSId', 'fVxL8dkHB10Exi1+/kjYhQ=='],
    ['householdId', 'fVxL8dkHB10Exi1+/kjYhQ=='],
    ['deviceAdvrId', '198e6038-1ef7-45b0-99c0-81fac6348b2e'],
    ['userType', '2'],
    ['deviceFWAdId', '7112e70355377c66a6bec1b723cd5588e88315a311756bc5bf15d7291f3b9a8b'],
    ['tenantName', 'directv'],
    ['appName', 'Sample App'],
    ['appVersion', '3.0.21105.01005'],
    ['consoleLogger', 'true'],
    ['loggerLevel', 'error'],
    ['hostRequestId', UuidGenerator.generate()],
    ['appMode', 'debug']
  ]);

  // adding framework's SDK mocked SDK arguments
  mockedSDKArguments.set('platformAdvId', UuidGenerator.generate());
  mockedSDKArguments.set('deviceUUID', UuidGenerator.generate());
  mockedSDKArguments.set('sdkName', 'mockedSdkName');
  mockedSDKArguments.set('deviceId', 'mockedDeviceId');
  mockedSDKArguments.set('device', 'mockedDevice');
  mockedSDKArguments.set('deviceModel', 'mockedDeviceModel');
  mockedSDKArguments.set('deviceManufacturer', 'mockedDeviceManufacturer');
  mockedSDKArguments.set('osName', 'mockedOSName');
  mockedSDKArguments.set('osVersion', 'mockedOSVersion');
  mockedSDKArguments.set('platformName', 'mockedPlatformName');
  mockedSDKArguments.set('xaafAdvId', 'mockedXaafAdvId');
  mockedSDKArguments.set('sdkVersion', '1.10.1');
  mockedSDKArguments.set('tenantSystemName', 'mockedTenantSystemName');
  mockedSDKArguments.set('projectId', '6022');

  return mockedSDKArguments;
}

export function createMockedOpportunityInfo(): OpportunityInfo {
  return {
    arguments: new Map([
      ['context', 'pause'],
      ['hostRequestId', UuidGenerator.generate()]
    ]),
    opportunity: OpportunityType.Pause
  };
}

export function createMockedInitAdInfo(): Map<string, string> {
  return new Map([
    ['contentType', 'vod'],
    ['channelId', '1'],
    ['programName', 'game_of_throne'],
    ['networkName', 'abc'],
    ['isDuringAd', 'true'],
    ['channelName', 'espn'],
    ['programmerName', 'disney'],
    ['expType', 'out_of_stream'],
    ['adStartDelayHint', '2000'],
    ['context', 'pause']
  ]);
}
