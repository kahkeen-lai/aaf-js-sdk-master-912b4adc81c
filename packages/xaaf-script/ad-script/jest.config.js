const baseConfig = require('../../../jest.config.base');
const rootDir = __dirname;
module.exports = {
  ...baseConfig,
  moduleDirectories: [
    'node_modules',
    'src'
  ],
};
