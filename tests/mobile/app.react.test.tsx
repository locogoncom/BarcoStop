import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('../../mobile/src/navigation/AppNavigator', () => 'AppNavigator');
jest.mock('../../mobile/src/contexts/AuthContext', () => ({
  AuthProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock('../../mobile/src/contexts/LanguageContext', () => ({
  LanguageProvider: ({children}: {children: React.ReactNode}) => children,
}));

describe('mobile App root', () => {
  it('renderiza el arbol principal con AppNavigator', () => {
    const App = require('../../mobile/App').default;
    const tree = renderer.create(<App />).root;

    expect(tree.findByType('AppNavigator')).toBeTruthy();
  });
});
