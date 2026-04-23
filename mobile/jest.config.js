module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>', '<rootDir>/../tests/mobile'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
