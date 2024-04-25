import HomePage from '../pageobjects/home.page';
import ConfigPage from '../pageobjects/config.page';
import { expect } from 'chai';

//TODO: update to process.env.environment to be retrieved from the jenkins list
const environment = process.env.environment || process.env.npm_package_config_environment;

function goToConfigPage(): void {
  describe('Go to the config page', () => {
    it('should click on the config button and be redirected to the config page', () => {
      HomePage.btnConfig.click();
      ConfigPage.configPanelView.waitForDisplayed(10000);
      expect(ConfigPage.configPanelView.isDisplayed()).to.be.true;
    });
  });
}

function selectEnvironment(): void {
  describe('Select the correct environment', () => {
    it('should click on the correct environment setup button and get it displayed on the screen', () => {
      ConfigPage.btnConfigSelectedEnvironment.click();
      ConfigPage.viewConfigEnvironmentSelection.waitForDisplayed(10000);
      const environmentButton = ConfigPage.getBtnEnvironmentByEnvironmentName(environment);
      environmentButton.click();
      ConfigPage.btnConfigSelectedEnvironment.waitForDisplayed(10000);
      expect(ConfigPage.btnConfigSelectedEnvironment.getText()).to.eq(environment);
    });
  });

  describe('Save and see the changes in Home page', () => {
    it('should click on save button in config screen and see the correct selected environment in the log', () => {
      ConfigPage.btnSave.click();
      HomePage.appMainView.waitForDisplayed(3000);
      HomePage.waitUntilElementTextEqualsTo(HomePage.txtEnvironment, environment, 40000);
      expect(HomePage.txtEnvironment.getText()).to.eq(environment);
    });
  });
}

// eslint-disable-next-line jest/no-export
module.exports = {
  goToConfigPage: goToConfigPage,
  selectEnvironment: selectEnvironment
};
