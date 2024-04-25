import { AdEvent, AdEventType, OpportunityType, UuidGenerator, XaafEvent, XaafJsSdk } from '@xaaf/xaaf-js-sdk';

import mockLoginResponse from '../../apis/login-200-response';
import mockOpportunityResponseOneVideoRepeatCount from './apis/measurement-200-response';
import mockOpportunityResponseTwoVideoRepeatCount from '../../apis/opportunity-with-two-video-repeat-count';
import mockOpportunityResponseThreeVideoRepeatCount from '../../apis/opportunity-with-three-video-repeat-count';
import { IntegrationApiKeyConfig } from '../../environment';
import { JEST_TIMEOUT_MS, setMockServerResponse, setXaafJsSdkServiceMockDelegates } from '../../utils';
import { MockedXaafAdContainer, MockedXaafVideoElement } from '../../mock';

let platformAdvIdFilterValue;
let configMap: Map<string, string>;
let initAdinfo: Map<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _initializeSDKParams(): any {
  configMap = new Map();
  configMap.set('hostRequestId', '1234-5678');
  configMap.set('platformAdvId', platformAdvIdFilterValue);
  const mockedXaafElement = new MockedXaafVideoElement();
  const el = new MockedXaafAdContainer(mockedXaafElement);
  initAdinfo = new Map<string, string>([
    ['platform', 'dfw'],
    ['sdkName', 'tvos'],
    ['contentType', 'vod'],
    ['userType', '2'],
    ['sdkVersion', 'v1'],
    ['tenantSystemName', 'directv'],
    ['deviceType', 'tvos']
  ]);
  const sdk = new XaafJsSdk();
  const opportunityInfo = {
    opportunity: OpportunityType.Pause,
    arguments: new Map()
  };

  return { opportunityInfo, el, mockedXaafElement, sdk };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setSdk(mockOpportunityResponse): any {
  const { opportunityInfo, el, mockedXaafElement, sdk } = _initializeSDKParams();
  setXaafJsSdkServiceMockDelegates();
  setMockServerResponse([mockLoginResponse, mockOpportunityResponse], platformAdvIdFilterValue);
  sdk.initialize(IntegrationApiKeyConfig.devMockApiKey, configMap);
  return { opportunityInfo, el, mockedXaafElement, sdk };
}

describe('SHOW_VIDEO opportunity - repeatCount property parsing', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);

  it.each([
    [mockOpportunityResponseOneVideoRepeatCount, 1],
    [mockOpportunityResponseTwoVideoRepeatCount, 2],
    [mockOpportunityResponseThreeVideoRepeatCount, 3]
  ])(
    'on opportunity %s with repeatCount %i, should move states correctly',
    // @ts-ignore
    (response, expected, done) => {
      platformAdvIdFilterValue = UuidGenerator.generate();
      const { opportunityInfo, el, sdk } = setSdk(response);
      sdk.xaafInitListener = (xaafEvent: XaafEvent) => {
        expect(xaafEvent).toEqual({ type: 'SUCCESS' });
        const executableAd = sdk.getExecutableAd(opportunityInfo);
        expect(executableAd.currentState).toEqual('STATE_CREATED');
        executableAd.executableAdEventListener = (state: AdEvent) => {
          const [showVideoCommand] = executableAd['_commandsArray'];
          switch (state.type) {
            case AdEventType.Loaded:
              showVideoCommand['_isBufferForPlaybackReached'] = jest.fn(async () => true);
              executableAd.startAd(el);
              break;
            case AdEventType.Started:
              expect(executableAd.currentState).toEqual('STATE_STARTED');
              setTimeout(() => {
                expect(executableAd.currentState).toEqual('STATE_PLAYING');
                expect(showVideoCommand['_videoRepeatCount']).toEqual(expected);
                done();
              }, 3000);
              break;
          }
        };
        executableAd.initAd(el, initAdinfo);
      };
    }
  );
});
