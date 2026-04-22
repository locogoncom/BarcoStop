import React from 'react';
import {StatusBar} from 'react-native';
import {AuthProvider} from './src/contexts/AuthContext';
import {LanguageProvider} from './src/contexts/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1cc7b6" />
        <AppNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
}
