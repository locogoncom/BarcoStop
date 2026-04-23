import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useLanguage} from '../contexts/LanguageContext';

export default function UsersScreen({navigation}: any) {
  const {t} = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 {t('navUsers')}</Text>
      <Text style={styles.placeholder}>Coming soon...</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.getParent()?.getParent()?.reset({index: 0, routes: [{name: 'Home'}]})}>
        <Text style={styles.buttonText}>{t('goHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
