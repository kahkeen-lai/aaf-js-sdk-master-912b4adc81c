/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScrollView, View } from 'react-native';
import { LOG_LABEL_COLOR, LOG_TEXT_COLOR, styles } from '../styles/styles';
import { XaafText } from './xaaf-text';
import React, { useContext } from 'react';
import { XaafContext, XaafContextType } from '../screens/xaaf-context';
import XaafMap from './xaaf-map';

export interface LogsPanelProps {
  event: string;
  loginEventType: string;
  executableAdAttributeEvent: string;
  adLifeCycleProjectId: string;
  adLifeCycleProjectBuildNumber: string;
  hostRequestStatus: string;
  hostRequestType: string;
  requestParameters: Map<string, string>;
}

const LogsPanel = ({
  event,
  loginEventType,
  executableAdAttributeEvent,
  adLifeCycleProjectId,
  adLifeCycleProjectBuildNumber,
  hostRequestStatus,
  hostRequestType,
  requestParameters
}: LogsPanelProps): JSX.Element => {
  const { selectedApiKey, loginRequestId, adRequestId, platformAdvId } = useContext<XaafContextType>(XaafContext);
  return (
    <View style={styles.logsPanel}>
      <XaafText value={'Log'} marginBottom={10} />
      <ScrollView style={styles.logsPanelContent}>
        <XaafText value="Environment:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_environment'} value={selectedApiKey} color={LOG_TEXT_COLOR} />
        <XaafText value="Initialize Status:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_login_event_type'} value={loginEventType} color={LOG_TEXT_COLOR} />
        <XaafText value="Event:" color={LOG_LABEL_COLOR} />
        <XaafText value={event} color={LOG_TEXT_COLOR} />
        <XaafText value="State:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_STATE'} value={executableAdAttributeEvent} color={LOG_TEXT_COLOR} />
        <XaafText value="Project ID:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_project'} value={adLifeCycleProjectId} color={LOG_TEXT_COLOR} />
        <XaafText value="Project Build Number:" color={LOG_LABEL_COLOR} />
        <XaafText value={adLifeCycleProjectBuildNumber} color={LOG_TEXT_COLOR} />
        <XaafText value="Login request id:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_login_request_id'} value={loginRequestId ?? 'N/A'} color={LOG_TEXT_COLOR} />
        <XaafText value="Host Request Status:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_host_request_status'} value={hostRequestStatus} color={LOG_TEXT_COLOR} />
        <XaafText value="Host Request Type:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_host_request_type'} value={hostRequestType} color={LOG_TEXT_COLOR} />
        <XaafText value="Ad request id:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_ad_request_id'} value={adRequestId ?? 'N/A'} color={LOG_TEXT_COLOR} />
        <XaafText value="PlatformAdvId:" color={LOG_LABEL_COLOR} />
        <XaafText testID={'e2e_text_platformAdvId'} value={platformAdvId ?? 'N/A'} color={LOG_TEXT_COLOR} />
        <XaafText value="Request Parameters:" color={LOG_LABEL_COLOR} />
        <XaafMap items={requestParameters} />
      </ScrollView>
    </View>
  );
};

export default LogsPanel;
