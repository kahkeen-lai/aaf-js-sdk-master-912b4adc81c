// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
const { defaults } = require('ts-jest/presets');

module.exports = {
  ...defaults,
  
  modulePaths: [
    '<rootDir>'
  ],
  cacheDirectory: '.jest/cache',
  clearMocks: true,
  coverageDirectory: 'coverage',
  clearMocks: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/index.ts',
    '!<rootDir>/src/plugins/*',
    '!<rootDir>/src/**/mock*',
    '!<rootDir>/src/mock/*',
  ],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
  testResultsProcessor:  'jest-sonar-reporter',
  reporters: [
    'default',
    'jest-junit',
    ['jest-html-reporters', {
      'hideIcon': true,
      "publicPath": "coverage",
      'filename': 'tests.html',
      'expand': true,
      'pageTitle': 'Test results'
    }]
  ],
  globals: {
    // rox-browser thinks we're in a browser, so we need this globals for jest tests
    'ts-jest': {
      babelConfig: true,
      diagnostics: false
    },
    'navigator': { 'userAgent': 'node.js' },
    'window': { 'JSEncrypt': '?' }
  },

  // The test environment that will be used for testing
  testEnvironment: "node",

  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/'],
  transform: {
    ...defaults.transform
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|react-navigation|@youi)',
    '__mock__'
  ],
};
