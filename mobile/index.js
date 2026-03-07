/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import {TextEncoder, TextDecoder} from 'text-encoding';
import App from './App';
import {name as appName} from './app.json';

if (typeof global.TextEncoder === 'undefined') {
	global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
	global.TextDecoder = TextDecoder;
}

AppRegistry.registerComponent(appName, () => App);
