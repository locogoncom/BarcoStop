export type AppEnv = 'dev' | 'staging' | 'prod';

const DEFAULT_API_BASE_URL = 'https://api.barcostop.net/v1';

// Quick deployment override:
// Set this to your backend URL to force all mobile API calls to that endpoint.
// Example: 'https://api.tudominio.com/v1'
const MANUAL_API_BASE_URL: string | null = null;

const API_BASE_URLS: Record<AppEnv, string> = {
  dev: DEFAULT_API_BASE_URL,
  staging: DEFAULT_API_BASE_URL,
  prod: DEFAULT_API_BASE_URL,
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
  if (/\/api\/v1$/i.test(withoutTrailingSlash) || /\/v1$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }
  if (/\/api$/i.test(withoutTrailingSlash)) {
    return `${withoutTrailingSlash}/v1`;
  }
  return `${withoutTrailingSlash}/v1`;
};

const deriveApiOrigin = (apiBaseUrl: string): string =>
  apiBaseUrl
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/v1\/?$/i, '')
    .replace(/\/api\/?$/i, '');

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
export const API_ORIGIN = deriveApiOrigin(API_BASE_URL);
export const API_BASE_URLS_BY_ENV = API_BASE_URLS;
