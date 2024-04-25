const framework = process.env.framework || process.env.npm_package_config_framework;
const androidCapabilities = {
  youi: {
    app: `/Users/m23546/Jenkins/workspace/xaaf-js-FireTv-2e2/packages/demos/demo-youitv/youi/build/android/project/yidemo/build/outputs/apk/debug/yidemo-debug.apk`,
    automationName: 'YouiEngine',
    deviceName: 'emulator-5554',
    noReset: true,
    platformName: 'android',
    youiEngineAppAddress: 'localhost',
  },
  web: {
    browserName: 'Chrome',
    platformVersion: '10',
    chromedriverExecutable: '/Users/cz324b/Downloads/chromedriver',
    automationName: 'Appium',
    deviceName: 'emulator-5554',
    noReset: true,
    platformName: 'android',
    newCommandTimeout: 60000,
    takesScreenshot: false,
  },
};

const capabilities = [];
if (framework === 'youi') {
  capabilities.push(androidCapabilities.youi);
}
if (framework === 'web') {
  capabilities.push(androidCapabilities.web);
}

exports.config = capabilities;
