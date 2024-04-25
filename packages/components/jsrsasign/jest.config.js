// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  setupFilesAfterEnv: [
    './jest.setup.js',
  ],
  clearMocks: true,
  coverageDirectory: "coverage",
  testEnvironment: "node",
  testMatch: ['<rootDir>/test/*.spec.js'],
  testPathIgnorePatterns: [
    "\\\\node_modules\\\\"
  ]
};
