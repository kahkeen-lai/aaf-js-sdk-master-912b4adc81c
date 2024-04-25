/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { Component } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { XaafButton } from './xaaf-button';
import { normalizePixels } from '../screens/utils';
import { ComponentColor } from './component-colors';

interface XaafDropdownProps {
  data: string[];
  selectedItem: string;
  onChange: (selectedItem: string) => void;
  testID: string;
}

interface XaafDropdownState {
  selectedItem: string;
  isDropDownOpened: boolean;
}

const BLACK_COLOR = '#000';

export class XaafDropdown extends Component<XaafDropdownProps, XaafDropdownState> {
  state = {
    selectedItem: '',
    isDropDownOpened: false
  };

  componentDidMount = (): void => {
    this.setState({ selectedItem: this.props.selectedItem });
  };

  renderData = (): JSX.Element => (
    <View style={styles.scrollViewContainer}>
      <ScrollView testID={`e2e_view_${this.props.testID}_selection`} style={styles.scrollView}>
        {this.props.data.map((item: string) => (
          <XaafButton
            testID={`e2e_btn_${this.props.testID}_${item}`}
            title={item}
            key={item}
            width={500}
            height={50}
            align="left"
            marginBottom={0.1}
            borderWidth={-1}
            onPress={() => this.handleItemChange(item)}
            color={BLACK_COLOR}
            bgColor={ComponentColor.BGCOLOR}
          />
        ))}
      </ScrollView>
    </View>
  );

  handleItemChange = (selectedItem: string): void => {
    this.setState({ selectedItem: selectedItem, isDropDownOpened: false });
    this.props.onChange(selectedItem);
  };

  displayItems = (): void => {
    this.setState({ isDropDownOpened: true });
  };

  render(): JSX.Element {
    return (
      <View style={styles.container}>
        {!this.state.isDropDownOpened && (
          <React.Fragment>
            <XaafButton
              testID={`e2e_btn_${this.props.testID}_selected`}
              width={500}
              title={this.state.selectedItem}
              color={BLACK_COLOR}
              bgColor={ComponentColor.BGCOLOR}
              align="left"
              onPress={this.displayItems}
            />
          </React.Fragment>
        )}
        {this.state.isDropDownOpened && this.renderData()}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  scrollViewContainer: {
    backgroundColor: ComponentColor.BGCOLOR,
    borderColor: ComponentColor.FOCUS_TINT,
    borderWidth: normalizePixels(1)
  },
  scrollView: {
    height: normalizePixels(400),
    backgroundColor: ComponentColor.BGCOLOR
  }
});
