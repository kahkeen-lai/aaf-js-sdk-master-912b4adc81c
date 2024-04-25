/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');

const extraNodeModules = {
  '@xaaf/xaaf-js-sdk': path.resolve(__dirname + '/../xaaf-js-sdk/')
};
const watchFolders = [
  path.resolve(__dirname + '/../xaaf-js-sdk/')
];

module.exports = {
  resolver: {
    extraNodeModules
  },
  watchFolders,
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false
      }
    })
  },
};
