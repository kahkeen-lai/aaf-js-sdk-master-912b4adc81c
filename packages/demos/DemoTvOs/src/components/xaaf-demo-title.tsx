/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unicorn/filename-case */
import React, {Component} from 'react';
import {Image, View, StyleSheet} from 'react-native';
import {normalizePixels} from '../screens/utils';
import {formatAssetsPath} from '../utils/formatAssetsPath';

const BACKGROUND_COLOR = '#262626';
export class XaafDemoTitle extends Component {
  render(): JSX.Element {
    return (
      <View testID={'e2e_view_title'} style={styles.container}>
        <View style={styles.logo}>
          <Image
            source={{uri: formatAssetsPath('logo.png')}}
            style={{width: normalizePixels(529), height: normalizePixels(48)}}
          />
        </View>
        <Image
          source={{uri: formatAssetsPath('header-bg.png')}}
          style={{width: normalizePixels(1356), height: normalizePixels(98)}}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: BACKGROUND_COLOR,
    flex: 1,
    height: normalizePixels(98),
  },
  logo: {
    flex: 0,
    paddingLeft: normalizePixels(48),
    paddingTop: normalizePixels(23),
    backgroundColor: '#0000', //clear color
  },
});
