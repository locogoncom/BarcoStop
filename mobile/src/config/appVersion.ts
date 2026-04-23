import {Platform} from 'react-native';

const packageJson = require('../../package.json') as {version?: string};

const parseString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export const APP_VERSION = parseString(packageJson?.version) || '0.0.0';

export const DEFAULT_ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.barcostop.app';
export const DEFAULT_IOS_STORE_URL = '';

export const getPlatformStoreUrl = (androidStoreUrl?: string | null, iosStoreUrl?: string | null): string | null => {
  const platformUrl = parseString(Platform.OS === 'ios' ? iosStoreUrl : androidStoreUrl);
  if (platformUrl) {
    return platformUrl;
  }

  const fallback = parseString(Platform.OS === 'ios' ? DEFAULT_IOS_STORE_URL : DEFAULT_ANDROID_STORE_URL);
  return fallback || null;
};
