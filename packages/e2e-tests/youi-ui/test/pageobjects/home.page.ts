import Page from './page';

// This class contains Page Object Locators and methods for the Screen.
const appRootId = 'id:e2e_view_app_root';
const buttonCreateId = 'id:e2e_btn_CREATE';
const buttonInitId = 'id:e2e_btn_INIT';
const buttonStartId = 'id:e2e_btn_START';
const buttonStopId = 'id:e2e_btn_STOP';
const buttonConfig = 'id:e2e_btn_CONFIG';
const textStateId = 'id:e2e_text_STATE';
const textLoginRequestId = 'id:e2e_text_login_request_id';
const textAdRequestId = 'id:e2e_text_ad_request_id';
const textPlatformAdvId = 'id:e2e_text_platformAdvId';
const adPlayingViewId = 'id:e2e_view_AAF';
const textLoginEventType = 'id:e2e_text_login_event_type';
const textEnvironment = 'id:e2e_text_environment';
// declaring the $() function to fix the no-undef lint issue
declare function $(element: string);

class HomePage extends Page {
  // '$' is equivalent to 'browser.element'
  // http://webdriver.io/api/utility/$.html
  // http://webdriver.io/guide/usage/selectors.html
  // To search for name: $('name:mySelector') or $('~mySelector')
  // To search for class name: $('class name:mySelector')
  // To search for id: $('id:mySelector')

  get appMainView(): WebdriverIO.Element {
    return $(appRootId);
  }

  get btnCreate(): WebdriverIO.Element {
    return $(buttonCreateId);
  }

  get btnInit(): WebdriverIO.Element {
    return $(buttonInitId);
  }

  get btnStart(): WebdriverIO.Element {
    return $(buttonStartId);
  }

  get btnStop(): WebdriverIO.Element {
    return $(buttonStopId);
  }

  get btnConfig(): WebdriverIO.Element {
    return $(buttonConfig);
  }

  get txtState(): WebdriverIO.Element {
    return $(textStateId);
  }

  get txtPlatformAdvId(): WebdriverIO.Element {
    return $(textPlatformAdvId);
  }

  get txtEnvironment(): WebdriverIO.Element {
    return $(textEnvironment);
  }

  get txtLoginRequestId(): WebdriverIO.Element {
    return $(textLoginRequestId);
  }

  get txtAdRequestId(): WebdriverIO.Element {
    return $(textAdRequestId);
  }

  get txtLoginEventType(): WebdriverIO.Element {
    return $(textLoginEventType);
  }

  get adPlayingView(): WebdriverIO.Element {
    return $(adPlayingViewId);
  }
}

export default new HomePage();
