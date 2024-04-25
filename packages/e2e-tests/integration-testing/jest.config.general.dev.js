const baseConfig = require('./jest.config.integration.base');
const rootDir = __dirname;

require("dotenv").config();
process.env.GENERAL_URL = process.env.TLV_DEV_FIRETV_URL;
process.env.GENERAL_APIKEY = process.env.TLV_DEV_FIRETV_APIKEY;
process.env.GENERAL_NR_ACCOUNT_ID = process.env.TLV_DEV_FIRETV_NR_ACCOUNT_ID;
process.env.GENERAL_NR_QUERY_KEY = process.env.TLV_DEV_FIRETV_NR_QUERY_KEY;

module.exports = {
  ...baseConfig,
  setupFiles: [`${rootDir}/jest.setup.js`],
  testMatch: ['<rootDir>/src/general/*.spec.ts'],
  reporters: [
    'jest-progress-bar-reporter',
    ['jest-html-reporters', {
      'hideIcon': true,
      'filename': 'coverage/general-dev-tests.html',
      'expand': true,
      'pageTitle': 'General Dev Test results'
    }]
  ],
};
