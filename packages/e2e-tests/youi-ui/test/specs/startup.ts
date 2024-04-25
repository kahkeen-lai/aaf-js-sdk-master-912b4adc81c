/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const framework = process.env.framework || process.env.npm_package_config_framework;
const webUrl = process.env.npm_package_config_webUrl;

console.log('----- Configurations In startup -----');
console.log('----- PARAMS - framework:: ' + framework);
console.log('----- End Configurations -----');

export function initE2eDriver(): WebdriverIO.BrowserObject {
  // eslint-disable-next-line no-undef
  const e2eDriver = driver;
  if (framework === 'web') {
    e2eDriver.url(webUrl);
  }
  return e2eDriver;
}

export const rolloutOptionsE2eTesting = {
  applicationId: '5c7e4d0f0de22c766f60678f',
  userToken: '91aa0af5-d513-48b1-908c-4b2257119444',
  environment: 'E2E%20Testing'
};

export const rolloutOptionsTlvDev = {
  applicationId: '5c7e4d0f0de22c766f60678f',
  userToken: '91aa0af5-d513-48b1-908c-4b2257119444',
  environment: 'Development'
};

// const newRelicOptionsYouIe2eTesting = {
//   accountId: '2432790',
//   queryKey: 'NRIQ-rSjiv_EgQaPaD1mDmyPprSWwxs0YnP9f'
// }
export const newRelicOptionsTlvDev = {
  accountId: '2388469',
  queryKey: 'NRIQ-GvNyIn6HgUjD3dFzXMSFE68ZXyRITDiD'
};
export const states = [
  'HOST_AD_CREATE',
  'AD_CREATED',
  'HOST_AD_INIT',
  'AD_INIT',
  'AD_LOADED',
  'HOST_AD_START',
  'AD_STARTED',
  'AD_STARTING',
  'AD_PLAYING',
  'HOST_AD_STOP',
  'AD_STOPPING',
  'AD_STOPPED'
];

export const hostAdInitParams = [
  'contentType',
  'channelId',
  'programName',
  'networkName',
  'isDuringAd',
  'channelName',
  'programmerName',
  'expType',
  'adStartDelayHint',
  'context'
];
