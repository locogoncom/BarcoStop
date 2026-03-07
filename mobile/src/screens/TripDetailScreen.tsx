import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRoute, useNavigation} from '@react-navigation/native';
import React, {useEffect, useState, useMemo} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {useLanguage} from '../contexts/LanguageContext';
import {useAuth} from '../contexts/AuthContext';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {tripService, ratingService, tripCheckpointService, favoriteService, messageService, reservationService} from '../services/api';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';
import type {Trip, Rating} from '../types';
import {colors} from '../theme/colors';

export default function TripDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {tripId} = route.params || {};
  const {t} = useLanguage();
  const {session} = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const appShareText =
    'Descargate BarcoStop y comparte viajes en barco con tu gente. Te espero a bordo.';
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [creatingCheckpoint, setCreatingCheckpoint] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [cancelingTrip, setCancelingTrip] = useState(false);
  const [paypalVisible, setPaypalVisible] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');
  const favoriteTargetUserId = String(trip?.patron?.id ?? trip?.patronId ?? '');
  
  const isTripOwner = useMemo(() => {
    const sessionId = String(session?.userId ?? '');
    const ownerId = String(trip?.patronId ?? trip?.patron?.id ?? '');
    return Boolean(sessionId && ownerId && sessionId === ownerId);
  }, [session?.userId, trip?.patronId, trip?.patron?.id]);

  const checkpointTypeLabel: Record<string, string> = {
    start: '🟢 Salida',
    mid: '🧭 Punto intermedio',
    arrival: '🏁 Llegada',
    event: '✨ Momento destacado',
  };

  const formatCheckpointDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadCheckpoints = async () => {
    if (!tripId) return;
    try {
      const data = await tripCheckpointService.listByTrip(tripId, 50);
      setCheckpoints(data);
    } catch (error) {
      console.warn('Error loading checkpoints:', error);
      setCheckpoints([]);
    }
  };

  const loadTrip = async () => {
    try {
      const data = await tripService.getById(tripId);
      setTrip(data);
      
      // Cargar ratings del capitán
      if (data.patron?.id) {
        const response = await ratingService.getRatings(data.patron.id);
        // Manejar respuesta que puede ser {ratings: [], averageRating, reviewCount}
        if (Array.isArray(response)) {
          setRatings(response);
        } else if (response && 'ratings' in response) {
          setRatings(response.ratings);
        }
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'No pudimos cargar los detalles del viaje');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
    loadCheckpoints();
  }, [tripId]);

  useEffect(() => {
    if (!favoriteTargetUserId || !session?.userId) return;
    checkFavoriteStatus();
  }, [favoriteTargetUserId, session?.userId]);

  const checkFavoriteStatus = async () => {
    if (!session?.userId || !favoriteTargetUserId) return;
    try {
      const isFav = await favoriteService.isFavorite(session.userId, favoriteTargetUserId);
      setIsFavorite(isFav);
    } catch (error) {
      console.warn('Error checking favorite status:', error);
    }
  };

  const createCheckpoint = async (checkpointType: 'start' | 'mid' | 'arrival' | 'event', note: string) => {
    if (!session?.userId || !trip?.id) return;

    try {
      setCreatingCheckpoint(true);
      await tripCheckpointService.create({
        tripId: trip.id,
        userId: session.userId,
        checkpointType,
        note,
      });
      await loadCheckpoints();
    } catch (error) {
      Alert.alert('Error', 'No pudimos guardar el punto del viaje');
    } finally {
      setCreatingCheckpoint(false);
    }
  };

  const openCheckpointMenu = () => {
    Alert.alert('Marcar punto del viaje', 'Selecciona el tipo de punto:', [
      {text: 'Cancelar', style: 'cancel'},
      {text: '🟢 Salida', onPress: () => createCheckpoint('start', 'Comenzamos el viaje')},
      {text: '🧭 Punto intermedio', onPress: () => createCheckpoint('mid', 'Seguimos navegando')},
      {text: '🏁 Llegada', onPress: () => createCheckpoint('arrival', 'Llegamos al destino')},
      {text: '✨ Momento destacado', onPress: () => createCheckpoint('event', 'Momento inolvidable')},
    ]);
  };

  const shareExperience = () => {
    const topPoints = checkpoints.slice(0, 4).reverse();
    const pointsText = topPoints.length
      ? topPoints.map(p => `- ${checkpointTypeLabel[p.checkpointType] || 'Punto'} (${formatCheckpointDate(p.createdAt)})`).join('\n')
      : '- Aun sin puntos marcados';

    const message = [
      '🌊 Nuestra experiencia en BarcoStop',
      `${trip?.title || 'Viaje'}: ${trip?.origin} -> ${trip?.destination}`,
      '',
      'Bitacora del viaje:',
      pointsText,
      '',
      'Descargate BarcoStop y comparte tu propia aventura ⚓',
    ].join('\n');

    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const handleRequestSeat = async () => {
    try {
      if (!session?.userId) {
        Alert.alert('Error', 'Debes estar conectado para solicitar un asiento');
        return;
      }

      setRequesting(true);

      await reservationService.createReservation({
        tripId: trip?.id || '',
        userId: session.userId,
        seats: 1,
      });

      Alert.alert('Éxito', 'Se envió tu solicitud al capitán');
      navigation.goBack();
    } catch (error) {
      console.error('Error requesting seat:', error);
      Alert.alert('Error', 'No pudimos enviar tu solicitud');
    } finally {
      setRequesting(false);
    }
  };

  const handleDonate = () => {
    const amount = 5;
    const fixedAmount = Math.max(2.5, amount);
    setPaypalUrl(`https://paypal.me/BarcoStop/${fixedAmount.toFixed(2)}`);
    setPaypalVisible(true);
  };

  const shareTrip = () => {
    const message = `Mira este viaje en BarcoStop: ${trip?.title} - De ${trip?.origin} a ${trip?.destination}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const openRouteInMaps = () => {
    if (!trip) return;
    const origin = encodeURIComponent(trip.origin || '');
    const destination = encodeURIComponent(trip.destination || '');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleToggleFavorite = async () => {
    if (!session?.userId || !favoriteTargetUserId) {
      Alert.alert('Error', 'Debes estar conectado para agregar favoritos');
      return;
    }

    try {
      setSavingFavorite(true);
      if (isFavorite) {
        await favoriteService.removeFavorite(session.userId, favoriteTargetUserId);
        setIsFavorite(false);
      } else {
        await favoriteService.addFavorite(session.userId, favoriteTargetUserId);
        setIsFavorite(true);
      }
    } catch (error) {
      Alert.alert('Error', 'No pudimos guardar el favorito');
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleStartChat = async () => {
    if (!session?.userId || !trip?.patron?.id) {
      Alert.alert('Error', 'Debes estar conectado para chatear');
      return;
    }

    try {
      setCreatingChat(true);
      const convo = await messageService.createOrGetConversation({
        userId1: session.userId,
        userId2: trip.patron.id,
        tripId: trip.id,
      });
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          conversationId: convo.id,
          otherUserName: trip.patron.name || 'Capitán',
          otherUserId: trip.patron.id,
        },
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'No pudimos iniciar el chat');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleEditTrip = () => {
    if (!trip?.id) return;
    navigation.navigate('CreateTrip', {
      tripId: trip.id,
      isEditing: true,
      trip,
    });
  };

  const handleCancelTrip = () => {
    Alert.alert(
      'Cancelar viaje',
      '¿Estás seguro de que quieres cancelar este viaje? Los viajeros serán notificados.',
      [
        {text: 'No, mantener', style: 'cancel'},
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelingTrip(true);
              await tripService.cancelWithActor(trip!.id, session?.userId || '');
              Alert.alert('Éxito', 'El viaje ha sido cancelado');
              navigation.navigate('Home');
            } catch (error) {
              console.error('Error canceling trip:', error);
              Alert.alert('Error', 'No pudimos cancelar el viaje');
            } finally {
              setCancelingTrip(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>{t('tripDetailLoadError')}</Text>
      </View>
    );
  }

  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : 'N/A';

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>{trip.title}</Text>
          {session?.role === 'viajero' && favoriteTargetUserId ? (
            <TouchableOpacity
              style={[styles.headerFavBtn, isFavorite && styles.headerFavBtnActive]}
              onPress={handleToggleFavorite}
              disabled={savingFavorite}
            >
              <Text style={styles.headerFavBtnText}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.routeContainer}>
          <Text style={styles.route}>{trip.origin} → {trip.destination}</Text>
        </View>
      </View>

      {/* Info básica */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>📅 {t('tripDetailDeparture')}:</Text>
          <Text style={styles.value}>{trip.departureDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>💺 {t('tripDetailSeats')}:</Text>
          <Text style={styles.value}>{trip.availableSeats}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>💵 {t('tripDetailPrice')}:</Text>
          <Text style={styles.value}>${trip.price}</Text>
        </View>
      </View>

      {/* Mapa simple de ruta (ligero) */}
      <View style={styles.routeMapSection}>
        <Text style={styles.sectionTitle}>🗺️ Ruta rápida</Text>
        <View style={styles.routeMapCard}>
          <View style={styles.routeNodeRow}>
            <View style={styles.routeDot} />
            <Text style={styles.routeNodeText}>{trip.origin}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeNodeRow}>
            <View style={[styles.routeDot, styles.routeDotEnd]} />
            <Text style={styles.routeNodeText}>{trip.destination}</Text>
          </View>
          <TouchableOpacity style={styles.routeMapBtn} onPress={openRouteInMaps}>
            <Text style={styles.routeMapBtnText}>Abrir en Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Capitán */}
      {trip.patron && (
        <View style={styles.captainSection}>
          <Text style={styles.sectionTitle}>Capitán</Text>
          <View style={styles.captainCard}>
            <Text style={styles.captainName}>{trip.patron.name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>⭐ Rating:</Text>
              <Text style={styles.ratingValue}>{avgRating}/5.0</Text>
              <Text style={styles.reviewCount}>({ratings.length} reseñas)</Text>
            </View>
            <View style={styles.captainActions}>
              <TouchableOpacity
                style={[styles.actionBtn, isFavorite && styles.actionBtnActive]}
                onPress={handleToggleFavorite}
                disabled={savingFavorite}
              >
                <Text style={styles.actionBtnText}>
                  {isFavorite ? '❤️ Favorito' : '🤍 Favorito'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.chatBtn]}
                onPress={handleStartChat}
                disabled={creatingChat}
              >
                <Text style={styles.actionBtnText}>
                  {creatingChat ? '⏳' : '💬 Chat'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isTripOwner && (
        <View style={styles.ownerSection}>
          <Text style={styles.sectionTitle}>Gestión del viaje</Text>
          <View style={styles.patronActions}>
            <TouchableOpacity
              style={[styles.patronActionBtn, styles.editBtn]}
              onPress={handleEditTrip}
            >
              <Text style={styles.patronActionBtnText}>🖊️ Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.patronActionBtn, styles.cancelBtn]}
              onPress={handleCancelTrip}
              disabled={cancelingTrip}
            >
              <Text style={styles.patronActionBtnText}>
                {cancelingTrip ? 'Cancelando...' : '❌ Cancelar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Comentarios */}
      {ratings.length > 0 && (
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>📝 Comentarios</Text>
          {ratings.map((rating, idx) => (
            <View key={idx} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.stars}>{'⭐'.repeat(rating.rating)}</Text>
                <Text style={styles.commentRating}>{rating.rating}/5</Text>
              </View>
              {rating.comment && <Text style={styles.commentText}>{rating.comment}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* QR */}
      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>Compartir app</Text>
        <View style={styles.qrContainer}>
          <QRCode
            value={appShareText}
            size={140}
            color={colors.primary}
            backgroundColor={colors.white}
          />
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={shareTrip}>
          <Text style={styles.shareBtnText}>📤 Compartir por WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Bitácora manual del viaje */}
      <View style={styles.checkpointSection}>
        <Text style={styles.sectionTitle}>🧭 Bitácora del viaje</Text>
        <Text style={styles.checkpointSubtitle}>
          Marca puntos del recorrido para compartir la experiencia.
        </Text>

        <View style={styles.checkpointActions}>
          <TouchableOpacity
            style={[styles.checkpointBtn, creatingCheckpoint && styles.requestBtnDisabled]}
            onPress={openCheckpointMenu}
            disabled={creatingCheckpoint}
          >
            <Text style={styles.checkpointBtnText}>{creatingCheckpoint ? 'Guardando...' : '➕ Marcar punto'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.checkpointBtn, styles.shareExperienceBtn]} onPress={shareExperience}>
            <Text style={styles.checkpointBtnText}>📣 Compartir experiencia</Text>
          </TouchableOpacity>
        </View>

        {checkpoints.length === 0 ? (
          <Text style={styles.noCheckpointText}>Todavia no hay puntos marcados.</Text>
        ) : (
          <View style={styles.checkpointList}>
            {checkpoints.slice(0, 6).map(point => (
              <View key={point.id} style={styles.checkpointItem}>
                <Text style={styles.checkpointType}>{checkpointTypeLabel[point.checkpointType] || 'Punto'}</Text>
                <Text style={styles.checkpointDate}>{formatCheckpointDate(point.createdAt)}</Text>
                {point.note ? <Text style={styles.checkpointNote}>{point.note}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Botón de donativos */}
      <View style={styles.donateSection}>
        <TouchableOpacity style={styles.donateBtn} onPress={handleDonate}>
          <Text style={styles.donateBtnText}>💝 Apoyar BarcoStop</Text>
        </TouchableOpacity>
        <Text style={styles.donateText}>Tu donativo nos ayuda a crecer</Text>
        <Text style={styles.paymentNoticeText}>
          Nota: el enlace PayPal mostrado ahora es temporal de BarcoStop. El pago del viaje debe acordarse
          directamente entre capitán y viajero (o actualizarse manualmente con los datos del capitán).
        </Text>
      </View>

      {/* Solicitar asiento (solo viajeros) */}
      {session?.role === 'viajero' ? (
        <TouchableOpacity 
          style={[styles.requestBtn, requesting && styles.requestBtnDisabled]}
          onPress={handleRequestSeat}
          disabled={requesting}
        >
          <Text style={styles.requestBtnText}>
            {requesting ? 'Enviando...' : '✋ Solicitar Asiento'}
          </Text>
        </TouchableOpacity>
      ) : session?.role === 'patron' ? (
        <TouchableOpacity
          style={styles.requestBtn}
          onPress={() => {
            if (isTripOwner) {
              handleEditTrip();
              return;
            }
            Alert.alert('Información', 'Este viaje pertenece a otro capitán.');
          }}
        >
          <Text style={styles.requestBtnText}>
            {isTripOwner ? '🛥️ Eres Capitán · Editar viaje' : '🛥️ Viaje de otro capitán'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.requestBtn, styles.requestBtnDisabled]} disabled={true}>
          <Text style={styles.requestBtnText}>✋ Solicitar Asiento</Text>
        </TouchableOpacity>
      )}

      {/* Home */}
      <TouchableOpacity 
        style={styles.homeBtn} 
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeBtnText}>🏠 Home</Text>
      </TouchableOpacity>

      <PayPalWebViewModal
        visible={paypalVisible}
        url={paypalUrl}
        title="Donación con PayPal"
        onClose={() => setPaypalVisible(false)}
      />

      <View style={{height: 20}} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundSoft},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  header: {backgroundColor: colors.primary, padding: 20, paddingTop: 10},
  headerTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  title: {fontSize: 24, fontWeight: 'bold', color: colors.white, marginBottom: 8},
  headerFavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerFavBtnActive: {backgroundColor: 'rgba(236,72,153,0.28)'},
  headerFavBtnText: {fontSize: 20},
  routeContainer: {backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8},
  route: {fontSize: 16, color: colors.white, fontWeight: '600'},

  infoSection: {padding: 16, backgroundColor: colors.surface, marginTop: 12},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12},
  label: {fontSize: 14, color: colors.textStrong, fontWeight: '600'},
  value: {fontSize: 14, color: '#0c4a6e', fontWeight: 'bold'},

  routeMapSection: {padding: 16, backgroundColor: colors.surface, marginTop: 8},
  routeMapCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  routeNodeRow: {flexDirection: 'row', alignItems: 'center'},
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  routeDotEnd: {backgroundColor: '#10b981'},
  routeNodeText: {fontSize: 14, color: colors.text, fontWeight: '600'},
  routeLine: {
    height: 18,
    width: 2,
    backgroundColor: '#93c5fd',
    marginLeft: 5,
    marginVertical: 4,
  },
  routeMapBtn: {
    marginTop: 12,
    backgroundColor: colors.primaryAlt,
    borderRadius: 8,
    paddingVertical: 10,
  },
  routeMapBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center'},

  captainSection: {padding: 16, backgroundColor: colors.surface, marginTop: 8},
  ownerSection: {padding: 16, backgroundColor: colors.surface, marginTop: 8},
  sectionTitle: {fontSize: 16, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 12},
  captainCard: {backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12},
  captainName: {fontSize: 16, fontWeight: '700', color: '#0284c7', marginBottom: 8},
  ratingRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  ratingLabel: {fontSize: 13, color: '#475569'},
  ratingValue: {fontSize: 14, fontWeight: 'bold', color: '#dc2626', marginLeft: 4},
  reviewCount: {fontSize: 12, color: '#78909c', marginLeft: 4},
  captainActions: {flexDirection: 'row', gap: 8},
  actionBtn: {flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8},
  actionBtnActive: {backgroundColor: '#ec4899'},
  chatBtn: {backgroundColor: '#14b8a6'},
  actionBtnText: {color: colors.white, fontWeight: '600', textAlign: 'center', fontSize: 13},
  patronActions: {flexDirection: 'row', gap: 8, marginTop: 12},
  patronActionBtn: {flex: 1, paddingVertical: 10, borderRadius: 8},
  editBtn: {backgroundColor: '#f59e0b'},
  cancelBtn: {backgroundColor: colors.danger},
  patronActionBtnText: {color: colors.white, fontWeight: '600', textAlign: 'center', fontSize: 13},

  commentsSection: {padding: 16, backgroundColor: colors.surface, marginTop: 8},
  commentCard: {backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 10},
  commentHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  stars: {fontSize: 14, marginRight: 6},
  commentRating: {fontSize: 12, fontWeight: 'bold', color: colors.primary},
  commentText: {fontSize: 13, color: colors.textStrong, fontStyle: 'italic'},

  qrSection: {padding: 16, backgroundColor: colors.surface, marginTop: 8, alignItems: 'center'},
  qrContainer: {marginVertical: 12, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 10},
  shareBtn: {backgroundColor: colors.primaryAlt, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 8, width: '100%'},
  shareBtnText: {color: colors.white, fontWeight: '600', textAlign: 'center', fontSize: 14},

  checkpointSection: {padding: 16, backgroundColor: colors.surface, marginTop: 8},
  checkpointSubtitle: {fontSize: 13, color: '#64748b', marginBottom: 10},
  checkpointActions: {flexDirection: 'row', gap: 8, marginBottom: 10},
  checkpointBtn: {flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8},
  shareExperienceBtn: {backgroundColor: '#14b8a6'},
  checkpointBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center', fontSize: 13},
  noCheckpointText: {fontSize: 13, color: '#94a3b8', fontStyle: 'italic'},
  checkpointList: {gap: 8},
  checkpointItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  checkpointType: {fontWeight: '700', color: colors.text, marginBottom: 2},
  checkpointDate: {fontSize: 12, color: '#64748b', marginBottom: 3},
  checkpointNote: {fontSize: 13, color: colors.textStrong},

  donateSection: {padding: 16, backgroundColor: colors.surface, marginTop: 8, alignItems: 'center'},
  donateBtn: {width: '100%', backgroundColor: '#ec4899', paddingVertical: 12, borderRadius: 8},
  donateBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center', fontSize: 16},
  donateText: {fontSize: 12, color: '#78909c', marginTop: 6},
  paymentNoticeText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    textAlign: 'center',
  },

  requestBtn: {marginHorizontal: 16, marginTop: 12, backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 10},
  requestBtnDisabled: {opacity: 0.6},
  requestBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center', fontSize: 16},

  homeBtn: {marginHorizontal: 16, marginTop: 8, backgroundColor: '#94a3b8', paddingVertical: 12, borderRadius: 8},
  homeBtnText: {color: colors.white, fontWeight: '600', textAlign: 'center', fontSize: 14},

  errorIcon: {fontSize: 64, marginBottom: 16},
  errorTitle: {fontSize: 20, fontWeight: '700', color: '#334155', marginBottom: 8, textAlign: 'center'},
});
