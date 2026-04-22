import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRoute, useNavigation, useIsFocused} from '@react-navigation/native';
import React, {useEffect, useState, useMemo} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert, Image, TextInput, AppState, Share} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {RemoteImage} from '../components/RemoteImage';
import {useLanguage} from '../contexts/LanguageContext';
import {useAuth} from '../contexts/AuthContext';
import {buildPayPalMeUrl} from '../config/paypal';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {tripService, ratingService, tripCheckpointService, favoriteService, messageService, reservationService} from '../services/api';
import {PayPalWebViewModal} from '../components/PayPalWebViewModal';
import type {Trip, Rating} from '../types';
import {colors} from '../theme/colors';
import {getErrorMessage} from '../utils/errors';
import {getReservationStatusColor, getReservationStatusLabel} from '../theme/reservationStatus';

const REGATTA_CHAT_POLL_INTERVAL_MS = 10000;

export default function TripDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const {tripId} = route?.params || {};
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
  const [userReservation, setUserReservation] = useState<any | null>(null);
  const [regattaParticipants, setRegattaParticipants] = useState<any[]>([]);
  const [updatingParticipantId, setUpdatingParticipantId] = useState<string | null>(null);
  const [broadcastingRegatta, setBroadcastingRegatta] = useState(false);
  const [regattaChatParticipants, setRegattaChatParticipants] = useState<any[]>([]);
  const [regattaConversationId, setRegattaConversationId] = useState('');
  const [regattaMessages, setRegattaMessages] = useState<any[]>([]);
  const [regattaChatLoading, setRegattaChatLoading] = useState(false);
  const [regattaChatSending, setRegattaChatSending] = useState(false);
  const [regattaChatDraft, setRegattaChatDraft] = useState('');
  const [regattaChatError, setRegattaChatError] = useState('');
  const [isAppActive, setIsAppActive] = useState(true);
  const [cancelingReservation, setCancelingReservation] = useState(false);
  const [cancelingTrip, setCancelingTrip] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);
  const [paypalVisible, setPaypalVisible] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');
  const favoriteTargetUserId = String(trip?.patron?.id ?? trip?.patronId ?? '');

  // Estado de error explícito
  const [loadError, setLoadError] = useState<string | null>(null);

  // Chequeo defensivo principal para evitar crash si trip es null
  if (loading) return <ActivityIndicator />;
  if (!trip || loadError) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center', padding: 24}}>
        <Text style={{fontSize:48, color:'#e67e22', marginBottom: 12}}>⚠️</Text>
        <Text style={{fontSize:20, color:'#e67e22', fontWeight:'bold', marginBottom: 8}}>No se pudo cargar el viaje.</Text>
        <Text style={{fontSize:16, color:'#888', marginBottom: 24, textAlign:'center'}}>{loadError || 'Puede que el viaje haya sido eliminado, o hubo un error de red.'}</Text>
        <TouchableOpacity
          style={{backgroundColor:'#3498db', paddingHorizontal:24, paddingVertical:12, borderRadius:8, marginBottom:12}}
          onPress={() => {
            setLoading(true);
            setLoadError(null);
            setTimeout(() => loadTrip(), 100);
          }}
        >
          <Text style={{color:'#fff', fontSize:16}}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{backgroundColor:'#aaa', paddingHorizontal:24, paddingVertical:12, borderRadius:8}}
          onPress={() => navigation.goBack()}
        >
          <Text style={{color:'#fff', fontSize:16}}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Refuerzo quirúrgico: asegurar que los campos clave nunca quedan vacíos
  const tripOrigin = trip?.origin || trip?.route?.origin || '';
  const tripDestination = trip?.destination || trip?.route?.destination || '';
  const tripDepartureDate = trip?.departureDate || trip?.route?.departureDate || '';
  const tripDepartureTime = trip?.departureTime || trip?.route?.departureTime || '';

  const isRegatta = trip?.tripKind === 'regatta';
  const reservationStatus = String(userReservation?.status || '').toLowerCase();
  const canAccessRegattaChat = Boolean(
    isRegatta &&
      session?.userId &&
      (isTripOwner || ['pending', 'approved', 'confirmed'].includes(reservationStatus))
  );

  const checkpointTypeLabel: Record<string, string> = {
    start: '🟢 Salida',
    mid: '🧭 Punto intermedio',
    arrival: '🏁 Llegada',
    event: '✨ Momento destacado',
  };

  const formatCheckpointDate = (value: unknown) => {
    const date = new Date(value as any);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRegattaMessageDate = (value: unknown) => {
    if (!value) return '';
    const date = new Date(value as any);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const appendUniqueRegattaMessage = useCallback((message: any) => {
    if (!message?.id) {
      return;
    }

    setRegattaMessages(prev => (prev.some(item => item.id === message.id) ? prev : [...prev, message]));
  }, []);

  const notifyTravelersAboutCheckpoint = async (checkpointType: string) => {
    if (!session?.userId || !trip?.id) return;

    const reservations = await reservationService.getTripReservations(trip.id);
    const travelerIds = Array.isArray(reservations)
      ? Array.from(
          new Set(
            reservations
              .map(r => String(r?.userId ?? r?.user_id ?? ''))
              .filter(id => id && id !== String(session.userId)),
          ),
        )
      : [];

    if (travelerIds.length === 0) {
      Alert.alert('Info', 'Aún no hay viajeros para notificar en este viaje.');
      return;
    }

    const messageText =
      `🧭 Actualización del viaje: ${checkpointTypeLabel[checkpointType] || 'Nuevo punto'}\n` +
      `${trip.title || 'Viaje'} (${trip.origin} → ${trip.destination})`;

    let sentCount = 0;
    for (const travelerId of travelerIds) {
      try {
        const convo = await messageService.createOrGetConversation({
          userId1: session.userId,
          userId2: travelerId,
          tripId: trip.id,
        });
        await messageService.sendMessage({
          conversationId: convo.id,
          senderId: session.userId,
          content: messageText,
        });
        sentCount += 1;
      } catch {
        // ignore per-user errors
      }
    }

    Alert.alert('✅ Enviado', `Notificamos a ${sentCount} viajero(s) por chat.`);
  };

  const openChatWithUser = async (otherUserId: string, otherUserName: string) => {
    if (!session?.userId || !otherUserId) return;

    if (String(otherUserId) === String(session.userId)) {
      Alert.alert('Info', 'No puedes abrir un chat contigo mismo.');
      return;
    }

    navigation.navigate('Messages', {
      screen: 'Chat',
      params: {
        chatSeed: `${otherUserId}-${Date.now()}`,
        otherUserId,
        otherUserName,
        tripId: trip?.id || undefined,
      },
    });
  };

  const notifyRegattaParticipants = async () => {
    if (!session?.userId || !trip?.id) return;

    const activeParticipants = regattaParticipants.filter(item => {
      const status = String(item?.status || '').toLowerCase();
      const participantId = String(item?.userId ?? item?.user_id ?? '');
      return participantId && participantId !== String(session.userId) && status !== 'cancelled' && status !== 'rejected';
    });

    if (activeParticipants.length === 0) {
      Alert.alert('Info', 'Todavia no hay capitanes confirmados o pendientes para avisar.');
      return;
    }

    try {
      setBroadcastingRegatta(true);
      let sentCount = 0;
      const messageText = [
        `🏁 Actualizacion de regata: ${trip.title || 'Regata'}`,
        `${trip.origin} -> ${trip.destination}`,
        `Fecha: ${trip.departureDate}`,
        'Consulta el detalle en BarcoStop para ver novedades.',
      ].join('\n');

      for (const participant of activeParticipants) {
        const participantId = String(participant?.userId ?? participant?.user_id ?? '');
        const convo = await messageService.createOrGetConversation({
          userId1: session.userId,
          userId2: participantId,
          tripId: trip.id,
        });
        await messageService.sendMessage({
          conversationId: convo.id,
          senderId: session.userId,
          content: messageText,
        });
        sentCount += 1;
      }

      Alert.alert('Aviso enviado', `Se ha notificado a ${sentCount} capitan(es).`);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No pudimos avisar a los capitanes de la regata'));
    } finally {
      setBroadcastingRegatta(false);
    }
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
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      setLoadError('No se encontró el viaje.');
      return;
    }
    try {
      setLoadError(null);
      const data = await tripService.getById(tripId);
      setTrip(data);
      // Cargar ratings del capitán
      if (data?.patron?.id) {
        const response = await ratingService.getRatings(data.patron.id);
        if (Array.isArray(response)) {
          setRatings(response);
        } else if (response && 'ratings' in response) {
          setRatings(response.ratings);
        }
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      setTrip(null);
      setLoadError(getErrorMessage(error, 'No pudimos cargar los detalles del viaje'));
    } finally {
      setLoading(false);
    }
  };

  const loadUserReservation = async () => {
    if (!session?.userId || !tripId) {
      setUserReservation(null);
      return;
    }

    try {
      const reservations = await reservationService.getUserReservations(session.userId);
      const current = Array.isArray(reservations)
        ? reservations.find(item => String(item?.tripId ?? item?.trip_id ?? '') === String(tripId))
        : null;
      setUserReservation(current || null);
    } catch (error) {
      console.warn('Error loading user reservation for trip:', error);
      setUserReservation(null);
    }
  };

  const loadRegattaParticipants = async () => {
    if (!trip?.id || !isRegatta) {
      setRegattaParticipants([]);
      return;
    }

    try {
      const reservations = await reservationService.getTripReservations(trip.id);
      setRegattaParticipants(Array.isArray(reservations) ? reservations : []);
    } catch (error) {
      console.warn('Error loading regatta participants:', error);
      setRegattaParticipants([]);
    }
  };

  const loadRegattaChat = async (showLoader = false) => {
    if (!trip?.id || !session?.userId || !canAccessRegattaChat) {
      setRegattaConversationId('');
      setRegattaChatParticipants([]);
      setRegattaMessages([]);
      setRegattaChatError('');
      return;
    }

    try {
      if (showLoader) {
        setRegattaChatLoading(true);
      }
      const [chatState, messages] = await Promise.all([
        messageService.getRegattaChatState(trip.id, session.userId),
        messageService.getRegattaMessages(trip.id, session.userId),
      ]);
      setRegattaConversationId(String(chatState?.conversationId || ''));
      setRegattaChatParticipants(Array.isArray(chatState?.participants) ? chatState.participants : []);
      setRegattaMessages(Array.isArray(messages) ? messages : []);
      setRegattaChatError('');
    } catch (error) {
      const resolvedMessage = getErrorMessage(error, 'No pudimos cargar el chat de la regata');
      setRegattaConversationId('');
      setRegattaChatError(resolvedMessage);
      setRegattaMessages([]);
      setRegattaChatParticipants([]);
    } finally {
      if (showLoader) {
        setRegattaChatLoading(false);
      }
    }
  };

  const handleSendRegattaMessage = async () => {
    const trimmedMessage = regattaChatDraft.trim();
    if (!trip?.id || !session?.userId || !trimmedMessage) {
      return;
    }

    try {
      setRegattaChatSending(true);
      const created = await messageService.sendRegattaMessage(trip.id, {
        userId: session.userId,
        content: trimmedMessage,
      });
      appendUniqueRegattaMessage(created);
      setRegattaChatDraft('');
      setRegattaChatError('');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No pudimos enviar el mensaje al chat de la regata'));
    } finally {
      setRegattaChatSending(false);
    }
  };

  const updateRegattaParticipantStatus = async (reservationId: string, status: 'confirmed' | 'cancelled') => {
    try {
      setUpdatingParticipantId(reservationId);
      await reservationService.updateReservation(reservationId, status);
      await loadRegattaParticipants();
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No pudimos actualizar el estado del capitan'));
    } finally {
      setUpdatingParticipantId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    setTrip(null);
    setLoadError(null);
    loadTrip();
    loadCheckpoints();
  }, [tripId]);

  useEffect(() => {
    loadUserReservation();
  }, [tripId, session?.userId]);

  useEffect(() => {
    loadRegattaParticipants();
  }, [trip?.id, isTripOwner, isRegatta]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setIsAppActive(nextState === 'active');
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    loadRegattaChat(true);
  }, [trip?.id, session?.userId, canAccessRegattaChat, isFocused]);

  useEffect(() => {
    if (!canAccessRegattaChat || !trip?.id || !session?.userId || !isFocused || !isAppActive) {
      return;
    }

    const timer = setInterval(() => {
      loadRegattaChat(false);
    }, REGATTA_CHAT_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [trip?.id, session?.userId, canAccessRegattaChat, isFocused, isAppActive]);

  useEffect(() => {
    if (!regattaConversationId || !canAccessRegattaChat || !isFocused || !isAppActive) {
      return;
    }

    let unsubscribe = () => {};
    let disposed = false;

    messageService.subscribeToConversationMessages(regattaConversationId, appendUniqueRegattaMessage)
      .then(cleanup => {
        if (disposed) {
          cleanup();
          return;
        }
        unsubscribe = cleanup;
      })
      .catch(() => {});

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [appendUniqueRegattaMessage, canAccessRegattaChat, isAppActive, isFocused, regattaConversationId]);

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
      Alert.alert('✅ Punto guardado', '¿Quieres avisar a los viajeros por chat?', [
        {text: 'No', style: 'cancel'},
        {
          text: 'Sí, avisar',
          onPress: async () => {
            try {
              await notifyTravelersAboutCheckpoint(checkpointType);
            } catch (e) {
              Alert.alert('Error', getErrorMessage(e, 'No pudimos notificar a los viajeros'));
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No pudimos guardar el punto del viaje'));
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

    Alert.alert('Compartir experiencia', 'Elige cómo quieres compartirla.', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'WhatsApp',
        onPress: () => {
          Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`).catch(() => {
            Share.share({message, title: 'Experiencia BarcoStop'}).catch(() => {});
          });
        },
      },
      {
        text: 'Instagram y otras apps',
        onPress: () => {
          Share.share({message, title: 'Experiencia BarcoStop'}).catch(() => {
            Alert.alert('Error', 'No pudimos abrir el menu de compartir.');
          });
        },
      },
    ]);
  };

  const handleRequestSeat = async () => {
    try {
      if (!session?.userId) {
        Alert.alert('Error', 'Debes estar conectado para solicitar un asiento');
        return;
      }

      if (!trip?.id) {
        Alert.alert('Error', 'No pudimos cargar este viaje todavía.');
        return;
      }

      const ownerId = String(trip?.patron?.id ?? trip?.patronId ?? '');
      if (ownerId && String(session.userId) === ownerId) {
        Alert.alert('Información', 'Eres el capitán de este viaje. No puedes solicitar asiento.');
        return;
      }

      if (isRegatta && session?.role !== 'patron') {
        Alert.alert('Información', 'Esta regata es solo para capitanes.');
        return;
      }

      setRequesting(true);

      await reservationService.createReservation({
        tripId: trip.id,
        userId: session.userId,
        seats: 1,
      });

      await loadUserReservation();
      await loadRegattaParticipants();
      await loadRegattaChat(true);
      Alert.alert('Éxito', isRegatta ? 'Te has unido a la regata. El organizador verá tu solicitud.' : 'Se envió tu solicitud al capitán');
    } catch (error) {
      console.error('Error requesting seat:', error);
      Alert.alert('Error', getErrorMessage(error, 'No pudimos enviar tu solicitud'));
    } finally {
      setRequesting(false);
    }
  };

  const handleDonate = () => {
    const amount = 5;
    const fixedAmount = Math.max(2.5, amount);
    setPaypalUrl(buildPayPalMeUrl(fixedAmount, 2.5));
    setPaypalVisible(true);
  };

  const canCancelReservation = ['pending', 'approved', 'confirmed'].includes(String(userReservation?.status || '').toLowerCase());
  const regattaStatusText = isRegatta && userReservation ? getReservationStatusLabel(String(userReservation.status || 'pending')) : null;

  const handleCancelReservation = () => {
    if (!userReservation?.id) return;

    Alert.alert(isRegatta ? 'Salir de la regata' : 'Cancelar reserva', isRegatta ? '¿Seguro que quieres salir de esta regata?' : '¿Seguro que quieres cancelar tu reserva de este viaje?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelingReservation(true);
            await reservationService.updateReservation(String(userReservation.id), 'cancelled');
            await loadUserReservation();
            await loadRegattaParticipants();
            await loadRegattaChat(true);
            Alert.alert('Éxito', isRegatta ? 'Has salido de la regata' : 'Tu reserva ha sido cancelada');
          } catch (error) {
            Alert.alert('Error', getErrorMessage(error, 'No pudimos cancelar la reserva'));
          } finally {
            setCancelingReservation(false);
          }
        },
      },
    ]);
  };

  const shareTrip = () => {
    const message = `Mira este viaje en BarcoStop: ${trip?.title} - De ${trip?.origin} a ${trip?.destination}`;
    Share.share({message, title: trip?.title || 'Viaje en BarcoStop'}).catch(() => {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`).catch(() => {});
    });
  };

  const openRouteInMaps = () => {
    if (!trip) return;
    const departurePort = String(trip.origin || '').trim();
    if (!departurePort) {
      Alert.alert('Mapa', 'No encontramos el puerto de salida de este viaje.');
      return;
    }
    const query = encodeURIComponent(departurePort);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
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
    if (!session?.userId) {
      Alert.alert('Error', 'Debes estar conectado para chatear');
      return;
    }

    if (!trip?.id) {
      Alert.alert('Error', 'No pudimos cargar este viaje todavía.');
      return;
    }

    const otherUserId = String(trip?.patron?.id ?? trip?.patronId ?? '');
    if (!otherUserId) {
      Alert.alert('Error', 'No encontramos el capitán de este viaje todavía.');
      return;
    }

    if (String(session.userId) === otherUserId) {
      Alert.alert('Error', 'No puedes abrir un chat contigo mismo.');
      return;
    }

    try {
      setCreatingChat(true);
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          chatSeed: `${otherUserId}-${Date.now()}`,
          otherUserName: trip?.patron?.name || 'Capitán',
          otherUserId: otherUserId,
          tripId: trip.id,
        },
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      const resolvedMessage = getErrorMessage(error, 'No pudimos iniciar el chat');
      if (/users not found/i.test(resolvedMessage)) {
        Alert.alert('Error', 'No encontramos al usuario del capitán para abrir el chat.');
        return;
      }
      Alert.alert('Error', resolvedMessage);
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
      isRegatta ? 'Cancelar regata' : 'Cancelar viaje',
      isRegatta ? '¿Estás seguro de que quieres cancelar esta regata? Los capitanes inscritos serán notificados.' : '¿Estás seguro de que quieres cancelar este viaje? Los viajeros serán notificados.',
      [
        {text: 'No, mantener', style: 'cancel'},
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelingTrip(true);
              await tripService.cancelWithActor(trip!.id, session?.userId || '');
              Alert.alert('Éxito', isRegatta ? 'La regata ha sido cancelada' : 'El viaje ha sido cancelado');
              navigation.getParent()?.getParent()?.reset({index: 0, routes: [{name: 'Home'}]});
            } catch (error) {
              console.error('Error canceling trip:', error);
              Alert.alert('Error', isRegatta ? 'No pudimos cancelar la regata' : 'No pudimos cancelar el viaje');
            } finally {
              setCancelingTrip(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      'Eliminar viaje',
      '¿Seguro que quieres eliminar este viaje? Esta acción no se puede deshacer.',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingTrip(true);
              await tripService.deleteWithActor(trip!.id, session?.userId || '');
              Alert.alert('Éxito', 'El viaje fue eliminado');
              navigation.navigate('TripListScreen');
            } catch (error) {
              console.error('Error deleting trip:', error);
              Alert.alert('Error', 'No pudimos eliminar el viaje');
            } finally {
              setDeletingTrip(false);
            }
          },
        },
      ],
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
  const timeWindowLabel =
    trip.timeWindow === 'morning'
      ? 'Mañana'
      : trip.timeWindow === 'afternoon'
        ? 'Tarde'
        : trip.timeWindow === 'night'
          ? 'Noche'
          : null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>{trip?.title || 'Viaje sin título'}</Text>
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
          <Text style={styles.route}>{tripOrigin || '¿?'} → {tripDestination || '¿?'}</Text>
        </View>
      </View>

      {/* Info básica */}
      <View style={styles.infoSection}>
        {trip?.boatImageUrl ? (
          <RemoteImage
            uri={trip.boatImageUrl}
            style={styles.tripBoatImage}
            fallbackText="⛵"
            fallbackStyle={styles.tripBoatImageFallback}
            fallbackTextStyle={styles.tripBoatImageFallbackText}
          />
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.label}>📅 {t('tripDetailDeparture')}:</Text>
          <Text style={styles.value}>{timeWindowLabel ? `${tripDepartureDate} · ${timeWindowLabel}` : (tripDepartureDate || 'Sin fecha')}</Text>
        </View>
        {!isRegatta ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>💺 {t('tripDetailSeats')}:</Text>
            <Text style={styles.value}>{trip?.availableSeats ?? '¿?'}</Text>
          </View>
        ) : null}
        {!isRegatta ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>💵 {t('tripDetailPrice')}:</Text>
            <Text style={styles.value}>{typeof trip?.price === 'number' ? (trip.price > 0 ? `${trip.price}€` : '0€ (aporte en tareas)') : '¿?'}</Text>
          </View>
        ) : null}
        {!isRegatta && trip?.price === 0 ? (
          <View style={styles.infoRowContribution}>
            <Text style={styles.label}>🤝 Contribucion:</Text>
            <Text style={styles.valueContribution}>{trip?.contributionType || 'A definir con el capitan'}</Text>
            {trip?.contributionNote ? <Text style={styles.valueContributionNote}>{trip.contributionNote}</Text> : null}
          </View>
        ) : null}
        {trip?.captainNote ? (
          <View style={styles.infoNoteCard}>
            <Text style={styles.infoNoteTitle}>📝 Nota del capitán</Text>
            <Text style={styles.infoNoteText}>{trip.captainNote}</Text>
          </View>
        ) : null}
      </View>

      {/* Mapa simple de ruta (ligero) */}
      <View style={styles.routeMapSection}>
        <Text style={styles.sectionTitle}>🗺️ Ruta rápida</Text>
        <View style={styles.routeMapCard}>
          <View style={styles.routeNodeRow}>
            <View style={styles.routeDot} />
            <Text style={styles.routeNodeText}>{trip?.origin || '¿?'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeNodeRow}>
            <View style={[styles.routeDot, styles.routeDotEnd]} />
            <Text style={styles.routeNodeText}>{trip?.destination || '¿?'}</Text>
          </View>
          <TouchableOpacity style={styles.routeMapBtn} onPress={openRouteInMaps}>
            <Text style={styles.routeMapBtnText}>Abrir en Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Capitán */}
      {trip?.patron && (
        <View style={styles.captainSection}>
          <Text style={styles.sectionTitle}>Capitán</Text>
          <View style={styles.captainCard}>
            <Text style={styles.captainName}>{trip.patron?.name || 'Capitán'}</Text>
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
            {!isTripOwner && !isRegatta ? (
              <View style={styles.travelerActionStack}>
                <TouchableOpacity
                  style={[styles.requestBtnInline, (requesting || Boolean(userReservation)) && styles.requestBtnDisabled]}
                  onPress={handleRequestSeat}
                  disabled={requesting || Boolean(userReservation)}
                >
                  <Text style={styles.requestBtnText}>
                    {requesting
                      ? 'Enviando...'
                      : userReservation
                        ? `📋 ${String(userReservation.status || '').toUpperCase()}`
                        : '✋ Solicitar Asiento'}
                  </Text>
                </TouchableOpacity>
                {canCancelReservation ? (
                  <TouchableOpacity
                    style={[styles.cancelReservationBtn, cancelingReservation && styles.requestBtnDisabled]}
                    onPress={handleCancelReservation}
                    disabled={cancelingReservation}
                  >
                    <Text style={styles.cancelReservationBtnText}>
                      {cancelingReservation ? 'Cancelando...' : 'Cancelar reserva'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            {isRegatta && session?.role === 'patron' && !isTripOwner ? (
              <View style={styles.travelerActionStack}>
                <TouchableOpacity
                  style={[styles.requestBtnInline, (requesting || Boolean(userReservation)) && styles.requestBtnDisabled]}
                  onPress={handleRequestSeat}
                  disabled={requesting || Boolean(userReservation)}
                >
                  <Text style={styles.requestBtnText}>
                    {requesting
                      ? 'Enviando...'
                      : userReservation
                        ? `🏁 ${String(userReservation.status || '').toUpperCase()}`
                        : '⛵ Unirme a la regata'}
                  </Text>
                </TouchableOpacity>
                {canCancelReservation ? (
                  <TouchableOpacity
                    style={[styles.cancelReservationBtn, cancelingReservation && styles.requestBtnDisabled]}
                    onPress={handleCancelReservation}
                    disabled={cancelingReservation}
                  >
                    <Text style={styles.cancelReservationBtnText}>
                      {cancelingReservation ? 'Cancelando...' : 'Salir de la regata'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      )}

      {isRegatta ? (
        <View style={styles.ownerSection}>
          <Text style={styles.sectionTitle}>⛵ Capitanes inscritos</Text>
          <View style={styles.regattaParticipantsCard}>
            <Text style={styles.regattaChatHelperText}>
              Aquí se ve quién se va apuntando a la regata para que todos sepan cuántos capitanes hay inscritos.
            </Text>
            {regattaParticipants.length === 0 ? (
              <Text style={styles.regattaEmptyText}>Aun no se ha unido ningun capitan.</Text>
            ) : (
              regattaParticipants.map(item => {
                const participantId = String(item.userId ?? item.user_id ?? '');
                const participantName = item.userName || item.user_name || 'Capitán';
                const participantStatus = String(item.status || 'pending');
                const isCurrentUser = participantId === String(session?.userId || '');

                return (
                  <View key={`public-${String(item.id ?? participantId)}`} style={styles.regattaPublicParticipantRow}>
                    <View style={styles.regattaParticipantMain}>
                      <Text style={styles.regattaParticipantName}>{isCurrentUser ? `${participantName} (tú)` : participantName}</Text>
                      <Text style={styles.regattaParticipantMeta}>
                        Inscrito: {new Date(item.createdAt || Date.now()).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                    <View style={[styles.regattaStatusPill, {backgroundColor: getReservationStatusColor(participantStatus)}]}>
                      <Text style={styles.regattaStatusPillText}>{getReservationStatusLabel(participantStatus)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      ) : null}

      {isRegatta && isTripOwner ? (
        <View style={styles.ownerSection}>
          <Text style={styles.sectionTitle}>🏁 Capitanes apuntados</Text>
          <View style={styles.regattaParticipantsCard}>
            <TouchableOpacity
              style={[styles.checkpointBtn, styles.regattaBroadcastBtn, broadcastingRegatta && styles.requestBtnDisabled]}
              onPress={notifyRegattaParticipants}
              disabled={broadcastingRegatta}
            >
              <Text style={styles.checkpointBtnText}>{broadcastingRegatta ? 'Avisando...' : '📣 Avisar a todos'}</Text>
            </TouchableOpacity>
            {regattaParticipants.length === 0 ? (
              <Text style={styles.regattaEmptyText}>Aun no se ha unido ningun capitan.</Text>
            ) : (
              regattaParticipants.map(item => (
                <View key={String(item.id)} style={styles.regattaParticipantRow}>
                  <View style={styles.regattaParticipantHeader}>
                    <View style={styles.regattaParticipantMain}>
                      <Text style={styles.regattaParticipantName}>{item.userName || item.user_name || 'Capitán'}</Text>
                      <View style={[styles.regattaStatusPill, {backgroundColor: getReservationStatusColor(String(item.status || 'pending'))}] }>
                        <Text style={styles.regattaStatusPillText}>{getReservationStatusLabel(String(item.status || 'pending'))}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.regattaMiniChatBtn}
                      onPress={() => openChatWithUser(String(item.userId ?? item.user_id ?? ''), item.userName || item.user_name || 'Capitán')}
                    >
                      <Text style={styles.regattaMiniChatText}>💬 Chat</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.regattaParticipantMeta}>Solicitud enviada: {new Date(item.createdAt || Date.now()).toLocaleDateString('es-ES')}</Text>
                  <View style={styles.regattaParticipantActions}>
                    <TouchableOpacity
                      style={[styles.regattaActionBtn, styles.regattaApproveBtn, updatingParticipantId === String(item.id) && styles.requestBtnDisabled]}
                      onPress={() => updateRegattaParticipantStatus(String(item.id), 'confirmed')}
                      disabled={updatingParticipantId === String(item.id)}
                    >
                      <Text style={styles.regattaActionBtnText}>Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.regattaActionBtn, styles.regattaRejectBtn, updatingParticipantId === String(item.id) && styles.requestBtnDisabled]}
                      onPress={() => updateRegattaParticipantStatus(String(item.id), 'cancelled')}
                      disabled={updatingParticipantId === String(item.id)}
                    >
                      <Text style={styles.regattaActionBtnText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      ) : null}

      {isRegatta && !isTripOwner && regattaStatusText ? (
        <View style={styles.ownerSection}>
          <Text style={styles.sectionTitle}>🏁 Estado en la regata</Text>
          <View style={styles.regattaParticipantsCard}>
            <Text style={styles.regattaParticipantName}>{regattaStatusText}</Text>
            <Text style={styles.regattaParticipantMeta}>El organizador puede aceptarte, mantenerte pendiente o retirarte de la salida.</Text>
            {trip?.patron?.name ? (
              <TouchableOpacity style={styles.regattaContactBtn} onPress={() => openChatWithUser(String(trip.patron?.id || trip.patronId || ''), trip.patron?.name || 'Capitán')}>
                <Text style={styles.regattaContactBtnText}>💬 Hablar con el organizador</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      {isRegatta ? (
        <View style={styles.ownerSection}>
          <Text style={styles.sectionTitle}>💬 Chat cerrado de la regata</Text>
          <View style={styles.regattaParticipantsCard}>
            <Text style={styles.regattaChatHelperText}>
              Solo entran el organizador y los capitanes apuntados. Cuando la fecha caduca, el chat se cierra automaticamente.
            </Text>
            {canAccessRegattaChat ? (
              <>
                {regattaChatParticipants.length > 0 ? (
                  <View style={styles.regattaAttendeesWrap}>
                    {regattaChatParticipants.map(participant => (
                      <View key={`${participant.userId}-${participant.reservationId || 'owner'}`} style={styles.regattaAttendeePill}>
                        <Text style={styles.regattaAttendeeText}>{participant.userName}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {regattaChatLoading ? (
                  <View style={styles.regattaChatLoadingBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.regattaChatLoadingText}>Cargando chat...</Text>
                  </View>
                ) : null}
                {regattaChatError ? (
                  <Text style={styles.regattaChatErrorText}>{regattaChatError}</Text>
                ) : null}
                {!regattaChatLoading && !regattaChatError ? (
                  <View style={styles.regattaMessageList}>
                    {regattaMessages.length === 0 ? (
                      <Text style={styles.regattaEmptyText}>Todavia no hay mensajes en el chat privado.</Text>
                    ) : (
                      regattaMessages.map(message => {
                        const isOwnMessage = String(message.senderId || '') === String(session?.userId || '');
                        return (
                          <View key={String(message.id)} style={[styles.regattaMessageBubble, isOwnMessage && styles.regattaMessageBubbleOwn]}>
                            <Text style={styles.regattaMessageAuthor}>{isOwnMessage ? 'Tú' : message.senderName || 'Capitán'}</Text>
                            <Text style={styles.regattaMessageText}>{message.content}</Text>
                            <Text style={styles.regattaMessageDate}>{formatRegattaMessageDate(message.createdAt)}</Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : null}
                {!regattaChatError ? (
                  <View style={styles.regattaComposer}>
                    <TextInput
                      style={styles.regattaComposerInput}
                      value={regattaChatDraft}
                      onChangeText={setRegattaChatDraft}
                      placeholder="Escribe al grupo de capitanes"
                      placeholderTextColor={colors.textSubtle}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.regattaComposerButton, (!regattaChatDraft.trim() || regattaChatSending) && styles.requestBtnDisabled]}
                      onPress={handleSendRegattaMessage}
                      disabled={!regattaChatDraft.trim() || regattaChatSending}
                    >
                      <Text style={styles.regattaComposerButtonText}>{regattaChatSending ? 'Enviando...' : 'Enviar'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.regattaEmptyText}>
                Únete a la regata para entrar en este chat privado con el resto de capitanes.
              </Text>
            )}
          </View>
        </View>
      ) : null}

      {isTripOwner && (
        <View style={styles.ownerSection}>
          <Text style={styles.sectionTitle}>{isRegatta ? 'Gestión de la regata' : 'Gestión del viaje'}</Text>
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
            <TouchableOpacity
              style={[styles.patronActionBtn, styles.deleteBtn]}
              onPress={handleDeleteTrip}
              disabled={deletingTrip}
            >
              <Text style={styles.patronActionBtnText}>
                {deletingTrip ? 'Eliminando...' : '🗑️ Eliminar'}
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

      {!isRegatta ? (
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
      ) : null}

      {/* Botón de donativos */}
      <View style={styles.donateSection}>
        <TouchableOpacity style={styles.donateBtn} onPress={handleDonate}>
          <Text style={styles.donateBtnText}>💝 Apoyar BarcoStop</Text>
        </TouchableOpacity>
        <Text style={styles.donateText}>Tu donativo nos ayuda a crecer</Text>
        <Text style={styles.paymentNoticeText}>
          Nota: el enlace PayPal corresponde a la cuenta configurada para BarcoStop. El pago del viaje debe acordarse
          directamente entre capitán y viajero (o actualizarse manualmente con los datos del capitán).
        </Text>
      </View>

      {/* Home */}
      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => navigation.getParent()?.getParent()?.reset({index: 0, routes: [{name: 'Home'}]})}
      >
        <Text style={styles.homeBtnText}>🏠 {t('goHome')}</Text>
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
  tripBoatImage: {width: '100%', height: 220, borderRadius: 12, marginBottom: 14, backgroundColor: colors.border},
  tripBoatImageFallback: {backgroundColor: '#e0f2fe'},
  tripBoatImageFallbackText: {fontSize: 42},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12},
  infoRowContribution: {marginBottom: 12},
  label: {fontSize: 14, color: colors.textStrong, fontWeight: '600'},
  value: {fontSize: 14, color: '#0c4a6e', fontWeight: 'bold'},
  valueContribution: {fontSize: 14, color: colors.textStrong, fontWeight: '700', marginTop: 2},
  valueContributionNote: {fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 17},
  infoNoteCard: {marginTop: 6, backgroundColor: colors.background, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border},
  infoNoteTitle: {fontSize: 13, fontWeight: '700', color: colors.textStrong, marginBottom: 6},
  infoNoteText: {fontSize: 14, color: colors.text, lineHeight: 20},

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
  travelerActionStack: {marginTop: 10, gap: 8},
  actionBtn: {flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8},
  actionBtnActive: {backgroundColor: '#ec4899'},
  chatBtn: {backgroundColor: '#14b8a6'},
  actionBtnText: {color: colors.white, fontWeight: '600', textAlign: 'center', fontSize: 13},
  requestBtnInline: {backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 8},
  cancelReservationBtn: {backgroundColor: colors.danger, paddingVertical: 12, borderRadius: 8},
  cancelReservationBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center', fontSize: 14},
  patronActions: {flexDirection: 'row', gap: 8, marginTop: 12},
  patronActionBtn: {flex: 1, paddingVertical: 10, borderRadius: 8},
  editBtn: {backgroundColor: '#f59e0b'},
  cancelBtn: {backgroundColor: colors.danger},
  deleteBtn: {backgroundColor: '#7f1d1d'},
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
  donateBtn: {width: '100%', backgroundColor: '#003087', paddingVertical: 12, borderRadius: 8},
  donateBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center', fontSize: 16},
  donateText: {fontSize: 12, color: '#78909c', marginTop: 6},
  paymentNoticeText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    textAlign: 'center',
  },
  requestBtnDisabled: {opacity: 0.6},
  regattaParticipantsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  regattaBroadcastBtn: {marginBottom: 12},
  regattaParticipantRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  regattaParticipantHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  regattaParticipantMain: {flex: 1},
  regattaParticipantName: {color: colors.textStrong, fontWeight: '700', fontSize: 14},
  regattaParticipantMeta: {color: colors.textSubtle, fontSize: 12, marginTop: 2},
  regattaStatusPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  regattaStatusPillText: {color: colors.white, fontWeight: '700', fontSize: 11},
  regattaMiniChatBtn: {
    backgroundColor: colors.primaryAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  regattaMiniChatText: {color: colors.white, fontWeight: '700', fontSize: 12},
  regattaParticipantActions: {flexDirection: 'row', gap: 8, marginTop: 10},
  regattaPublicParticipantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  regattaActionBtn: {flex: 1, borderRadius: 8, paddingVertical: 9},
  regattaApproveBtn: {backgroundColor: colors.success},
  regattaRejectBtn: {backgroundColor: colors.danger},
  regattaActionBtnText: {color: colors.white, textAlign: 'center', fontWeight: '700', fontSize: 12},
  regattaContactBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  regattaContactBtnText: {color: colors.white, textAlign: 'center', fontWeight: '700'},
  regattaEmptyText: {color: colors.textSubtle},
  regattaChatHelperText: {color: colors.textSubtle, fontSize: 12, lineHeight: 18, marginBottom: 12},
  regattaAttendeesWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  regattaAttendeePill: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  regattaAttendeeText: {color: colors.primary, fontWeight: '700', fontSize: 12},
  regattaChatLoadingBox: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  regattaChatLoadingText: {color: colors.textSubtle},
  regattaChatErrorText: {
    color: colors.danger,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  regattaMessageList: {gap: 10, marginBottom: 12},
  regattaMessageBubble: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regattaMessageBubbleOwn: {backgroundColor: '#e0f2fe', borderColor: '#bfdbfe'},
  regattaMessageAuthor: {fontSize: 12, fontWeight: '700', color: colors.textStrong, marginBottom: 4},
  regattaMessageText: {fontSize: 14, color: colors.text, lineHeight: 20},
  regattaMessageDate: {fontSize: 11, color: colors.textSubtle, marginTop: 6},
  regattaComposer: {gap: 10},
  regattaComposerInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 74,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
    color: colors.text,
  },
  regattaComposerButton: {backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12},
  regattaComposerButtonText: {color: colors.white, textAlign: 'center', fontWeight: '700'},
  requestBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center', fontSize: 16},

  homeBtn: {marginHorizontal: 16, marginTop: 8, backgroundColor: '#94a3b8', paddingVertical: 12, borderRadius: 8},
  homeBtnText: {color: colors.white, fontWeight: '600', textAlign: 'center', fontSize: 14},

  errorIcon: {fontSize: 64, marginBottom: 16},
  errorTitle: {fontSize: 20, fontWeight: '700', color: '#334155', marginBottom: 8, textAlign: 'center'},
});
