import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-webview', () => ({
	WebView: (props) => {
		const React = require('react');
		const {View} = require('react-native');
		return React.createElement(View, props);
	},
}));

jest.mock('react-native-qrcode-svg', () => {
	return (props) => {
		const React = require('react');
		const {View} = require('react-native');
		return React.createElement(View, props);
	};
});
