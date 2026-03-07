import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {tripService, reservationService, messageService} from '../services/api';

export default function PatronRequestsScreen() {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const {t, language} = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!session?.userId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      // Obtener viajes del patrón
      const trips = await tripService.getAll();
      const userTrips = Array.isArray(trips) 
        ? trips.filter(t => t.patronId === session.userId)
        : [];

      // Obtener solicitudes de todos los viajes del patrón
      const allRequests: any[] = [];
      for (const trip of userTrips) {
        const tripRequests = await reservationService.getTripReservations(trip.id);
        if (Array.isArray(tripRequests)) {
          allRequests.push(...tripRequests.map(r => ({...r, trip})));
        }
      }

      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRequests();
    }, [session?.userId])
  );

  const openChatForRequest = async (request: any) => {
    if (!session?.userId) return;

    const travelerId = request.userId || request.user_id;
    const travelerName = request.userName || request.user_name || 'Viajero';
    const tripId = request.trip?.id || request.tripId || request.trip_id;

    if (!travelerId) {
      Alert.alert('Error', 'No encontramos el usuario del viajero');
      return;
    }

    const conversation = await messageService.createOrGetConversation({
      userId1: session.userId,
      userId2: travelerId,
      tripId,
    });

    navigation.navigate('Messages', {
      screen: 'Chat',
      params: {
        conversationId: conversation.id,
        otherUserName: travelerName,
        otherUserId: travelerId,
      },
    });
  };

  const handleApproveRequest = async (request: any) => {
    try {
      const requestId = request.id;
      setProcessingId(requestId);
      await reservationService.updateReservation(requestId, 'approved');

      try {
        await messageService.createOrGetConversation({
          userId1: session?.userId || '',
          userId2: request.userId || request.user_id,
          tripId: request.trip?.id || request.tripId || request.trip_id,
        });
      } catch (chatError) {
        console.error('Error creating conversation on approval:', chatError);
      }

      Alert.alert('Éxito', 'Solicitud aceptada. Ya podéis hablar por chat.', [
        {text: 'Cerrar', style: 'cancel'},
        {text: 'Abrir chat', onPress: () => openChatForRequest(request)},
      ]);
      await loadRequests();
    } catch (error) {
      Alert.alert('Error', 'No pudimos aceptar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (id: string) => {
    Alert.alert('Rechazar', '¿Estás seguro de que quieres rechazar esta solicitud?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Sí, rechazar',
        onPress: async () => {
          try {
            setProcessingId(id);
            await reservationService.updateReservation(id, 'rejected');
            Alert.alert('Éxito', 'Solicitud rechazada');
            await loadRequests();
          } catch (error) {
            Alert.alert('Error', 'No pudimos rechazar la solicitud');
          } finally {
            setProcessingId(null);
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
      case 'cancelled':
        return '#ef4444';
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
      case 'cancelled':
        return '❌ Rechazada';
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
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={styles.emptyTitle}>Sin solicitudes</Text>
          <Text style={styles.emptyText}>No tienes solicitudes de reserva</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />}
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
                  <Text style={styles.detailLabel}>👤 Viajero:</Text>
                  <Text style={styles.detailValue}>ID: {item.userId || item.user_id}</Text>
                </View>
                {item.message && (
                  <View style={[styles.detailRow, {marginTop: 8}]}>
                    <Text style={styles.detailLabel}>💬 Mensaje:</Text>
                  </View>
                )}
                {item.message && (
                  <Text style={styles.messageText}>{item.message}</Text>
                )}
              </View>

              {item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApproveRequest(item)}
                    disabled={processingId === item.id}
                  >
                    <Text style={styles.actionBtnText}>
                      {processingId === item.id ? '⏳' : '✅'} Aceptar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleRejectRequest(item.id)}
                    disabled={processingId === item.id}
                  >
                    <Text style={styles.actionBtnText}>
                      {processingId === item.id ? '⏳' : '❌'} Rechazar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {(item.status === 'approved' || item.status === 'confirmed') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.chatBtn]}
                  onPress={() => openChatForRequest(item)}
                >
                  <Text style={styles.actionBtnText}>💬 Ir al chat</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8fafc', padding: 16},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
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

  messageText: {fontSize: 12, color: '#475569', fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0'},

  actionRow: {flexDirection: 'row', gap: 10},
  actionBtn: {flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center'},
  approveBtn: {backgroundColor: '#10b981'},
  rejectBtn: {backgroundColor: '#ef4444'},
  chatBtn: {backgroundColor: '#0284c7'},
  actionBtnText: {color: '#fff', fontWeight: '600', fontSize: 13},
});
