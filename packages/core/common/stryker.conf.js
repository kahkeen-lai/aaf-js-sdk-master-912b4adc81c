
/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */

module.exports = {
    tempDirName: '../../stryker-tmp',
    mutator: 'typescript',
    transpilers: [],
    packageManager: 'yarn',
    reporters: ['html', 'clear-text', 'progress'],
    testRunner: 'jest',
    htmlReporter: { baseDir: '../../../coverage/reports/xaaf-common' },
    coverageAnalysis: 'off',
    jest: {
        config: require('./jest.config.js')
    },
    tsconfigFile: 'tsconfig.json',
    thresholds: { high: 80, low: 50, break: 40 },
    timeoutMS: 1000000,
    mutate: ['src/**/*.ts', '!src/**/*.spec.ts'],
    logLevel: 'info'
};
