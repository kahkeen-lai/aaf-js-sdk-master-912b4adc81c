import { terser } from 'rollup-plugin-terser';
import { default as base, outputs } from './rollup.config.web.dev';
import visualizer from 'rollup-plugin-visualizer';
import analyze from 'rollup-plugin-analyzer';
import obfuscatorPlugin from 'rollup-plugin-javascript-obfuscator';
import strip from '@rollup/plugin-strip';
const pkg = require(`${process.cwd()}/package.json`);



const LIMIT_IN_BYTES = 1024 * 1024 * 2;

const onAnalysis = ({ bundleSize }) => {
    if (bundleSize < LIMIT_IN_BYTES) return
    console.log(`Bundle size exceeds ${LIMIT_IN_BYTES} bytes: ${bundleSize} bytes`)
    return process.exit(1)
}

base.plugins = [
    ...base.plugins,
    terser({
        compress: true,
        mangle: true,
        output: {
            comments: 'false',
        }
    }),
    obfuscatorPlugin({
        compact: true,
        controlFlowFlattening: true,
        numbersToExpressions: true,
        simplify: true,
        shuffleStringArray: true,
        splitStrings: true,
        sourceMap: true,
    }),
    analyze({ onAnalysis, stdout: false, summaryOnly: true, skipFormatted: false }),
    visualizer({
        filename: './dist/bundle.treemap.stats.html',
        sourcemap: false,
        gzipSize: true,
        template: 'treemap'
    }),
    visualizer({
        filename: './dist/bundle.sunburst.stats.html',
        sourcemap: false,
        gzipSize: true,
        template: 'sunburst'
    })];

//the following array should contain the names of the SDKs we want to logs to be removed from the bundle.
//for example: "@xaaf/xaaf-hadron-sdk",  "@xaaf/aaf-rn-sdk", ...
const sdkNamesWhereLogsNeedToBeRemoved = [];
const needToRemoveLogs = (sdkNamesWhereLogsNeedToBeRemoved.indexOf(pkg.name) > -1);

if (needToRemoveLogs) {
    //the following lines and json file can be configured to change the logs that are needed to be removed from the SDK
    const functionNames = require('./function_names_for_rollup_strip');

    const infoLogPrefixes = functionNames.info_log_prefixes;
    const debugLogPrefixes = functionNames.debug_log_prefixes;
    const verboseLogPrefixes = functionNames.verbose_log_prefixes;

    const logPrefixes = [...infoLogPrefixes, ...debugLogPrefixes, ...verboseLogPrefixes];

    // remove according to logPrefixes array
    base.plugins.push(strip({
        include: ['**/*.ts', '**/*.js'],
        functions: logPrefixes
    }));
}

base.output = outputs.map((format) => {
    return {
        sourcemap: true,
        file: `dist/bundle.${format}.min.js`,
        format
    };
});
export default base;