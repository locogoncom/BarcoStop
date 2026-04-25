import {NativeModules, Platform} from 'react-native';

const packageJson = require('../../package.json') as {version?: string};
type AppBuildInfoNative = {
  versionName?: string;
  versionCode?: number | string;
  buildTimestamp?: string;
};
const nativeBuildInfo = (NativeModules?.AppBuildInfo ?? {}) as AppBuildInfoNative;

const parseString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const parseBuildNumber = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
};

const formatBuildDate = (value: unknown): string => {
  const raw = parseString(value);
  const compact = raw.replace(/[^0-9]/g, '');
  if (compact.length >= 8) {
    const yyyy = compact.slice(0, 4);
    const mm = compact.slice(4, 6);
    const dd = compact.slice(6, 8);
    if (compact.length >= 14) {
      const hh = compact.slice(8, 10);
      const min = compact.slice(10, 12);
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
    return `${yyyy}-${mm}-${dd}`;
  }
  return raw || 'n/a';
};

export const APP_VERSION = parseString(nativeBuildInfo.versionName) || parseString(packageJson?.version) || '0.0.0';
export const APP_BUILD_NUMBER =
  parseBuildNumber(nativeBuildInfo.versionCode) ||
  parseBuildNumber(typeof process !== 'undefined' ? process.env?.BARCOSTOP_VERSION_CODE : '') ||
  '0';
export const APP_BUILD_DATE = formatBuildDate(
  nativeBuildInfo.buildTimestamp ||
    (typeof process !== 'undefined'
      ? process.env?.BARCOSTOP_BUILD_TIMESTAMP || process.env?.BARCOSTOP_BUILD_DATE
      : ''),
);
export const APP_BUILD_LABEL = `v${APP_VERSION} - b${APP_BUILD_NUMBER} - ${APP_BUILD_DATE}`;

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
