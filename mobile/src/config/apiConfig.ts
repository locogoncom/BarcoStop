export type AppEnv = 'dev' | 'staging' | 'prod';

// Quick deployment override:
// Set this to your backend URL to force all mobile API calls to that endpoint.
// Example: 'https://api.tudominio.com/api'
const MANUAL_API_BASE_URL: string | null = null;

const API_BASE_URLS: Record<AppEnv, string> = {
  // Use localhost in dev; scripts configure `adb reverse tcp:5000 tcp:5000`
  // so this works on both emulator and physical USB devices.
  dev: 'http://127.0.0.1:5000/api',
  staging: 'https://staging-api.barcostop.com/api',
  // Public backend used by Android release builds distributed via Play.
  prod: 'https://barcostop-api-2.onrender.com/api',
};

const normalizeEnv = (value: unknown): AppEnv | null => {
  if (typeof value !== 'string') return null;
  const env = value.trim().toLowerCase();
  if (env === 'dev' || env === 'staging' || env === 'prod') return env;
  return null;
};

const normalizeApiUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

const detectEnv = (): AppEnv => {
  const fromProcess =
    typeof process !== 'undefined'
      ? normalizeEnv(process.env?.APP_ENV || process.env?.BARCOSTOP_ENV)
      : null;

  if (fromProcess) return fromProcess;

  // Fallback: en modo desarrollo usa dev; en release usa prod.
  return __DEV__ ? 'dev' : 'prod';
};

export const APP_ENV: AppEnv = detectEnv();
const apiUrlFromEnv =
  typeof process !== 'undefined'
    ? normalizeApiUrl(process.env?.BARCOSTOP_API_URL || process.env?.API_BASE_URL)
    : null;

const apiUrlFromManualConfig = normalizeApiUrl(MANUAL_API_BASE_URL);

export const API_BASE_URL = apiUrlFromManualConfig ?? apiUrlFromEnv ?? API_BASE_URLS[APP_ENV];
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const API_BASE_URLS_BY_ENV = API_BASE_URLS;
