type LogArgs = unknown[];

const isDev =
  typeof __DEV__ !== 'undefined'
    ? __DEV__
    : process.env.NODE_ENV !== 'production';

export const logger = {
  debug(...args: LogArgs) {
    if (!isDev) {
      return;
    }
    console.log(...args);
  },
  info(...args: LogArgs) {
    if (!isDev) {
      return;
    }
    console.log(...args);
  },
  warn(...args: LogArgs) {
    if (!isDev) {
      return;
    }
    console.warn(...args);
  },
  error(...args: LogArgs) {
    // En prod queremos conservar errores (ayuda a diagnóstico en logs del device).
    console.error(...args);
  },
};
