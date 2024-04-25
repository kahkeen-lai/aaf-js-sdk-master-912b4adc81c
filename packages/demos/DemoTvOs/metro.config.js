/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');

const packages = path.resolve(__dirname + '/../../');

const extraNodeModules = {
  react: path.join(__dirname, '/node_modules/react/'),
  'react-native': path.join(__dirname, '/node_modules/react-native/'),
  'react-native-video': path.join(
    __dirname,
    '/node_modules/react-native-video/',
  ),
  '@xaaf/xaaf-js-sdk': path.join(packages, 'core/xaaf-js-sdk/'),
  '@babel/runtime': path.join(__dirname, '/node_modules/@babel/runtime/'),
  '@xaaf/aaf-rn-sdk': path.join(packages, 'frameworks/aaf-rn-sdk/'),
  '@xaaf/common': path.join(packages, 'core/common/'),
  '@xaaf/http-axios': path.resolve(packages, 'components/http-axios/'),
  '@xaaf/key-service': path.resolve(packages, 'components/key-service/'),
  '@xaaf/jsrsasign': path.resolve(packages, 'components/jsrsasign/'),
  '@xaaf/ad-script': path.resolve(packages, 'xaaf-script/ad-script/'),
  'react-native-device-info': path.join(
    __dirname,
    '/node_modules/react-native-device-info/',
  ),
};

const watchFolders = Object.values(extraNodeModules);

module.exports = {
  watchFolders,
  projectRoot: path.resolve(__dirname),
  resolver: {
    extraNodeModules
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
