import React from 'react';
import {StatusBar} from 'react-native';
import {AuthProvider} from '../../contexts/AuthContext';
import {LanguageProvider} from '../../contexts/LanguageContext';
import AppNavigator from '../../navigation/AppNavigator';

export default function BarcoStopApp(): React.JSX.Element {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1C4D7A" />
      <LanguageProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </LanguageProvider>
    </>
  );
}
