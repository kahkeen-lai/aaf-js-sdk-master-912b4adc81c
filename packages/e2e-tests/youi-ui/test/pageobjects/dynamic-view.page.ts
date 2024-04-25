import Page from './page';

// This class contains Page Object Locators and methods for the Screen.

const dynamicImageBackground = 'id:e2e_dynamic_ImageBackground';
const dynamicAdImage = 'id:e2e_dynamic_adImage';
const dynamicSponsorImage = 'id:e2e_dynamic_sponsorImage';
const dynamicAdText = 'id:e2e_dynamic_Text';

// declaring the $() function to fix the no-undef lint issue
declare function $(element: string);

class DynamicViewPage extends Page {
  get dynamicImageBackground(): WebdriverIO.Element {
    return $(dynamicImageBackground);
  }

  get dynamicAdImage(): WebdriverIO.Element {
    return $(dynamicAdImage);
  }

  get dynamicAdText(): WebdriverIO.Element {
    return $(dynamicAdText);
  }

  get dynamicSponsorImage(): WebdriverIO.Element {
    return $(dynamicSponsorImage);
  }
}

export default new DynamicViewPage();
