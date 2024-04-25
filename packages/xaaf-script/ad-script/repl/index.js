const { InjectionContainer, ContainerDef } = require('@xaaf/common');
const { AllFunctions } = require('../dist/bundle.cjs');
const repl = require('repl');

const adScriptContext = new Map()
InjectionContainer.registerInstance(ContainerDef.executableAdStorageService, adScriptContext);
InjectionContainer.registerInstance(ContainerDef.loggerService, {
    verbose: console.debug,
    debug: console.debug,
    info: console.info,
    warning: console.warn,
    error: console.error,
});

const replServer = repl.start({
    prompt: '> ',
    eval: async (cmd, context, filename, callback) => {
        const parsedArgs = JSON.parse(cmd.trim()) ?? {};
        for (const [funcName, args] of Object.entries(parsedArgs)) {
            const func = AllFunctions[funcName];
            const result = await func(args, adScriptContext);
            callback(null, result ?? "void");
        }
    }
});

replServer.context.$get = AllFunctions.$get

replServer.on('exit', () => {
    console.log('Thank you for using AdScript REPL');
    console.table(adScriptContext);
    process.exit();
});


