/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unicorn/filename-case */
import React, {Component} from 'react';
import {
  Text,
  Image,
  View,
  StyleSheet,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import {normalizePixels} from '../screens/utils';
import {ComponentColor} from './component-colors';

interface XaafButtonProps {
  title: string;
  onPress: () => void;
  width?: number;
  height?: number;
  bgColor?: string;
  color?: string;
  align?: 'left' | 'center';
  marginBottom?: number;
  borderWidth?: number;
  imageSource?: ImageSourcePropType;
  testID?: string;
}

interface XaafButtonState {
  textColor: string;
  tintColor: string;
}

const BUTTON_BGCOLOR = '#ffffff';
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 70;
const DEFAULT_MARGIN_BOTTOM = 20;
const DEFAULT_BORDER_WIDTH = 1;

export class XaafButton extends Component<XaafButtonProps, XaafButtonState> {
  state = {
    textColor: this.props.color ?? ComponentColor.TEXT,
    tintColor: ComponentColor.BORDER,
  };

  onPress = (): void => {
    this.props.onPress();
  };

  onFocus = (): void => {
    this.setState({
      textColor: ComponentColor.FOCUS_TINT,
      tintColor: ComponentColor.FOCUS_TINT,
    });
  };

  onPressIn = (): void => {
    this.setState({tintColor: ComponentColor.FOCUS_TINT});
  };

  onPressOut = (): void => {
    this.setState({
      textColor: this.textColor(),
      tintColor: ComponentColor.BORDER,
    });
  };

  onBlur = (): void => {
    this.setState({
      textColor: this.textColor(),
      tintColor: ComponentColor.BORDER,
    });
  };

  textColor = (): string => this.props.color ?? ComponentColor.TEXT;

  getAlignStyle = (): unknown => {
    if (this.props.align) {
      return this.props.align === 'left'
        ? styles.leftAlign
        : styles.centeredAlign;
    } else if (this.props.imageSource) {
      return styles.leftAlign;
    } else {
      return styles.centeredAlign;
    }
  };

  render(): JSX.Element {
    return (
      <TouchableOpacity
        onFocus={this.onFocus}
        testID={this.props.testID}
        onPress={this.onPress}
        onPressIn={this.onPressIn}
        onPressOut={this.onPressOut}
        onBlur={this.onBlur}
      >
        <View
          style={{
            ...(this.getAlignStyle() as any),
            backgroundColor: this.props.bgColor ?? BUTTON_BGCOLOR,
            width: normalizePixels(this.props.width ?? DEFAULT_WIDTH),
            height: normalizePixels(this.props.height ?? DEFAULT_HEIGHT),
            marginBottom: normalizePixels(
              this.props.marginBottom ?? DEFAULT_MARGIN_BOTTOM,
            ),
            borderWidth: normalizePixels(
              this.props.borderWidth ?? DEFAULT_BORDER_WIDTH,
            ),
            borderColor: this.state.tintColor,
            borderRadius: normalizePixels(4),
          }}
        >
          {this.props.imageSource ? (
            <Image
              source={this.props.imageSource}
              style={{
                marginLeft: normalizePixels(10),
                width: normalizePixels(48),
                height: normalizePixels(49),
                tintColor: this.state.textColor,
              }}
            />
          ) : null}
          <Text style={{...(styles.text as any), color: this.state.textColor}}>
            {this.props.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  leftAlign: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: normalizePixels(20),
  },
  centeredAlign: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: normalizePixels(22),
    marginHorizontal: normalizePixels(20),
  },
});
