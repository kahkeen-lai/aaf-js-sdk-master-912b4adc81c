import {Platform} from 'react-native';

export const formatAssetsPath = (path: string) => {
  if (Platform.OS === 'android') {
    return `asset:/drawable/default/${path}`;
  }

  return path;
};
