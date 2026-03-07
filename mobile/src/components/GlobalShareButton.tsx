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
import {colors} from '../theme/colors';

const APP_SHARE_TEXT = [
  '🚤 BarcoStop: comparte travesias, conoce tripulacion y vive el mar en comunidad.',
  '',
  'Descargatela y sube tu primera experiencia hoy. ⚓',
  '',
  'https://barcostop.app',
].join('\n');

// URL para QR - cuando la cámara lo escanea, ofrece abrirla
const APP_QR_URL = 'https://barcostop.app';

const SHARE_COUNT_KEY = '@barcostop/shareCount';

export function GlobalShareButton() {
  const [visible, setVisible] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [shareCount, setShareCount] = useState(0);

  // Keep the button at bottom-right, but high enough to avoid tab bar/content overlap.
  const fabBottom = Platform.OS === 'android' ? 86 : 98;

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

    loadCounter();
  }, []);

  const incrementShareCount = async () => {
    try {
      const next = shareCount + 1;
      setShareCount(next);
      await AsyncStorage.setItem(SHARE_COUNT_KEY, String(next));
    } catch {
      // Ignore counter persistence failures to keep sharing flow smooth.
    }
  };

  const handleGenericShare = async () => {
    try {
      const result = await Share.share({message: sharePayload});
      if (result.action === Share.sharedAction) {
        await incrementShareCount();
      }
    } catch (error) {
      Alert.alert('Compartir', 'No pudimos abrir el menú de compartir');
    }
  };

  const handleWhatsApp = async () => {
    try {
      const url = `https://wa.me/?text=${encodeURIComponent(sharePayload)}`;
      await Linking.openURL(url);
      await incrementShareCount();
    } catch (error) {
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
    } catch (error) {
      Alert.alert('Instagram', 'No pudimos abrir Instagram');
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.fab, {bottom: fabBottom}]} onPress={() => setVisible(true)}>
        <Text style={styles.fabText}>📣</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Invita a tus amigos</Text>
            <Text style={styles.subtitle}>Cada viaje compartido atrae nuevos usuarios a BarcoStop.</Text>
            <Text style={styles.counterText}>Compartidos totales: {shareCount}</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleGenericShare}>
              <Text style={styles.actionText}>📤 Compartir campaña</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
              <Text style={styles.actionText}>💬 WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleInstagram}>
              <Text style={styles.actionText}>📸 Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.qrBtn]}
              onPress={() => {
                setShowQr(true);
                setVisible(false);
              }}
            >
              <Text style={styles.actionText}>🔳 Ver QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
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
            <Text style={styles.helperText}>Escanéalo con la cámara de tu móvil para ir a barcostop.app</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowQr(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 8,
  },
  fabText: {fontSize: 24},
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  qrCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  title: {fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12},
  subtitle: {fontSize: 12, color: colors.textMuted, marginBottom: 10},
  counterText: {fontSize: 12, color: colors.primary, fontWeight: '700', marginBottom: 10},
  actionBtn: {
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  qrBtn: {backgroundColor: colors.primaryAlt},
  actionText: {color: colors.white, fontWeight: '700', textAlign: 'center'},
  closeBtn: {
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: colors.border,
    paddingVertical: 10,
  },
  closeText: {textAlign: 'center', color: colors.textStrong, fontWeight: '700'},
  qrWrap: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  helperText: {fontSize: 12, color: colors.textMuted, marginBottom: 8},
});
