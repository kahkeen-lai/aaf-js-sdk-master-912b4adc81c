/* eslint-disable @typescript-eslint/naming-convention */
import { UuidGenerator, XaafEvent, XaafJsSdk } from '@xaaf/xaaf-js-sdk';
import { IQueryFilter } from '@xaaf/e2e-common';
import { setXaafJsSdkServiceMockDelegates, doesNewRelicReportExist, NR_TIMEOUT_MS, JEST_TIMEOUT_MS } from '../../utils';

let sdk, configMap;

const testsArray = [
  {
    text:
      'On failure initialize while api key without token part, FAILURE callback is thrown and Login not reported to NR',
    status: '5000-1',
    apiKey:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.IEtk2ESbme76dfcj1nERZqM_Vt_GERGqgF1joqqMnrEBOffZ9tP3chSdD5SWmRfCdiiVEWYK4GLqwEVey5DTYYy7fqGr9noTQq2A-dUK4QdYLOGymlG2H4jDwveK4cb4B0Kjfhjn1uqLO3DucSM94FskuGTT8hdVK-Uhij1WcSTWPkkJtso_VTQx4ssjBxVJdbpoJ5WNZqZzv2V0qR2oY5-_vGMuQ0k4_GAiB2uKcVP-Hn6nvWlsfWhHo_7-zuAG-07XQ2OMx8iBfYFKZukUnnSTrAI8_vZPtrDKjEoApK-Vq_SW_Ij4Qxr9GnEsv2nh0Z6O3eYy90IeSBA7BXipjQ'
  },
  {
    text:
      'On failure initialize while api key without token part, FAILURE callback is thrown and Login not reported to NR',
    status: '5000-1',
    apiKey:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsImFwcElkIjoiNWU2ZjQyZmZmYzgxNTkwMDFiYjIxOWYyIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2Iiwic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5hYmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1iZS1haW8uYXR0LmNvbS9hZHZlcnRpc2UtNTk4OCIsInByaXZpbGVnZVR5cGUiOiJ0ZXN0ZXIiLCJlbnZpcm9ubWVudCI6InRsdi1hZHZlcnRpc2UtODg4OCIsImlhdCI6MTU5NjAxOTQ5MCwiaXNzIjoiQVQmVCIsInN1YiI6IkFwaUtleSJ9.IEtk2ESbme76dfcj1nERZqM_Vt_GERGqgF1joqqMnrEBOffZ9tP3chSdD5SWmRfCdiiVEWYK4GLqwEVey5DTYYy7fqGr9noTQq2A-dUK4QdYLOGymlG2H4jDwveK4cb4B0Kjfhjn1uqLO3DucSM94FskuGTT8hdVK-Uhij1WcSTWPkkJtso_VTQx4ssjBxVJdbpoJ5WNZqZzv2V0qR2oY5-_vGMuQ0k4_GAiB2uKcVP-Hn6nvWlsfWhHo_7-zuAG-07XQ2OMx8iBfYFKZukUnnSTrAI8_vZPtrDKjEoApK-Vq_SW_Ij4Qxr9GnEsv2nh0Z6O3eYy90IeSBA7BXipjQ'
  },
  {
    text:
      'On failure initialize while api key without token part, FAILURE callback is thrown and Login not reported to NR',
    status: '9000',
    apiKey: 'eyJhYWEiOiJiYmIifQ=='
  }
];

describe('login', () => {
  jest.setTimeout(JEST_TIMEOUT_MS);

  for (const testParams of testsArray) {
    const platformAdvId = UuidGenerator.generate();
    configMap = new Map();
    configMap.set('platformAdvId', platformAdvId);
    sdk = new XaafJsSdk();
    setXaafJsSdkServiceMockDelegates();
    it(testParams.text, done => {
      const queryFilter: IQueryFilter[] = [];
      queryFilter.push({ Field: 'isSilent', Value: false, Operator: 'is' });
      queryFilter.push({ Field: 'isSDKTrace', Value: false, Operator: 'is' });
      queryFilter.push({ Field: 'loginState', Value: false, Operator: 'is' });
      queryFilter.push({ Field: 'success', Value: false, Operator: 'is' });
      queryFilter.push({ Field: 'errorCode', Value: `'${testParams.status}'`, Operator: '=' });

      sdk.xaafInitListener = async (xaafEvent: XaafEvent) => {
        setTimeout(async () => {
          expect(xaafEvent.type).toEqual('FAILURE');
          const errorCode = xaafEvent.error.errorCode;
          expect(errorCode).toEqual(`${testParams.status}`);
          const nrResult = await doesNewRelicReportExist(platformAdvId, queryFilter);
          expect(nrResult).toBe(false);
          done();
        }, NR_TIMEOUT_MS);
      };
      sdk.initialize(testParams.apiKey, configMap);
    });
  }
});
