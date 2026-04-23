import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {tripService, reservationService, messageService} from '../services/api';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, shadows, spacing} from '../theme/layout';
import {getReservationStatusColor, getReservationStatusLabel} from '../theme/reservationStatus';
import {getErrorMessage} from '../utils/errors';

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
      feedback.error(getErrorMessage(error, 'No se pudieron cargar las solicitudes'));
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

    const travelerIdRaw = request.userId ?? request.user_id;
    const travelerId = travelerIdRaw ? String(travelerIdRaw) : '';
    const travelerName = request.userName || request.user_name || 'Viajero';
    const tripIdRaw = request.trip?.id || request.tripId || request.trip_id;
    const tripId = tripIdRaw ? String(tripIdRaw) : undefined;

    if (!travelerId) {
      feedback.error('No encontramos el usuario del viajero');
      return;
    }

    try {
      const patronId = String(session.userId);
      if (patronId === travelerId) {
        feedback.error('No puedes abrir un chat contigo mismo');
        return;
      }

      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          chatSeed: `${travelerId}-${Date.now()}`,
          otherUserName: travelerName,
          otherUserId: travelerId,
          tripId,
        },
      });
    } catch (error) {
      console.error('Error opening chat from patron requests:', error);
      feedback.error(getErrorMessage(error, 'No pudimos abrir el chat'));
    }
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

      feedback.confirm('Exito', 'Solicitud aceptada. Ya podeis hablar por chat.', [
        {text: 'Cerrar', style: 'cancel'},
        {text: 'Abrir chat', onPress: () => openChatForRequest(request)},
      ]);
      await loadRequests();
    } catch (error) {
      feedback.error(getErrorMessage(error, 'No pudimos aceptar la solicitud'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (id: string) => {
    feedback.confirm('Rechazar', '¿Estas seguro de que quieres rechazar esta solicitud?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Sí, rechazar',
        onPress: async () => {
          try {
            setProcessingId(id);
            await reservationService.updateReservation(id, 'rejected');
            feedback.success('Solicitud rechazada');
            await loadRequests();
          } catch (error) {
            feedback.error(getErrorMessage(error, 'No pudimos rechazar la solicitud'));
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />}
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
                  <Text style={styles.detailLabel}>👤 Viajero:</Text>
                  <Text style={styles.detailValue}>{item.userName || item.user_name || `ID: ${item.userId || item.user_id}`}</Text>
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
  container: {flex: 1, backgroundColor: colors.background, padding: spacing.lg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
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

  messageText: {fontSize: 12, color: colors.textStrong, fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border},

  actionRow: {flexDirection: 'row', gap: 10},
  actionBtn: {flex: 1, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center'},
  approveBtn: {backgroundColor: colors.success},
  rejectBtn: {backgroundColor: colors.danger},
  chatBtn: {backgroundColor: colors.primary},
  actionBtnText: {color: colors.white, fontWeight: '600', fontSize: 13},
});
