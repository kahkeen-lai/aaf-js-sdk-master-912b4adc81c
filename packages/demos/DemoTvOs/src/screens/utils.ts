import { Dimensions } from 'react-native';

const { scale } = Dimensions.get('window');

export function normalizePixels(size: number): number {
  return size / scale;
}
