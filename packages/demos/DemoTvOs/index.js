/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';

import App from './src/screens/home';
AppRegistry.registerComponent(appName, () => App);

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs(true);//Ignore all log notifications
//console.disableYellowBox = true; 