/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { Component } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { normalizePixels } from '../screens/utils';
import { ComponentColor } from './component-colors';

interface XaafInputProps {
  defaultValue: string;
  value: string;
  onChangeText: (text: string) => void;
  onEndEditing: () => void;
}

interface XaafInputState {
  bgColor: string;
  textColor: string;
  tintColor: string;
}

const TEXT_COLOR = 'black';

export class XaafInput extends Component<XaafInputProps, XaafInputState> {
  state = {
    bgColor: ComponentColor.BGCOLOR,
    textColor: TEXT_COLOR,
    tintColor: ComponentColor.BORDER
  };

  onFocus = (): void => {
    this.setState({ tintColor: ComponentColor.FOCUS_TINT, textColor: ComponentColor.FOCUS_TINT });
  };

  onBlur = (): void => {
    this.setState({ tintColor: ComponentColor.BORDER, textColor: TEXT_COLOR });
  };

  onEndEditing = (): void => {
    this.setState({ tintColor: ComponentColor.BORDER, textColor: TEXT_COLOR });
    this.props.onEndEditing();
  };

  render(): JSX.Element {
    return (
      <View style={{ ...(styles.inputContainer as any), borderColor: this.state.tintColor }}>
        <TextInput
          defaultValue={this.props.defaultValue}
          value={this.props.value}
          style={{ ...(styles.input as any), backgroundColor: this.state.bgColor, color: this.state.textColor }}
          onChangeText={this.props.onChangeText}
          onEndEditing={this.onEndEditing}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  input: {
    height: normalizePixels(70),
    width: normalizePixels(500),
    fontSize: normalizePixels(22)
  },
  inputContainer: {
    borderWidth: normalizePixels(1),
    borderRadius: normalizePixels(4)
  }
});
