import { terser } from "rollup-plugin-terser";
import { uglify } from "rollup-plugin-uglify";

const { main } = require('./package.json');

export default {
    input: 'release/jsrsasign.js',
    output: {
        file: main,
        plugins: [ terser(), uglify() ],
        format: 'cjs',
    }
};

