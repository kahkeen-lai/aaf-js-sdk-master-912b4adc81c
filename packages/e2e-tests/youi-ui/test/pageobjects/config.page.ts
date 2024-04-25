import Page from './page';

// This class contains Page Object Locators and methods for the Screen.

const viewConfigPanel = 'id:e2e_view_config_panel';
const viewConfigEnvironmentSelection = 'id:e2e_view_config_environment_selection';
const buttonSave = 'id:e2e_btn_SAVE';
const buttonConfigSelectedEnvironment = 'id:e2e_btn_config_environment_selected';

// declaring the $() function to fix the no-undef lint issue
declare function $(element: string);

class ConfigPage extends Page {
  get configPanelView(): WebdriverIO.Element {
    return $(viewConfigPanel);
  }

  get viewConfigEnvironmentSelection(): WebdriverIO.Element {
    return $(viewConfigEnvironmentSelection);
  }

  get btnSave(): WebdriverIO.Element {
    return $(buttonSave);
  }

  get btnConfigSelectedEnvironment(): WebdriverIO.Element {
    return $(buttonConfigSelectedEnvironment);
  }

  getBtnEnvironmentByEnvironmentName(environmentName: string): WebdriverIO.Element {
    return $(`id:e2e_btn_config_environment_${environmentName}`);
  }
}

export default new ConfigPage();
