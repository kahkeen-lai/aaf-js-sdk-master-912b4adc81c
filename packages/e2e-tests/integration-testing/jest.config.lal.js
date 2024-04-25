const baseConfig = require('./jest.config.integration.base');
const rootDir = __dirname;
module.exports = {
  ...baseConfig,
  setupFiles: [`${rootDir}/jest.setup.js`],
  testMatch: ['<rootDir>/src/lal/*.spec.ts'],
  reporters: [
    'jest-progress-bar-reporter',
    ['jest-html-reporters', {
      'hideIcon': true,
      'filename': 'coverage/lal-tests.html',
      'expand': true,
      'pageTitle': 'Lal Test results'
    }]
  ],
};
