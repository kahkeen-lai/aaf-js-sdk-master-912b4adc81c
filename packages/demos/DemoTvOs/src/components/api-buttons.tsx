/* eslint-disable @typescript-eslint/no-unused-vars */
import {View} from 'react-native';
import {HINT_FONT_SIZE, styles} from '../styles/styles';
import {XaafButton} from './xaaf-button';
import {XaafText} from './xaaf-text';
import React from 'react';
import {formatAssetsPath} from '../utils/formatAssetsPath';

export interface ApiButtonsProps {
  executableAdAction: string | undefined;
  onConfigPress: () => void;
  onCreatePress: () => void;
  onInitPress: () => void;
  onStartPress: () => void;
  onStopPress: () => void;
  onStopPressWithAction: () => void;
}

const ApiButtons = ({
  executableAdAction,
  onConfigPress,
  onCreatePress,
  onInitPress,
  onStartPress,
  onStopPress,
  onStopPressWithAction,
}: ApiButtonsProps): JSX.Element => (
  <View testID={'e2e_view_api_buttons'} style={styles.controlPanel}>
    <XaafButton
      testID={'e2e_btn_CONFIG'}
      title="CONFIG"
      imageSource={{uri: formatAssetsPath('config.png')}}
      onPress={onConfigPress}
    />
    <XaafButton
      testID={'e2e_btn_CREATE'}
      title="CREATE AD"
      imageSource={{uri: formatAssetsPath('create-ad.png')}}
      onPress={onCreatePress}
      marginBottom={10}
    />
    <XaafText
      value={'Request to create an ad in preparation for opportunity trigger'}
      marginBottom={20}
      fontSize={HINT_FONT_SIZE}
    />
    <XaafButton
      testID={'e2e_btn_INIT'}
      title="AD INIT"
      imageSource={{uri: formatAssetsPath('init-ad.png')}}
      onPress={onInitPress}
      marginBottom={10}
    />
    <XaafText
      value={
        'Request to initialize an ad in preparation for opportunity trigger'
      }
      marginBottom={20}
      fontSize={HINT_FONT_SIZE}
    />
    <XaafButton
      testID={'e2e_btn_START'}
      title="AD START"
      imageSource={{uri: formatAssetsPath('start-ad.png')}}
      onPress={onStartPress}
      marginBottom={10}
    />
    <XaafText
      value={'Upon opportunity trigger'}
      marginBottom={20}
      fontSize={HINT_FONT_SIZE}
    />
    <XaafButton
      testID={'e2e_btn_STOP'}
      title="AD STOP"
      imageSource={{uri: formatAssetsPath('stop-ad.png')}}
      onPress={onStopPress}
      marginBottom={10}
    />
    {!!executableAdAction && (
      <XaafButton
        testID={'e2e_btn_STOP'}
        title="AD STOP WITH ACTION"
        onPress={onStopPressWithAction}
        marginBottom={10}
      />
    )}
    <XaafText
      value={'Upon need to forego the ad opportunity or dismiss the ad'}
      marginBottom={20}
      fontSize={HINT_FONT_SIZE}
    />
  </View>
);

export default ApiButtons;
