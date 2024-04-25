// wdio.dev.config.js
const merge = require('deepmerge');
const wdioConf = require('./wdio.conf.js');
const iosCapabilities = require('./wdio.ios.capabilities');

// have main config file as default but overwrite environment specific information
exports.config = merge(
  wdioConf.config,
  {
    capabilities: iosCapabilities.config,
  },
  { clone: false },
);
