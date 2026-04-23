import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import type {LanguageCode} from '../i18n/translations';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';

const heroAccentTone = '#0f766e';
const homeLogo = require('../../android/app/src/main/ic_launcher-playstore.png');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({navigation}: Props) {
  const {language, setLanguage, t} = useLanguage();
  const {session} = useAuth();

  const goToAuth = (role: 'patron' | 'viajero') => {
    navigation.navigate('Auth', {role});
  };

  const languageOptions: {code: LanguageCode; flag: string; label: string}[] = [
    {code: 'en', flag: '🇬🇧', label: 'English'},
    {code: 'es', flag: '🇪🇸', label: 'Español'},
    {code: 'fr', flag: '🇫🇷', label: 'Français'},
    {code: 'pt', flag: '🇵🇹', label: 'Português'},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <View style={styles.heroCard}>
        <View style={styles.logoWrap}>
          <Image source={homeLogo} style={styles.logoImage} resizeMode="contain" />
        </View>

        <Text style={styles.title}>BarcoStop</Text>
        <Text style={styles.subtitle}>{t('homeSubtitle')}</Text>
        {session ? (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.reset({index: 0, routes: [{name: 'MainApp'}]})}>
            <Text style={styles.buttonText}>⛵ {t('authContinue')}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.button, session ? styles.secondaryButton : null]}
          onPress={() => goToAuth('patron')}>
          <Text style={styles.buttonText}>🧭 {t('homeCaptain')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => goToAuth('viajero')}>
          <Text style={styles.buttonText}>🎒 {t('homeTraveler')}</Text>
        </TouchableOpacity>


        <Text style={styles.callout}>{t('homeAnimateSailor')}</Text>
      </View>

      <View style={styles.languageWrap}>
        <Text style={styles.languageTitle}>{t('languageTitle')}</Text>
        <View style={styles.flagsRow}>
          {languageOptions.map(option => {
            const isActive = language === option.code;
            return (
              <TouchableOpacity
                key={option.code}
                style={[styles.flagBtn, isActive && styles.flagBtnActive]}
                onPress={() => setLanguage(option.code)}>
                <Text style={styles.flagEmoji}>{option.flag}</Text>
                <Text style={[styles.flagLabel, isActive && styles.flagLabelActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#ecfffb',
  },
  bgCircleTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#99f6e4',
    opacity: 0.6,
  },
  bgCircleBottom: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#5eead4',
    opacity: 0.28,
  },
  heroCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#c7f9f1',
  },
  logoWrap: {alignItems: 'center', marginBottom: 2},
  logoImage: {width: 132, height: 132},
  title: {fontSize: 34, fontWeight: '800', color: heroAccentTone, textAlign: 'center'},
  subtitle: {fontSize: 15, color: heroAccentTone, marginTop: 8, marginBottom: 18, textAlign: 'center', lineHeight: 21},
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#159a8c',
  },
  secondary: {backgroundColor: colors.primaryAlt, borderColor: '#1cc7b6'},
  secondaryButton: {backgroundColor: heroAccentTone, borderColor: heroAccentTone},
  buttonText: {textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 16},
  callout: {
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
    color: heroAccentTone,
    fontWeight: '600',
    fontSize: 13,
  },
  languageWrap: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#f4fffd',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#c7f9f1',
  },
  languageTitle: {fontSize: 13, color: '#475569', marginBottom: 9, fontWeight: '700'},
  flagsRow: {flexDirection: 'row', gap: 8},
  flagBtn: {
    width: 62,
    height: 62,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  flagBtnActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#eafffb',
  },
  flagEmoji: {fontSize: 21, marginBottom: 2},
  flagLabel: {fontSize: 10, color: '#64748b', fontWeight: '600'},
  flagLabelActive: {color: heroAccentTone},
});
