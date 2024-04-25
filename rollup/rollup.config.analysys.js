import { default as base } from './rollup.config.prod';
import typescript from 'rollup-plugin-typescript2';
base.output = base.output.map((item) => {
    item.file = `dist/_analysys.bundle.${item.format}.js`
    return item;
});

base.plugins[4] = typescript({
    tsconfig: 'tsconfig.es6.json'
});

base.watch = {
    skipWrite: true
}
export default base;