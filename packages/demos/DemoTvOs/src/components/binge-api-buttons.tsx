import {View} from 'react-native';
import {styles} from '../styles/styles';
import {XaafButton} from './xaaf-button';

import React from 'react';
import {formatAssetsPath} from '../utils/formatAssetsPath';

export interface BingeApiButtonsProps {
  onConfigPress: () => void;
}

const BingeApiButtons = ({
  onConfigPress,
}: BingeApiButtonsProps): JSX.Element => (
  <View testID={'e2e_view_api_buttons'} style={styles.controlPanel}>
    <XaafButton
      testID={'e2e_btn_CONFIG'}
      title="CONFIG"
      imageSource={{uri: formatAssetsPath('config.png')}}
      onPress={onConfigPress}
    />
  </View>
);

export default BingeApiButtons;
