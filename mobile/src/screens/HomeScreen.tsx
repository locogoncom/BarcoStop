import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useLanguage} from '../contexts/LanguageContext';
import type {LanguageCode} from '../i18n/translations';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({navigation}: Props) {
  const {language, setLanguage, t} = useLanguage();

  const languageOptions: {code: LanguageCode; flag: string; label: string}[] = [
    {code: 'en', flag: '🇬🇧', label: 'English'},
    {code: 'es', flag: '🇪🇸', label: 'Español'},
    {code: 'fr', flag: '🇫🇷', label: 'Français'},
    {code: 'pt', flag: '🇵🇹', label: 'Português'},
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>⛵</Text>
      <Text style={styles.title}>BarcoStop</Text>
      <Text style={styles.subtitle}>{t('homeSubtitle')}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Auth', {role: 'patron'})}>
        <Text style={styles.buttonText}>{t('homeCaptain')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={() => navigation.navigate('Auth', {role: 'viajero'})}>
        <Text style={styles.buttonText}>{t('homeTraveler')}</Text>
      </TouchableOpacity>

      <View style={styles.languageWrap}>
        <Text style={styles.languageTitle}>{t('languageTitle')}</Text>
        <View style={styles.flagsRow}>
          {languageOptions.map(option => (
            <TouchableOpacity
              key={option.code}
              style={[styles.flagBtn, language === option.code && styles.flagBtnActive]}
              onPress={() => setLanguage(option.code)}>
              <Text style={styles.flagEmoji}>{option.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f0f9ff'},
  logo: {fontSize: 54, marginBottom: 2},
  title: {fontSize: 32, fontWeight: '800', color: '#0c4a6e', marginTop: 4},
  subtitle: {fontSize: 16, color: '#0369a1', marginTop: 8, marginBottom: 24, textAlign: 'center'},
  button: {width: '100%', backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: 10, marginBottom: 12},
  secondary: {backgroundColor: '#0ea5e9'},
  buttonText: {textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 16},
  languageWrap: {marginTop: 55, alignItems: 'center'},
  languageTitle: {fontSize: 13, color: '#475569', marginBottom: 8, fontWeight: '600'},
  flagsRow: {flexDirection: 'row', gap: 10},
  flagBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  flagBtnActive: {
    borderColor: '#0284c7',
    borderWidth: 2,
  },
  flagEmoji: {fontSize: 20},
});
