const baseConfig = require('../../../jest.config.base');
module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    'warnOnce': '<rootDir>/__mocks__/empty.js',
    'AppState': '<rootDir>/__mocks__/empty.js',
    '^axios$': require.resolve('axios'),
  }
};
