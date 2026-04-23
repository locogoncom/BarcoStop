/**
 * @format
 */

const queueMicrotaskPolyfill = callback => Promise.resolve().then(callback);

if (typeof globalThis.queueMicrotask === 'undefined') {
	globalThis.queueMicrotask = queueMicrotaskPolyfill;
}

if (typeof global.queueMicrotask === 'undefined') {
	global.queueMicrotask = queueMicrotaskPolyfill;
}

const {TextEncoder, TextDecoder} = require('text-encoding');
if (typeof global.TextEncoder === 'undefined') {
	global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
	global.TextDecoder = TextDecoder;
}

require('react-native-gesture-handler');
const {AppRegistry} = require('react-native');
const App = require('./App').default;
const {name: appName} = require('./app.json');

AppRegistry.registerComponent(appName, () => App);
