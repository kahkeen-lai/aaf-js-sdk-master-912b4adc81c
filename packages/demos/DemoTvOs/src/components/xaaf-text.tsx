/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unicorn/filename-case */
import React, { Component } from 'react';
import { Text, StyleSheet } from 'react-native';
import { normalizePixels } from '../screens/utils';

interface XaafTextProps {
  value: string;
  fontSize?: number;
  testID?: string;
  marginBottom?: number;
  color?: string;
}

interface XaafTextState {}

const TEXT_COLOR = 'dimgray';
const DEFAULT_MARGIN = 0;

export class XaafText extends Component<XaafTextProps, XaafTextState> {
  render(): JSX.Element {
    return (
      <Text
        style={{
          ...(styles.text as any),
          color: this.props.color ?? TEXT_COLOR,
          fontSize: this.props.fontSize ? normalizePixels(this.props.fontSize) : normalizePixels(30),
          marginBottom: this.props.marginBottom
            ? normalizePixels(this.props.marginBottom)
            : normalizePixels(DEFAULT_MARGIN)
        }}
        testID={this.props.testID}
      >
        {this.props.value}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'left',
    marginLeft: normalizePixels(20)
  }
});
