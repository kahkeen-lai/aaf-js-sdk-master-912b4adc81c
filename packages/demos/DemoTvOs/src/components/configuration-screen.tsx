/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext } from 'react';
import { View } from 'react-native';
import { XaafText } from './xaaf-text';
import { XaafDropdown } from './xaaf-dropdown';
import { XaafInput } from './xaaf-input';
import { ApiKeyConfig } from '../config/api-key-config';
import { XaafButton } from './xaaf-button';
import { styles } from '../styles/styles';
import { adStartDelayHint, projectId } from '../screens/xaaf-ad-video-params';
import { Experiences } from '../config/experiences-config';
import PanelSeparator from './panel-separator';
import { ApiKey } from '../screens/types';
import { XaafContext, XaafContextType } from '../screens/xaaf-context';

interface ConfigurationScreenProps {
  onApiKeyChange: (value: string) => void;
  customAdStartDelayHint: number;
  adStartDelayHintChanged: (value: string) => void;
  adStartDelayHintEndEditing: () => void;
  customProjectId: number;
  projectIdChanged: (value: string) => void;
  projectIdEndEditing: () => void;
  selectedExperience: string;
  onExperienceChange: (value: string) => void;
  onSavePress: () => void;
}

const ConfigurationScreen = ({
  onApiKeyChange,
  customAdStartDelayHint,
  adStartDelayHintChanged,
  adStartDelayHintEndEditing,
  customProjectId,
  projectIdChanged,
  projectIdEndEditing,
  selectedExperience,
  onExperienceChange,
  onSavePress
}: ConfigurationScreenProps): JSX.Element => {
  const allApiKeys: ApiKey[] = ApiKeyConfig.getAllApiKeys();
  const experienceTitles: string[] = Experiences.getTitles();
  const { selectedApiKey } = useContext<XaafContextType>(XaafContext);
  return (
    <React.Fragment>
      <View style={styles.configControlPanel} />
      <PanelSeparator />
      <View testID={'e2e_view_config_panel'} style={styles.configRightPanel}>
        <View style={styles.panelTitle}>
          <XaafText value={'Configurations'} />
        </View>
        <View style={styles.configContainer}>
          <View style={styles.configItem}>
            <View style={styles.configItemLabel}>
              <XaafText value={'Environment'} />
            </View>
            <View style={styles.configItemValue}>
              <XaafDropdown
                testID="config_environment"
                data={allApiKeys}
                selectedItem={selectedApiKey}
                onChange={onApiKeyChange}
              />
            </View>
          </View>
          <View style={styles.configItem}>
            <View style={styles.configItemLabel}>
              <XaafText value={'AdStartDelayHint'} />
            </View>
            <View style={styles.configItemValue}>
              <XaafInput
                defaultValue={adStartDelayHint.toString()}
                value={customAdStartDelayHint.toString()}
                onChangeText={adStartDelayHintChanged}
                onEndEditing={adStartDelayHintEndEditing}
              />
            </View>
          </View>
          <View style={styles.configItem}>
            <View style={styles.configItemLabel}>
              <XaafText value={'ProjectId'} />
            </View>
            <View style={styles.configItemValue}>
              <XaafInput
                defaultValue={projectId.toString()}
                value={customProjectId.toString()}
                onChangeText={projectIdChanged}
                onEndEditing={projectIdEndEditing}
              />
            </View>
          </View>
          {ApiKeyConfig.isMockApiKey(selectedApiKey) && (
            <View style={styles.configItem}>
              <View style={styles.configItemLabel}>
                <XaafText value={'Experience'} />
              </View>
              <View style={styles.configItemValue}>
                <XaafDropdown
                  testID="config_experience"
                  data={experienceTitles}
                  selectedItem={selectedExperience}
                  onChange={onExperienceChange}
                />
              </View>
            </View>
          )}
          <View style={styles.configButton}>
            <XaafButton testID={'e2e_btn_SAVE'} title="Save" onPress={onSavePress} />
          </View>
        </View>
      </View>
    </React.Fragment>
  );
};

export default ConfigurationScreen;
