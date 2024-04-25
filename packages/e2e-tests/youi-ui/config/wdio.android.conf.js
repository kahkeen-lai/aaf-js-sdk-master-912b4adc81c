// wdio.dev.config.js
const merge = require('deepmerge');
const wdioConf = require('./wdio.conf.js');
const androidCapabilities = require('./wdio.android.capabilities');

// have main config file as default but overwrite environment specific information
exports.config = merge(
  wdioConf.config,
  {
    capabilities: androidCapabilities.config,
  },
  { clone: false },
);
