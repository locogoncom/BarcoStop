import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {userService} from '../services/api';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, spacing} from '../theme/layout';
import {getErrorMessage} from '../utils/errors';
import {logger} from '../utils/logger';

export default function AuthScreen({route}: any) {
  const {role} = route.params;
  const navigation = useNavigation<any>();
  const {login} = useAuth();
  const {t} = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || (isRegister && !name.trim()) || !password.trim()) {
      feedback.alert(t('authRequiredTitle'), t('authRequiredMessage'));
      return;
    }

    if (isRegister && password.trim() !== confirmPassword.trim()) {
      feedback.alert(t('authPasswordMismatchTitle'), t('authPasswordMismatchMessage'));
      return;
    }

    try {
      setLoading(true);
      const safeName = name.trim() || 'Usuario';
      logger.debug(`[AUTH] ${isRegister ? 'Registro' : 'Login'} - Email: ${email.trim()}, Role: ${role}`);

      const sessionData = isRegister
        ? await userService
            .register({name: safeName, email: email.trim(), password: password.trim(), role})
            .then(() => userService.login({email: email.trim(), password: password.trim()}))
        : await userService.login({email: email.trim(), password: password.trim()});

      logger.debug('[AUTH] Session data recibida:', sessionData);
      await login(sessionData);
      navigation.replace('MainApp');
    } catch (err: any) {
      logger.error('[AUTH] Error:', err);
      feedback.alert(t('alertErrorTitle'), getErrorMessage(err, t('authErrorMessage')));
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
          placeholder={t('authName') || 'Usuario'}
          placeholderTextColor={colors.textSubtle}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder={t('authEmail') || 'Email'}
        placeholderTextColor={colors.textSubtle}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <View style={{position: 'relative'}}>
        <TextInput
          style={styles.input}
          placeholder={t('authPassword')}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.showButton}
          onPress={() => setShowPassword((v) => !v)}
        >
          <Text style={styles.showButtonText}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
        </TouchableOpacity>
      </View>

      {isRegister ? (
        <View style={{position: 'relative'}}>
          <TextInput
            style={styles.input}
            placeholder={t('authConfirmPassword')}
            placeholderTextColor={colors.textSubtle}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.showButton}
            onPress={() => setShowConfirmPassword((value) => !value)}
          >
            <Text style={styles.showButtonText}>{showConfirmPassword ? 'Ocultar' : 'Mostrar'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t('authProcessing') : t('authContinue')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, loading && styles.secondaryButtonDisabled]}
        onPress={() => {
          setIsRegister(!isRegister);
          setConfirmPassword('');
          setShowConfirmPassword(false);
        }}
        disabled={loading}>
        <Text style={styles.secondaryButtonText}>
          {isRegister ? t('authHaveAccount') : t('authNoAccount')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        {isRegister ? 'Si ya tienes cuenta, entra desde el boton de abajo.' : 'Si es tu primera vez, crea tu cuenta desde el boton de abajo.'}
      </Text>
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
  secondaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryAlt,
  },
  secondaryButtonDisabled: {opacity: 0.7},
  showButton: {position: 'absolute', right: 10, top: 10, padding: 4},
  showButtonText: {color: colors.primaryAlt, fontWeight: '600'},
  buttonText: {color: colors.white, textAlign: 'center', fontWeight: '700'},
  secondaryButtonText: {textAlign: 'center', color: colors.primaryAlt, fontWeight: '700'},
  note: {marginTop: spacing.lg, textAlign: 'center', color: colors.textSubtle, fontWeight: '500'},
});
