import React from 'react';
import {ActivityIndicator, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {WebView} from 'react-native-webview';

type PayPalWebViewModalProps = {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
};

export function PayPalWebViewModal({visible, url, title = 'PayPal Checkout', onClose}: PayPalWebViewModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        {url ? (
          <WebView
            source={{uri: url}}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#003087" />
                <Text style={styles.loaderText}>Cargando checkout de PayPal...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.loaderWrap}>
            <Text style={styles.loaderText}>No hay URL de PayPal disponible.</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {fontSize: 16, fontWeight: '700', color: '#0f172a'},
  closeBtn: {
    backgroundColor: '#003087',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeBtnText: {color: '#fff', fontWeight: '700', fontSize: 12},
  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  loaderText: {color: '#334155', fontSize: 14},
});
