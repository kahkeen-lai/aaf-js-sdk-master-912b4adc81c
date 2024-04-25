import { NativeModules } from 'react-native';

global.fetch = require('jest-fetch-mock');

NativeModules.OrientationLock = {
  setRotationMode: jest.fn()
};

NativeModules.RefUtils = {
  setParentCompositionPointerEvents: jest.fn(),
  setPointerEvents: jest.fn()
};
