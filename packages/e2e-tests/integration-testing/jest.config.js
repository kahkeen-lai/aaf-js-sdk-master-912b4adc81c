const baseConfig = require('./jest.config.integration.base');
const rootDir = __dirname;
process.env.JEST_HTML_REPORTERS_TEMP_DIR_PATH = `${__dirname}/coverage/integ/basics`;
module.exports = {
  ...baseConfig,
  setupFiles: [`${rootDir}/jest.setup.js`],
  testMatch: ['<rootDir>/src/tests/**/*.spec.ts'],
  reporters: [
    ['jest-slow-test-reporter', {"numTests": 10, "warnOnSlowerThan": 60, "color": true}],
    'default',
    ['jest-html-reporters', {
      'hideIcon': true,
      'filename': 'coverage/tests.html',
      'expand': true,
      'pageTitle': 'General Test results'
    }]
  ],
};
