import { expect } from 'chai';
import HomePage from '../../pageobjects/home.page';
import { initE2eDriver, newRelicOptionsTlvDev, states, hostAdInitParams } from '../startup';
import { ReportingE2eHelper, ReportingServiceProvider, IReport, MockServerHelper } from '@xaaf/e2e-common';
// eslint-disable-next-line
const { selectEnvironment } = require('../select-environment');
const e2eDriver = initE2eDriver();
// eslint-disable-next-line no-undef
before(async () => {
  // Configure mock server responses
  const mockServerHelper = new MockServerHelper();
  await mockServerHelper.setupLogin('login', 200);
  await mockServerHelper.setupOpportunity('opportunity', 200);

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

describe('Show video advertisement flow', () => {
  let loginRequestId, adRequestId, platformAdvId;
  let reportHelper, eventsFromNewRelic;

  // eslint-disable-next-line no-undef
  before(async () => {
    console.log('[before] Start to run the show video ad flow');
    console.log('Clicks on Create, Init, Start and Stop buttons');
    HomePage.btnCreate.click();
    HomePage.btnInit.click();
    HomePage.waitUntilElementTextEqualsTo(HomePage.txtState, 'STATE_LOADED', 50000);

    HomePage.btnStart.click();
    HomePage.waitUntilElementTextEqualsTo(HomePage.txtState, 'STATE_STARTED', 70000);

    e2eDriver.pause(2000);
    HomePage.btnStop.click();
    HomePage.waitUntilElementTextEqualsTo(HomePage.txtState, 'STATE_STOPPED', 10000);
    console.log('[before] Finished to run the show video add flow');
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

  it('should report the correct Login events to New Relic', async () => {
    for (let i = 30; i >= 0; i = i - 1) {
      console.log(`Sleeping a few seconds to wait for new relic report. Remaining time: ${i} seconds`);
      e2eDriver.pause(1000);
    }

    reportHelper = new ReportingE2eHelper(ReportingServiceProvider.NewRelic, newRelicOptionsTlvDev, platformAdvId);

    console.log('###################' + 'Checking test results with New Relic reports');

    const loginResults: IReport = await reportHelper.getReports('loginRequestId', loginRequestId);
    let events;
    if (loginResults) {
      events = loginResults.results[0].events;
    }
    expect(events.length).to.equal(1);
    expect(events[0].name).to.eq('LOGIN');
  });

  it('should report the correct Ads life cycle events to New Relic (one per state change)', async () => {
    const adResults = await reportHelper.getReports('exeAdUUID', adRequestId);
    let numberOfStatesFound = 0;
    if (adResults) {
      eventsFromNewRelic = adResults.results[0].events;
      states.forEach((state) => {
        eventsFromNewRelic.forEach((xaafEvent) => {
          if (xaafEvent.name === state) {
            console.log(`State ${state} found`);
            numberOfStatesFound++;
          }
        });
      });
    }
    expect(numberOfStatesFound).to.eq(states.length);
  });

  it('should report the correct hostAdInitParams Values to New Relic', async () => {
    let hostAdInitParamsValues;
    if (eventsFromNewRelic) {
      eventsFromNewRelic.forEach((xaafEvent) => {
        if (xaafEvent.name === 'AD_INIT') {
          hostAdInitParamsValues = xaafEvent.hostAdInitParams;
        }
      });
    }
    expect(hostAdInitParamsValues).to.not.eq('No value');
    hostAdInitParams.forEach((param) => {
      expect(hostAdInitParamsValues).to.contain(param);
      console.log(`parameter "${param}" was found`);
    });
  });
});

// eslint-disable-next-line no-undef
after(async () => {
  console.log('[after] started');
  // await resetFeatureFlags();
  console.log('[after] completed');
});
