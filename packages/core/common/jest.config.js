const baseConfig = require('../../../jest.config.base');

const rootDir = __dirname;
// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  ...baseConfig,
  // setupFiles: [`${rootDir}/jest.setup.js`],
  globals: {
    'ts-jest': {
      babelConfig: true,
      diagnostics: false
    }
  },
  moduleDirectories: [
    'node_modules',
    'src'
  ],
  modulePaths: [
    '<rootDir>'
  ],
  roots: [
    'src'
  ],
  verbose: true
};
