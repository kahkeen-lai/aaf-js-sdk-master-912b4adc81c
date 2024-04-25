import { expect } from 'chai';
import HomePage from '../../pageobjects/home.page';
import { initE2eDriver } from '../startup';
import { MockServerHelper } from '@xaaf/e2e-common';
// eslint-disable-next-line
const { selectEnvironment } = require('../select-environment');
const e2eDriver = initE2eDriver();

// eslint-disable-next-line no-undef
before(async () => {
  // Configure mock server responses
  const mockServerHelper = new MockServerHelper();
  await mockServerHelper.setupLogin('login', 200);
  await mockServerHelper.setupOpportunity('e2e-Youi-Pause-Show-dynamic-missing-resource', 200);

  // To restart the app
  // await e2eDriver.closeApp();
  // await e2eDriver.launchApp();

  // UNCOMMENT setupFeatureFlags: if you work with mock
  // COMMENT setupFeatureFlags: if you use real server
  // await setupFeatureFlags();
});

describe('Home screen - select environment', () => {
  selectEnvironment();
  HomePage.waitUntilElementTextEqualsTo(HomePage.txtLoginEventType, 'SUCCESS', 30000);
});

describe('All the buttons are on the screen', () => {
  it('should display the button CREATE', () => {
    expect(HomePage.btnCreate.isDisplayed()).to.be.true;
  });
  it('should display the button INIT', () => {
    expect(HomePage.btnInit.isDisplayed()).to.be.true;
  });
  it('should display the button START', () => {
    expect(HomePage.btnStart.isDisplayed()).to.be.true;
  });
  it('should display the button STOP', () => {
    expect(HomePage.btnStart.isDisplayed()).to.be.true;
  });
  it('should display the button CONFIG', () => {
    expect(HomePage.btnConfig.isDisplayed()).to.be.true;
  });
});

describe('The main view is on the screen', () => {
  it('should display the main view on the screen', () => {
    expect(HomePage.appMainView.isDisplayed()).to.be.true;
  });
});

describe('Show dynamic advertisement flow', () => {
  let loginRequestId, adRequestId, platformAdvId;

  // eslint-disable-next-line no-undef
  before(async () => {
    console.log('[before] Start to run the show video ad flow');
    console.log('Clicks on Create, Init, Start and Stop buttons');
    HomePage.btnCreate.click();
    e2eDriver.pause(2000);
    HomePage.btnInit.click();
    HomePage.waitUntilElementTextEqualsTo(HomePage.txtState, 'STATE_LOADED', 50000);

    HomePage.waitUntilElementTextEqualsTo(HomePage.txtState, 'STATE_ERROR', 70000);
  });

  it('should populate correctly the loginRequestId (should not be equal to N/A)', () => {
    loginRequestId = HomePage.txtLoginRequestId.getText();
    expect(loginRequestId).to.not.eq('N/A');
  });
  it('should populate correctly the adRequestId (should not be equal to N/A)', () => {
    adRequestId = HomePage.txtAdRequestId.getText();
    expect(adRequestId).to.not.eq('N/A');
  });
  it('should populate correctly the platformAdvId (should not be equal to N/A) and length should be equal to 36', () => {
    platformAdvId = HomePage.txtPlatformAdvId.getText();
    expect(platformAdvId).to.not.eq('N/A');
    expect(platformAdvId.length).to.eq(36);
  });
});

// eslint-disable-next-line no-undef
after(async () => {
  console.log('[after] Finished to run the show dynamic ad flow');
  console.log('[after] completed');
});
