const baseConfig = require('./jest.config.integration.base');
const rootDir = __dirname;

require("dotenv").config();
process.env.GENERAL_URL = process.env.TLV_LAL_URL;
process.env.GENERAL_APIKEY = process.env.CUSTOM_API_KEY;
process.env.GENERAL_NR_ACCOUNT_ID = process.env.TLV_LAL_NR_ACCOUNT_ID;
process.env.GENERAL_NR_QUERY_KEY = process.env.TLV_LAL_NR_QUERY_KEY;

module.exports = {
  ...baseConfig,
  setupFiles: [`${rootDir}/jest.setup.js`],
  testMatch: ['<rootDir>/src/general/*.spec.ts'],
  reporters: [
    'jest-progress-bar-reporter',
    ['jest-html-reporters', {
      'hideIcon': true,
      'filename': 'coverage/general-lal-tests.html',
      'expand': true,
      'pageTitle': 'Custom Env Test results'
    }]
  ],
};
