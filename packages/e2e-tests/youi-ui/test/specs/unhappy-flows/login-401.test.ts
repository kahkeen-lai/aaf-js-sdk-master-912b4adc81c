import HomePage from '../../pageobjects/home.page';
// eslint-disable-next-line
const { selectEnvironment } = require('../select-environment');
import { expect } from 'chai';

// eslint-disable-next-line no-undef
before(async () => {
  // Configure mock server responses
  // const mockServerHelper = new MockServerHelper();
  // await mockServerHelper.setupLogin('login', 401);
  // await mockServerHelper.setupOpportunity('opportunity', 401);
});

describe('Login 401 - Select environment', () => {
  selectEnvironment();
  // HomePage.waitUntilElementTextEqualsTo(HomePage.txtLoginEventType, 'FAILURE', 30000);
});

describe('Login 401 - Click on create and init and should get STATE_STOPPED', () => {
  it('should verify that once the INIT button is clicked, state is STOPPED', () => {
    HomePage.btnCreate.click();
    HomePage.btnInit.click();
    HomePage.waitUntilElementTextEqualsTo(HomePage.txtState, 'STATE_STOPPED', 30000);
    expect(HomePage.txtState.getText()).to.eq('STATE_STOPPED');
  });
});
