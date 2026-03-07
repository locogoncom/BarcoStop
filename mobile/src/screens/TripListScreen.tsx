import {useNavigation, useFocusEffect} from '@react-navigation/native';
import React, {useEffect, useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput} from 'react-native';
import {tripService, ratingService, reservationService, favoriteService} from '../services/api';
import type {Trip} from '../types';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {RatingStars} from '../components/RatingStars';
import {RatingModal} from '../components/RatingModal';
type TripListNavigationProp = any;

export default function TripListScreen() {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const {t, language} = useLanguage();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [reservingTripId, setReservingTripId] = useState<string | null>(null);
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [favoriteUserIds, setFavoriteUserIds] = useState<string[]>([]);
  const [savingFavoriteUserId, setSavingFavoriteUserId] = useState<string | null>(null);

  const toIsoDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadTrips = async () => {
    try {
      const data = await tripService.getAll();
      // Asegurar que data es un array válido
      if (Array.isArray(data)) {
        setTrips(data);
        setError(null);
      } else {
        console.warn('Invalid trips data:', data);
        setTrips([]);
        setError(t('tripListLoadError'));
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setTrips([]);
      setError(t('tripListLoadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserReservations = async () => {
    if (!session?.userId) return;
    try {
      const reservations = await reservationService.getUserReservations(session.userId);
      setUserReservations(reservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const loadFavorites = async () => {
    if (!session?.userId) {
      setFavoriteUserIds([]);
      return;
    }

    try {
      const favorites = await favoriteService.getUserFavorites(session.userId);
      const ids = Array.isArray(favorites)
        ? favorites.map(f => String(f.id ?? '')).filter(Boolean)
        : [];
      setFavoriteUserIds(ids);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavoriteUserIds([]);
    }
  };

  const toggleFavorite = async (favoriteUserId: string) => {
    if (!session?.userId || !favoriteUserId) return;

    const isFavorite = favoriteUserIds.includes(favoriteUserId);
    try {
      setSavingFavoriteUserId(favoriteUserId);
      if (isFavorite) {
        await favoriteService.removeFavorite(session.userId, favoriteUserId);
        setFavoriteUserIds(prev => prev.filter(id => id !== favoriteUserId));
      } else {
        await favoriteService.addFavorite(session.userId, favoriteUserId);
        setFavoriteUserIds(prev => [...prev, favoriteUserId]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar favorito');
    } finally {
      setSavingFavoriteUserId(null);
    }
  };

  const getUserReservationForTrip = (tripId: string) => {
    return userReservations.find(r => r.tripId === tripId || r.trip_id === tripId);
  };

  const handleCreateReservation = async (tripId: string) => {
    if (!session?.userId) {
      Alert.alert('Error', 'Debes estar conectado');
      return;
    }

    try {
      setReservingTripId(tripId);
      const result = await reservationService.createReservation({
        tripId,
        userId: session.userId,
        seats: 1,
      });
      Alert.alert('Éxito', 'Tu reserva ha sido enviada al capitán');
      await loadUserReservations();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al crear la reserva';
      Alert.alert('Error', errorMsg);
    } finally {
      setReservingTripId(null);
    }
  };

  const handleMarkComplete = (trip: Trip) => {
    if (!session?.userId) return;
    setSelectedTrip(trip);
    setShowRatingModal(true);
  };

  const isTripOwner = (trip: Trip) => {
    const sessionId = String(session?.userId ?? '');
    const ownerId = String(trip?.patronId ?? trip?.patron?.id ?? '');
    return Boolean(sessionId && ownerId && sessionId === ownerId);
  };

  const handleEditTrip = (trip: Trip) => {
    navigation.navigate('CreateTrip', {
      tripId: trip.id,
      isEditing: true,
      trip,
    });
  };

  const handleCancelTrip = (trip: Trip) => {
    Alert.alert(
      'Eliminar viaje',
      '¿Seguro que quieres cancelar este viaje? Esta acción lo dejará inactivo para reservas.',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.cancelWithActor(trip.id, session?.userId || '');
              Alert.alert('Éxito', 'Viaje cancelado correctamente');
              await loadTrips();
            } catch (error) {
              console.error('Error canceling trip from list:', error);
              Alert.alert('Error', 'No se pudo cancelar el viaje');
            }
          },
        },
      ],
    );
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!selectedTrip || !session?.userId) return;
    
    setRatingLoading(true);
    try {
      // Enviar calificación
      await ratingService.submitRating({
        userId: selectedTrip.patronId,
        ratedBy: session.userId,
        rating,
        comment,
      });
      
      Alert.alert('Éxito', 'Calificación enviada correctamente');
      setShowRatingModal(false);
      setSelectedTrip(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'No se pudo enviar la calificación');
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
      loadUserReservations();
      loadFavorites();
    }, [])
  );

  const filteredTrips = trips.filter(trip => {
    const byOrigin = searchOrigin.trim().length === 0
      || trip.origin.toLowerCase().includes(searchOrigin.trim().toLowerCase());
    const byDestination = searchDestination.trim().length === 0
      || trip.destination.toLowerCase().includes(searchDestination.trim().toLowerCase());
    const byDate = searchDate.trim().length === 0
      || trip.departureDate.includes(searchDate.trim());
    return byOrigin && byDestination && byDate;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        {session?.role === 'patron' ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateTrip', {patronId: session.userId} as any)}>
            <Text style={styles.actionText}>{t('tripListCreate')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.actionBtn, styles.profileBtn]} onPress={() => navigation.getParent()?.navigate('Profile')}>
          <Text style={styles.actionText}>{t('tripListProfile')}</Text>
        </TouchableOpacity>
      </View>

      {session?.role === 'viajero' && (
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>🔎 Buscar viaje</Text>
          <TextInput
            value={searchOrigin}
            onChangeText={setSearchOrigin}
            placeholder="Origen"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          <TextInput
            value={searchDestination}
            onChangeText={setSearchDestination}
            placeholder="Destino"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          <TextInput
            value={searchDate}
            onChangeText={setSearchDate}
            placeholder="Fecha (ej: 2026-03-06)"
            placeholderTextColor="#94a3b8"
            keyboardType="numbers-and-punctuation"
            style={styles.searchInput}
          />
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={styles.quickDateBtn}
              onPress={() => setSearchDate(toIsoDate(new Date()))}
            >
              <Text style={styles.quickDateText}>Hoy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickDateBtn}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSearchDate(toIsoDate(tomorrow));
              }}
            >
              <Text style={styles.quickDateText}>Mañana</Text>
            </TouchableOpacity>
          </View>
          {(searchOrigin || searchDestination || searchDate) ? (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => {
                setSearchOrigin('');
                setSearchDestination('');
                setSearchDate('');
              }}
            >
              <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t('tripListAvailable')}</Text>
        <Text style={styles.summaryCount}>{filteredTrips.length}</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadTrips}>
            <Text style={styles.errorAction}>{t('tripListRetry')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={filteredTrips}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTrips(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚢</Text>
            <Text style={styles.emptyTitle}>{t('tripListEmptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('tripListEmptyText')}</Text>
          </View>
        }
        renderItem={({item}) => {
          const formatDate = (date: string, time?: string) => {
            if (!date) return t('tripListDateMissing');
            const d = new Date(date + 'T00:00:00');
            const locale = language === 'en' ? 'en-GB' : language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-PT' : 'es-ES';
            const dateStr = d.toLocaleDateString(locale, {day: '2-digit', month: 'short'});
            return time ? `${dateStr} · ${time.slice(0,5)}` : dateStr;
          };
          return (
            <View style={styles.cardWrap}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TripDetail', {tripId: item.id, role: session?.role} as any)}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.title}>{item.title}</Text>
                {session?.role === 'viajero' && item.patronId ? (
                  <TouchableOpacity
                    style={styles.favoriteIconBtn}
                    onPress={(e: any) => {
                      e?.stopPropagation?.();
                      toggleFavorite(String(item.patronId));
                    }}
                    disabled={savingFavoriteUserId === String(item.patronId)}
                  >
                    <Text style={styles.favoriteIconText}>
                      {favoriteUserIds.includes(String(item.patronId)) ? '❤️' : '🤍'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.meta}>📍 {item.origin} → {item.destination}</Text>
              <Text style={styles.meta}>🕒 {formatDate(item.departureDate, item.departureTime)}</Text>
              
              {/* Información del Patrón */}
              {item.patron && (
                <View style={styles.patronInfo}>
                  <View>
                    <Text style={styles.patronName}>👤 {item.patron.name}</Text>
                    <View style={styles.boatInfoRow}>
                      {item.patron.boatName && (
                        <Text style={styles.boatInfo}>⛵ {item.patron.boatName}</Text>
                      )}
                      {session?.role === 'viajero' && item.patronId ? (
                        <TouchableOpacity
                          style={styles.inlineFavoriteBtn}
                          onPress={(e: any) => {
                            e?.stopPropagation?.();
                            toggleFavorite(String(item.patronId));
                          }}
                          disabled={savingFavoriteUserId === String(item.patronId)}
                        >
                          <Text style={styles.inlineFavoriteText}>
                            {favoriteUserIds.includes(String(item.patronId)) ? '❤️' : '🤍'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  <RatingStars 
                    rating={item.patron.averageRating || 0}
                    size="sm"
                  />
                </View>
              )}
              
              <View style={styles.footer}>
                <View>
                  <Text style={styles.seats}>👥 {item.availableSeats} {t('tripListSeats')}</Text>
                  <Text style={styles.price}>{item.price}€</Text>
                </View>
                {session?.role === 'viajero' && (
                  <>
                    {item.availableSeats > 0 ? (
                      <TouchableOpacity 
                        style={[styles.reserveBtn, getUserReservationForTrip(item.id) && styles.reservedBtn]}
                        onPress={() => {
                          const res = getUserReservationForTrip(item.id);
                          if (res) {
                            Alert.alert('Estado', `Tu solicitud está: ${res.status}`);
                          } else {
                            handleCreateReservation(item.id);
                          }
                        }}
                        disabled={reservingTripId === item.id}
                      >
                        <Text style={styles.reserveBtnText}>
                          {reservingTripId === item.id 
                            ? '⏳ Enviando...'
                            : getUserReservationForTrip(item.id) 
                            ? `📋 ${getUserReservationForTrip(item.id).status}` 
                            : '✋ Reservar'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.fullBtn}>
                        <Text style={styles.fullBtnText}>⛔ Completo</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </TouchableOpacity>

            {session?.role === 'patron' && isTripOwner(item) && (
              <View style={styles.ownerActions}>
                <TouchableOpacity
                  style={[styles.ownerBtn, styles.editOwnerBtn]}
                  onPress={() => handleEditTrip(item)}
                >
                  <Text style={styles.ownerBtnText}>🖊️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ownerBtn, styles.deleteOwnerBtn]}
                  onPress={() => handleCancelTrip(item)}
                >
                  <Text style={styles.ownerBtnText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          );
        }}
      />
      
      {selectedTrip && selectedTrip.patron && (
        <RatingModal
          visible={showRatingModal}
          userName={selectedTrip.patron.name}
          role="captain"
          onSubmit={handleSubmitRating}
          onCancel={() => {
            setShowRatingModal(false);
            setSelectedTrip(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8fafc', padding: 16},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  topActions: {flexDirection: 'row', gap: 10, marginBottom: 12},
  actionBtn: {backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8},
  profileBtn: {backgroundColor: '#0ea5e9'},
  actionText: {color: '#fff', fontWeight: '700'},
  summaryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {color: '#334155', fontWeight: '600'},
  summaryCount: {color: '#0284c7', fontWeight: '800', fontSize: 20},
  searchCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  searchTitle: {color: '#0f172a', fontWeight: '700', marginBottom: 8},
  searchInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0f172a',
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  quickDateRow: {flexDirection: 'row', gap: 8, marginBottom: 8},
  quickDateBtn: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  quickDateText: {color: '#0369a1', fontWeight: '700', fontSize: 12},
  clearSearchBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  clearSearchText: {color: '#334155', fontWeight: '600', fontSize: 12},
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {color: '#991b1b', flex: 1, marginRight: 12},
  errorAction: {color: '#b91c1c', fontWeight: '700'},
  cardWrap: {marginBottom: 10},
  card: {backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0'},
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginHorizontal: 2,
  },
  ownerBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 9,
  },
  editOwnerBtn: {backgroundColor: '#0284c7'},
  deleteOwnerBtn: {backgroundColor: '#ef4444'},
  ownerBtnText: {color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 13},
  title: {fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 6},
  cardHeaderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10},
  favoriteIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  favoriteIconText: {fontSize: 18},
  meta: {marginTop: 3, color: '#64748b', fontSize: 14},
  patronInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  patronName: {color: '#475569', fontSize: 14, fontWeight: '600'},
  boatInfoRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2},
  boatInfo: {color: '#94a3b8', fontSize: 12, marginTop: 2},
  inlineFavoriteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inlineFavoriteText: {fontSize: 14},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8},
  seats: {color: '#475569', fontSize: 14},
  price: {fontSize: 18, fontWeight: '700', color: '#0284c7'},
  completeBtn: {backgroundColor: '#0284c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6},
  completeBtnText: {color: '#fff', fontWeight: '600', fontSize: 13},
  reserveBtn: {backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6},
  reserveBtnText: {color: '#fff', fontWeight: '600', fontSize: 13},
  reservedBtn: {backgroundColor: '#10b981'},
  fullBtn: {backgroundColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6},
  fullBtnText: {color: '#6b7280', fontWeight: '600', fontSize: 13},
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60},
  emptyIcon: {fontSize: 64, marginBottom: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6},
  emptyText: {fontSize: 14, color: '#94a3b8', textAlign: 'center'},
});
