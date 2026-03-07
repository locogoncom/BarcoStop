import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useLanguage} from '../contexts/LanguageContext';
import {colors} from '../theme/colors';

export default function BookingsScreen({navigation}: any) {
  const {t} = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 {t('navBookings')}</Text>
      <Text style={styles.placeholder}>Coming soon...</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Home')}>
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
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
