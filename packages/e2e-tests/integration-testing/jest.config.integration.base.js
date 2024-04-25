const baseConfig = require('../../../jest.config.base');
const rootDir = __dirname;
module.exports = {
  ...baseConfig,
  testRunner: 'jest-circus/runner',
};
