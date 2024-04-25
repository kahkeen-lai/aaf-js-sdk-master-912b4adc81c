import { Dimensions, StyleSheet } from 'react-native';
import { normalizePixels } from '../screens/utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TITLE_HEIGHT = normalizePixels(98);
const CONTENT_HEIGHT = SCREEN_HEIGHT - TITLE_HEIGHT;
export const HINT_FONT_SIZE = 20;

const PANEL_BACKGROUND_COLOR = 'white';
const BACKGROUND_COLOR = '#f8f8f8';
export const LOG_LABEL_COLOR = '#73a16c';
export const LOG_TEXT_COLOR = '#667da1';
export const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject
  },
  contentContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH,
    height: '100%',
    backgroundColor: BACKGROUND_COLOR
  },
  controlPanel: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: normalizePixels(20),
    marginBottom: normalizePixels(20),
    height: '100%',
    width: '18.5%',
    backgroundColor: BACKGROUND_COLOR
  },
  configControlPanel: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: normalizePixels(20),
    marginBottom: normalizePixels(20),
    height: '100%',
    width: '18.5%',
    backgroundColor: BACKGROUND_COLOR
  },
  logsPanel: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: normalizePixels(10),
    marginBottom: normalizePixels(20),
    height: '100%',
    width: '18.5%',
    backgroundColor: BACKGROUND_COLOR
  },
  logsPanelContent: {
    backgroundColor: PANEL_BACKGROUND_COLOR,
    paddingTop: normalizePixels(10)
  },
  panelTitle: {
    justifyContent: 'flex-start',
    backgroundColor: BACKGROUND_COLOR,
    padding: normalizePixels(10)
  },
  e2e: {
    color: 'white',
    textAlign: 'center',
    fontSize: 2
  },
  configRightPanel: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    backgroundColor: PANEL_BACKGROUND_COLOR,
    width: '85%',
    height: '100%'
  },
  configContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    backgroundColor: PANEL_BACKGROUND_COLOR,
    padding: normalizePixels(20)
  },
  configItem: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingLeft: normalizePixels(20),
    marginVertical: normalizePixels(10),
    backgroundColor: PANEL_BACKGROUND_COLOR
  },
  configItemLabel: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: normalizePixels(300),
    marginBottom: normalizePixels(10)
  },
  configItemValue: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: normalizePixels(500)
  },
  configButton: {
    marginTop: normalizePixels(60),
    marginStart: normalizePixels(220)
  },
  configTitle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: normalizePixels(50),
    marginBottom: normalizePixels(80),
    backgroundColor: PANEL_BACKGROUND_COLOR,
    marginStart: normalizePixels(20)
  },
  main: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    backgroundColor: PANEL_BACKGROUND_COLOR,
    height: SCREEN_WIDTH * 0.426,
    width: SCREEN_WIDTH * 0.6
  },
  viewHost: {
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    height: '80%',
    backgroundColor: BACKGROUND_COLOR
  },
  videoView: {
    height: '100%',
    width: '100%'
  },
  xaafAdView: {
    height: '100%',
    width: '100%'
  },
  video: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    opacity: 1,
    top: 0,
    left: 0
  },
  xaafAd: {
    height: '100%',
    width: '100%',
    opacity: 1
  },
  removeElement: {
    opacity: 0,
    height: '0.1%'
  },
  addElement: {
    opacity: 1
  },
  panelSeparator: {
    backgroundColor: '#f2f2f2',
    width: '1.5%',
    height: '100%'
  },
  title: {
    width: '100%',
    height: TITLE_HEIGHT
  },
  horizontalPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: normalizePixels(20),
    backgroundColor: BACKGROUND_COLOR
  },
  adVisible: {
    opacity: 1,
    width: '100%',
    height: '100%'
  },
  adHidden: {
    opacity: 0,
    width: '1.5%',
    height: '1.5%'
  }
});
