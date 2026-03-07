import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {userService} from '../services/api';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, spacing} from '../theme/layout';

export default function AuthScreen({route}: any) {
  const {role} = route.params;
  const navigation = useNavigation<any>();
  const {login} = useAuth();
  const {t} = useLanguage();
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || (isRegister && !name.trim())) {
      feedback.alert(t('authRequiredTitle'), t('authRequiredMessage'));
      return;
    }

    try {
      setLoading(true);
      const safeName = name.trim() || 'Usuario';

      console.log(`[AUTH] ${isRegister ? 'Registro' : 'Login'} - Email: ${email.trim()}, Role: ${role}`);

      const sessionData = isRegister
        ? await userService
            .register({name: safeName, email: email.trim(), role})
            .then((user) => {
              console.log('[AUTH] Usuario registrado:', user);
              return userService.login({email: email.trim(), role});
            })
        : await userService.login({email: email.trim(), role});

      console.log('[AUTH] Session data recibida:', sessionData);
      await login(sessionData);
      navigation.replace('MainApp');
    } catch (err: any) {
      console.error('[AUTH] Error:', err);
      console.error('[AUTH] Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.message || t('authErrorMessage');
      feedback.alert(t('alertErrorTitle'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'patron' ? t('roleCaptain') : t('roleTraveler');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegister ? t('authRegister') : t('authLogin')} ({roleLabel})</Text>
      {isRegister ? (
        <TextInput
          style={styles.input}
          placeholder={t('authName')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      ) : null}
      <TextInput
        style={styles.input}
        placeholder={t('authEmail')}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t('authProcessing') : t('authContinue')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.link}>
          {isRegister ? t('authHaveAccount') : t('authNoAccount')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: spacing.xxl, justifyContent: 'center', backgroundColor: colors.background},
  title: {fontSize: 26, fontWeight: '700', marginBottom: spacing.xxl, color: colors.text, textAlign: 'center'},
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  button: {backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.lg, marginTop: spacing.xs},
  buttonText: {color: colors.white, textAlign: 'center', fontWeight: '700'},
  link: {marginTop: spacing.lg, textAlign: 'center', color: colors.primaryAlt, fontWeight: '600'},
});
