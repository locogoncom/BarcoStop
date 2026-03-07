import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {reservationService} from '../services/api';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';

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
    Alert.alert('Cancelar', '¿Estás seguro de que quieres cancelar esta solicitud?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Sí, cancelar',
        onPress: async () => {
          try {
            await reservationService.updateReservation(id, 'cancelled');
            Alert.alert('Éxito', 'Solicitud cancelada');
            await loadReservations();
          } catch (error) {
            Alert.alert('Error', 'No pudimos cancelar la solicitud');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
      case 'confirmed':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#0284c7';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '🟡 Pendiente';
      case 'approved':
      case 'confirmed':
        return '✅ Aceptada';
      case 'rejected':
        return '❌ Rechazada';
      case 'cancelled':
        return '⛔ Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
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
                <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
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
                      Alert.alert(
                        'PayPal',
                        `Se abrirá el checkout seguro de PayPal para pagar €${amount.toFixed(2)}. Ahí podrás usar tarjeta o cuenta PayPal.`,
                        [
                          {text: 'Cancelar', style: 'cancel'},
                          {text: 'Pagar con PayPal', onPress: () => {
                            openPayPalCheckout(amount);
                          }}
                        ]
                      );
                    }}
                  >
                    <Text style={styles.paypalBtnText}>💳 Pagar con PayPal</Text>
                  </TouchableOpacity>
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
  container: {flex: 1, backgroundColor: '#f8fafc', padding: 16},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  
  homeBtn: {backgroundColor: '#0ea5e9', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, alignSelf: 'flex-start'},
  homeBtnText: {color: '#fff', fontWeight: '600', fontSize: 14},
  
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyIcon: {fontSize: 60, marginBottom: 16},
  emptyTitle: {fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8},
  emptyText: {fontSize: 14, color: '#64748b'},

  card: {backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12},
  titleSection: {flex: 1},
  tripTitle: {fontSize: 16, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 4},
  route: {fontSize: 13, color: '#475569'},
  statusBadge: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20},
  statusText: {color: '#fff', fontWeight: '600', fontSize: 12},

  details: {backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  detailLabel: {fontSize: 13, color: '#64748b', flex: 1},
  detailValue: {fontSize: 13, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'right'},

  cancelBtn: {backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 10, alignItems: 'center'},
  cancelBtnText: {color: '#fff', fontWeight: '600', fontSize: 13},

  approvedSection: {gap: 10},
  approvedMsg: {backgroundColor: '#d1fae5', borderRadius: 8, paddingVertical: 10, alignItems: 'center'},
  approvedText: {color: '#047857', fontWeight: '600', fontSize: 13},
  
  paypalBtn: {backgroundColor: '#003087', borderRadius: 8, paddingVertical: 12, alignItems: 'center'},
  paypalBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 14},

  rejectedMsg: {backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 10, alignItems: 'center'},
  rejectedText: {color: '#dc2626', fontWeight: '600', fontSize: 13},
});
