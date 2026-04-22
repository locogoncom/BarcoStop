import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import {buildPayPalMeUrl} from '../config/paypal';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';
import {colors} from '../theme/colors';

const APP_INTERNAL_TEST_URL = 'https://play.google.com/apps/testing/com.barcostop.app';

const APP_SHARE_TEXT = [
  'BarcoStop: comparte travesias, conoce tripulacion y vive el mar en comunidad.',
  '',
  'Descargatela y sube tu primera experiencia hoy.',
  '',
  APP_INTERNAL_TEST_URL,
].join('\n');

const APP_QR_URL = APP_INTERNAL_TEST_URL;
const PAYPAL_DONATION_URL = buildPayPalMeUrl(2.5, 2.5);
const SHARE_COUNT_KEY = '@barcostop/shareCount';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ShareTabModal({visible, onClose}: Props) {
  const [showQr, setShowQr] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [paypalVisible, setPaypalVisible] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');

  const sharePayload = useMemo(() => APP_SHARE_TEXT, []);

  useEffect(() => {
    const loadCounter = async () => {
      try {
        const saved = await AsyncStorage.getItem(SHARE_COUNT_KEY);
        const value = saved ? parseInt(saved, 10) : 0;
        setShareCount(Number.isNaN(value) ? 0 : value);
      } catch {
        setShareCount(0);
      }
    };

    if (visible || showQr) {
      loadCounter();
    }
  }, [visible, showQr]);

  const incrementShareCount = async () => {
    try {
      const next = shareCount + 1;
      setShareCount(next);
      await AsyncStorage.setItem(SHARE_COUNT_KEY, String(next));
    } catch {
      // Ignore counter persistence failures.
    }
  };

  const handleGenericShare = async () => {
    try {
      const result = await Share.share({message: sharePayload});
      if (result.action === Share.sharedAction) {
        await incrementShareCount();
      }
    } catch {
      Alert.alert('Compartir', 'No pudimos abrir el menú de compartir');
    }
  };

  const handleWhatsApp = async () => {
    try {
      const url = `https://wa.me/?text=${encodeURIComponent(sharePayload)}`;
      await Linking.openURL(url);
      await incrementShareCount();
    } catch {
      Alert.alert('WhatsApp', 'No pudimos abrir WhatsApp');
    }
  };

  const handleInstagram = async () => {
    try {
      const appUrl = 'instagram://app';
      const webUrl = 'https://www.instagram.com/';
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
      await incrementShareCount();
      Alert.alert('Instagram', 'Tip: pega el texto de BarcoStop en tu historia o bio.');
    } catch {
      Alert.alert('Instagram', 'No pudimos abrir Instagram');
    }
  };

  const handleDonatePayPal = () => {
    setPaypalUrl(PAYPAL_DONATION_URL);
    setPaypalVisible(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Invita a tus amigos</Text>
            <Text style={styles.subtitle}>Cada viaje compartido atrae nuevos usuarios a BarcoStop.</Text>
            <Text style={styles.counterText}>Compartidos totales: {shareCount}</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleGenericShare}>
              <Text style={styles.actionText}>Compartir campaña</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleInstagram}>
              <Text style={styles.actionText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.qrBtn]}
              onPress={() => {
                setShowQr(true);
                onClose();
              }}>
              <Text style={styles.actionText}>Ver QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paypalDonateBtn} onPress={handleDonatePayPal}>
              <Text style={styles.paypalDonateText}>Donar con PayPal a BarcoStop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showQr} transparent animationType="fade" onRequestClose={() => setShowQr(false)}>
        <View style={styles.overlay}>
          <View style={styles.qrCard}>
            <Text style={styles.title}>QR de BarcoStop</Text>
            <Text style={styles.counterText}>Compartidos totales: {shareCount}</Text>
            <View style={styles.qrWrap}>
              <QRCode value={APP_QR_URL} size={180} color={colors.primary} backgroundColor={colors.white} />
            </View>
            <Text style={styles.helperText}>Escanéalo para abrir el acceso de pruebas internas en Google Play</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowQr(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PayPalWebViewModal
        visible={paypalVisible}
        url={paypalUrl}
        title="Donación con PayPal"
        onClose={() => setPaypalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textStrong,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  counterText: {
    fontSize: 13,
    color: colors.primaryAlt,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  qrBtn: {
    backgroundColor: colors.primaryAlt,
  },
  actionText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  paypalDonateBtn: {
    backgroundColor: '#003087',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  paypalDonateText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  closeBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: {
    color: colors.textStrong,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  qrWrap: {
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 18,
    marginVertical: 14,
  },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
});