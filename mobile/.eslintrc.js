module.exports = {
  root: true,
  extends: '@react-native',
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  globals: {
    globalThis: 'readonly',
  },
};
