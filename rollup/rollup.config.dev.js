import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import replace from '@rollup/plugin-replace';
const pkg = require(`${process.cwd()}/package.json`);
import path from 'path';
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

function selectOutputs() {
    const outputArr = [];
    if (pkg.main) {
        outputArr.push('cjs');
    }
    if (pkg.browser) {
        outputArr.push('amd');
    }
    if (pkg.module) {
        outputArr.push('module');
    }
    return outputArr;
}


export const outputs = selectOutputs();

const externals = [
    'tslib',
    'rox-browser',
    'rox-react-native',
    'react',
    'react-native',
    'axios',
    '@xaaf/http-axios',
]

export default {
    cache: false,
    preserveSymlinks: true,
    input: 'src/index.ts',
    output:
        outputs.map((format) => {
            return {
                file: `dist/bundle.${format}.js`,
                format,
                strict: false

            };
        }),
    plugins: [
        builtins({ crypto: false, http: true, stream: false }),
        commonjs({ include: /node_modules/ }),
        resolve({
            rootDir: path.join(process.cwd()),
            moduleDirectory: `${process.cwd()}/node_modules/**`,
            preferBuiltins: false,
            mainFields: ['broswer', 'main'],
            extensions
        }),
        json(),
        typescript({
            tsconfig: 'tsconfig.json'
        }),
        replace({ __HOST_PACKAGE_VERSION__: pkg.version })

    ],
    external: [
        ...externals,
        ...Object.keys(pkg.peerDependencies || {})
    ]
};
