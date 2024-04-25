const fs = require('fs');

const ALL_BUNDLES = {
    'xaaf-js-sdk':      'packages/core/xaaf-js-sdk/dist/_analysys.bundle.cjs.js',  
    'xaaf-web-sdk':     'packages/frameworks/xaaf-web-sdk/dist/bundle.cjs.min.js',
    'aaf-rn-sdk':       'packages/frameworks/aaf-rn-sdk/dist/bundle.cjs.min.js'
};

const getBundleSizes = async (bundles) => Object.keys(bundles).reduce(async (acc, bundleKey) => {
    const fileStat = await fs.promises.stat(bundles[bundleKey])
    acc[bundleKey] = Math.round(fileStat.size / 1024);
    return acc;
}, {});

const checkFileExists = (file) => fs.promises.access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

const getMonitorObject = async (monitorPath) => {
    const pathExists = await checkFileExists(monitorPath);
    if (!pathExists) {
        throw new Error('Monitor path does not exist');
    }

    const _monitorObjectStr = await fs.promises.readFile(monitorPath, { encoding: 'utf-8' });
    return JSON.parse(_monitorObjectStr);
}

(async () => {
    const _argv = process.argv.slice(2);
    const _action = _argv[0];
    const _monitorPath = _argv[1];

    const bundleSizes = await getBundleSizes(ALL_BUNDLES);

    try {
        switch (_action) {
            case 'w':
                await fs.promises.writeFile(_monitorPath, JSON.stringify(bundleSizes), { encoding: 'utf-8' });
                break;
            case 'r':
                const monitorObject = await getMonitorObject(_monitorPath);
                const rows = Object.keys(bundleSizes)
                    .filter(key => monitorObject[key] === bundleSizes[key])
                    .map((key) => {
                        const prev = monitorObject[key];
                        const curr = bundleSizes[key];
                        const percentage = (Math.round(curr / prev * 100 * 100) / 100) - 100;
                        return `| ${key} | ${prev}kb | ${curr}kb | ${percentage}% |`;
                    });

                if (rows.length > 0) {
                    // output to TTY, which is then parsed by Jenkins
                    console.log([
                        '| Bundle | Master | Branch  | Change |',
                        '| ------ | ------ | ------- | ------ |',
                        ...rows
                    ].join('\\n'));
                } else {
                    console.log();
                }
        }
    } catch (e) {
        // output to TTY, which is then parsed by Jenkins
        console.log();
    }
})();
