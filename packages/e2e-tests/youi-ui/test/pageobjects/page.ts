/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// http://webdriver.io/guide/testrunner/pageobjects.html

export default class Page {
  // Save a screenshot to jestHelpers directory.
  // Use this to save a proof that an e2e test failed
  /* eslint-disable no-undef */
  /* eslint-disable @typescript-eslint/no-var-requires */

  saveScreenshot(dir, filename): void {
    const fs = require('fs');
    // Create directory if it doesn't exist.
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    browser.saveScreenshot(dir + filename);
  }

  waitUntilElementTextEqualsTo(element, expectedValue, waitTimeout): void {
    browser.waitUntil(
      () => {
        console.log(`element text is ${element.getText()}`);
        return element.getText() === expectedValue;
      },
      waitTimeout,
      `expected value ${expectedValue} was not reached after ${waitTimeout} ms`
    );
  }

  waitUntilTextNotEqualToValue(element, value, waitTimeout): void {
    browser.waitUntil(
      () => {
        console.log(`element text is ${element.getText()}`);
        return element.getText() !== value;
      },
      waitTimeout,
      `text was still equal to ${value} after ${waitTimeout} ms`
    );
  }
}
