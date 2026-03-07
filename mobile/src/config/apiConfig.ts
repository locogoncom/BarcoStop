export type AppEnv = 'dev' | 'staging' | 'prod';

const API_BASE_URLS: Record<AppEnv, string> = {
  dev: 'http://10.0.2.2:5000/api',
  staging: 'https://staging-api.barcostop.com/api',
  prod: 'https://api.barcostop.com/api',
};

const normalizeEnv = (value: unknown): AppEnv | null => {
  if (typeof value !== 'string') return null;
  const env = value.trim().toLowerCase();
  if (env === 'dev' || env === 'staging' || env === 'prod') return env;
  return null;
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
export const API_BASE_URL = API_BASE_URLS[APP_ENV];
export const API_BASE_URLS_BY_ENV = API_BASE_URLS;
