import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {reservationService} from '../services/api';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';
import {colors} from '../theme/colors';
import {getReservationStatusColor, getReservationStatusLabel} from '../theme/reservationStatus';
import {feedback} from '../theme/feedback';
import {radius, shadows, spacing} from '../theme/layout';

export default function ReservationsScreen() {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const {t, language} = useLanguage();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paypalVisible, setPaypalVisible] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');

  const openPayPalCheckout = (amount: number) => {
    const url = `https://paypal.me/BarcoStop/${Math.max(0, amount).toFixed(2)}`;
    setPaypalUrl(url);
    setPaypalVisible(true);
  };

  const loadReservations = async () => {
    if (!session?.userId) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
      const data = await reservationService.getUserReservations(session.userId);
      setReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReservations();
    }, [session?.userId])
  );

  const handleCancelReservation = async (id: string) => {
    feedback.confirm('Cancelar', '¿Estas seguro de que quieres cancelar esta solicitud?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Sí, cancelar',
        onPress: async () => {
          try {
            await reservationService.updateReservation(id, 'cancelled');
            feedback.success('Solicitud cancelada');
            await loadReservations();
          } catch (error) {
            feedback.error('No pudimos cancelar la solicitud');
          }
        },
      },
    ]);
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    const locale = language === 'en' ? 'en-GB' : language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-PT' : 'es-ES';
    return d.toLocaleDateString(locale, {day: '2-digit', month: 'short', year: 'numeric'});
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeBtnText}>🏠 Inicio</Text>
      </TouchableOpacity>

      {reservations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Sin reservas</Text>
          <Text style={styles.emptyText}>Todavía no tienes reservas en viajes</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReservations(); }} />}
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.titleSection}>
                  <Text style={styles.tripTitle}>{item.trip?.title || 'Viaje'}</Text>
                  <Text style={styles.route}>📍 {item.trip?.origin} → {item.trip?.destination}</Text>
                </View>
                <View style={[styles.statusBadge, {backgroundColor: getReservationStatusColor(item.status)}]}>
                  <Text style={styles.statusText}>{getReservationStatusLabel(item.status)}</Text>
                </View>
              </View>

              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>📅 Fecha:</Text>
                  <Text style={styles.detailValue}>{formatDate(item.trip?.departureDate)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>💺 Asientos:</Text>
                  <Text style={styles.detailValue}>{item.seats || 1}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>💵 Precio:</Text>
                  <Text style={styles.detailValue}>€{item.trip?.price || 0}</Text>
                </View>
                {item.trip?.patron && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>👤 Capitán:</Text>
                    <Text style={styles.detailValue}>{item.trip.patron.name}</Text>
                  </View>
                )}
              </View>

              {item.status === 'pending' && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancelReservation(item.id)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar solicitud</Text>
                </TouchableOpacity>
              )}

              {(item.status === 'approved' || item.status === 'confirmed') && (
                <View style={styles.approvedSection}>
                  <View style={styles.approvedMsg}>
                    <Text style={styles.approvedText}>✅ ¡Tu solicitud fue aceptada!</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.paypalBtn}
                    onPress={() => {
                      const amount = Number(item.trip?.price || 0) * Number(item.seats || 1);
                      feedback.confirm(
                        'PayPal',
                        `Se abrirá el checkout de PayPal para €${amount.toFixed(2)}. Nota: esta cuenta PayPal de BarcoStop es temporal; el pago final del viaje debe coordinarse con el capitán.`,
                        [
                          {text: 'Cancelar', style: 'cancel'},
                          {text: 'Pagar con PayPal', onPress: () => {
                            openPayPalCheckout(amount);
                          }}
                        ]
                      );
                    }}
                  >
                    <Text style={styles.paypalBtnText}>💳 Pagar con PayPal (temporal)</Text>
                  </TouchableOpacity>
                  <Text style={styles.paypalNoticeText}>
                    El pago del viaje debe confirmarse con el capitán (acuerdo directo o actualización manual de datos).
                  </Text>
                </View>
              )}

              {(item.status === 'rejected' || item.status === 'cancelled') && (
                <View style={styles.rejectedMsg}>
                  <Text style={styles.rejectedText}>❌ Tu solicitud fue rechazada</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      <PayPalWebViewModal
        visible={paypalVisible}
        url={paypalUrl}
        title="Pago con PayPal"
        onClose={() => setPaypalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.lg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  
  homeBtn: {backgroundColor: colors.primaryAlt, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.lg, marginBottom: spacing.lg, alignSelf: 'flex-start'},
  homeBtnText: {color: colors.white, fontWeight: '600', fontSize: 14},
  
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyIcon: {fontSize: 60, marginBottom: 16},
  emptyTitle: {fontSize: 18, fontWeight: 'bold', color: colors.textStrong, marginBottom: 8},
  emptyText: {fontSize: 14, color: colors.textMuted},

  card: {backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12},
  titleSection: {flex: 1},
  tripTitle: {fontSize: 16, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 4},
  route: {fontSize: 13, color: colors.textStrong},
  statusBadge: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.round},
  statusText: {color: colors.white, fontWeight: '600', fontSize: 12},

  details: {backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  detailLabel: {fontSize: 13, color: colors.textMuted, flex: 1},
  detailValue: {fontSize: 13, fontWeight: '600', color: colors.textStrong, flex: 1, textAlign: 'right'},

  cancelBtn: {backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center'},
  cancelBtnText: {color: colors.white, fontWeight: '600', fontSize: 13},

  approvedSection: {gap: 10},
  approvedMsg: {backgroundColor: '#d1fae5', borderRadius: radius.md, paddingVertical: 10, alignItems: 'center'},
  approvedText: {color: '#047857', fontWeight: '600', fontSize: 13},
  
  paypalBtn: {backgroundColor: '#003087', borderRadius: radius.md, paddingVertical: 12, alignItems: 'center'},
  paypalBtnText: {color: colors.white, fontWeight: 'bold', fontSize: 14},
  paypalNoticeText: {fontSize: 12, color: colors.textStrong, lineHeight: 17, textAlign: 'center'},

  rejectedMsg: {backgroundColor: '#fee2e2', borderRadius: radius.md, paddingVertical: 10, alignItems: 'center'},
  rejectedText: {color: '#dc2626', fontWeight: '600', fontSize: 13},
});
