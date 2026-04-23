import {useNavigation, useFocusEffect} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput, Image} from 'react-native';
import {tripService, ratingService, reservationService, favoriteService} from '../services/api';
import {RemoteImage} from '../components/RemoteImage';
import type {Trip} from '../types';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {RatingStars} from '../components/RatingStars';
import {RatingModal} from '../components/RatingModal';
import {colors} from '../theme/colors';
type TripListNavigationProp = any;

export default function TripListScreen() {
  const navigation = useNavigation<any>();
  const {session, logout} = useAuth();
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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [favoriteUserIds, setFavoriteUserIds] = useState<string[]>([]);
  const [savingFavoriteUserId, setSavingFavoriteUserId] = useState<string | null>(null);
  const [ratedUserIds, setRatedUserIds] = useState<Set<string>>(new Set());

  const goToHome = () => {
    const rootNav = navigation.getParent()?.getParent?.() || navigation.getParent?.() || navigation;
    rootNav.reset({
      index: 0,
      routes: [{name: 'MainApp', state: {index: 0, routes: [{name: 'Trips'}]}}],
    });
  };

  const onLogout = () => {
    Alert.alert(t('profileLogoutTitle'), t('profileLogoutMessage'), [
      {text: t('profileCancel'), style: 'cancel'},
      {
        text: t('profileConfirm'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          const rootNav = navigation.getParent()?.getParent?.() || navigation.getParent?.() || navigation;
          rootNav.reset({
            index: 0,
            routes: [{name: 'Home'}],
          });
        },
      },
    ]);
  };

  const toIsoDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadTrips = async () => {
    try {
      const data = await tripService.getAll();
      if (Array.isArray(data)) {
        setTrips(data);
        // Solo limpiar el error si realmente hay viajes
        if (data.length > 0) {
          setError(null);
        }
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

  const loadGivenRatings = async () => {
    if (!session?.userId) {
      setRatedUserIds(new Set());
      return;
    }

    try {
      const ratings = await ratingService.getRatingsByUser(session.userId);
      const ids = Array.isArray(ratings)
        ? ratings.map(r => String((r as any).userId ?? '')).filter(Boolean)
        : [];
      setRatedUserIds(new Set(ids));
    } catch (error) {
      console.error('Error loading given ratings:', error);
      setRatedUserIds(new Set());
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

  const canRateTrip = (tripId: string) => {
    const reservation = getUserReservationForTrip(tripId);
    if (!reservation) return false;
    const status = String(reservation.status || '').toLowerCase();
    return status === 'approved' || status === 'confirmed' || status === 'completed';
  };

  const hasAlreadyRatedCaptain = (captainId?: string) => {
    const id = String(captainId ?? '');
    return Boolean(id && ratedUserIds.has(id));
  };

  const canCancelReservation = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    return normalized === 'pending' || normalized === 'approved' || normalized === 'confirmed';
  };

  const handleCancelReservation = async (reservationId: string) => {
    Alert.alert('Cancelar reserva', '¿Seguro que quieres cancelar esta reserva?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await reservationService.updateReservation(reservationId, 'cancelled');
            Alert.alert('Éxito', 'Reserva cancelada correctamente');
            await loadUserReservations();
            await loadTrips();
          } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'No se pudo cancelar la reserva';
            Alert.alert('Error', errorMsg);
          }
        },
      },
    ]);
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

  const handleDeleteTrip = (trip: Trip) => {
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
              await tripService.deleteWithActor(trip.id, session?.userId || '');
              Alert.alert('Éxito', 'Viaje eliminado correctamente');
              await loadTrips();
            } catch (error) {
              console.error('Error deleting trip from list:', error);
              Alert.alert('Error', 'No se pudo eliminar el viaje');
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
      const backendMessage = (error as any)?.response?.data?.error;
      Alert.alert('Error', backendMessage || 'No se pudo enviar la calificación');
    } finally {
      setRatingLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      const loadScreenData = async () => {
        await Promise.all([
          loadTrips(),
          session?.userId ? loadUserReservations() : Promise.resolve(),
          session?.userId ? loadFavorites() : Promise.resolve(),
          session?.role === 'viajero' ? loadGivenRatings() : Promise.resolve(),
        ]);
      };

      loadScreenData();
    }, [session?.role, session?.userId])
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.homeBtn]} onPress={goToHome}>
          <Text style={styles.actionText}>🏠 {t('goHome')}</Text>
        </TouchableOpacity>
        {session?.role === 'patron' ? (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateTrip', {patronId: session.userId, tripKind: 'trip'} as any)}>
              <Text style={styles.actionText}>{t('tripListCreate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.regattaBtn]} onPress={() => navigation.navigate('CreateTrip', {patronId: session.userId, tripKind: 'regatta'} as any)}>
              <Text style={styles.actionText}>{t('tripListCreateRegatta')}</Text>
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity style={[styles.actionBtn, styles.profileBtn]} onPress={() => navigation.getParent()?.navigate('Profile')}>
          <Text style={styles.actionText}>{t('tripListProfile')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.exitBtn]} onPress={onLogout}>
          <Text style={styles.actionText}>🚪 {t('profileLogout')}</Text>
        </TouchableOpacity>
      </View>

      {session?.role === 'viajero' && (
        <View style={styles.searchCard}>
          <View style={styles.searchHeaderRow}>
            <Text style={styles.searchTitle}>🔎 Buscar viaje</Text>
            {searchExpanded ? (
              <TouchableOpacity
                style={styles.searchCollapseBtn}
                onPress={() => {
                  if (!searchOrigin.trim() && !searchDestination.trim() && !searchDate.trim()) {
                    setSearchExpanded(false);
                  }
                }}
              >
                <Text style={styles.searchCollapseBtnText}>Ocultar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.originCompactWrap, searchExpanded && styles.originCompactWrapExpanded]}
            onPress={() => setSearchExpanded(true)}
          >
            <Text style={styles.originCompactLabel}>⚓ {t('tripListSearchPortButton')}</Text>
            <TextInput
              value={searchOrigin}
              onFocus={() => setSearchExpanded(true)}
              onChangeText={(value) => {
                setSearchOrigin(value);
                if (value.trim().length > 0) {
                  setSearchExpanded(true);
                } else if (!searchDestination.trim() && !searchDate.trim()) {
                  setSearchExpanded(false);
                }
              }}
              placeholder={t('tripListSearchOriginPlaceholder')}
              placeholderTextColor={colors.textSubtle}
              style={styles.originCompactInput}
            />
          </TouchableOpacity>
          {!searchExpanded ? <Text style={styles.searchHint}>{t('tripListSearchHint')}</Text> : null}
          {searchExpanded ? (
            <>
              <TextInput
                value={searchDestination}
                onChangeText={setSearchDestination}
                placeholder={t('tripListSearchDestinationPlaceholder')}
                placeholderTextColor={colors.textSubtle}
                style={styles.searchInput}
              />
              <TextInput
                value={searchDate}
                onChangeText={setSearchDate}
                placeholder={t('tripListSearchDatePlaceholder')}
                placeholderTextColor={colors.textSubtle}
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
            </>
          ) : null}
          {(searchOrigin || searchDestination || searchDate) ? (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => {
                setSearchOrigin('');
                setSearchDestination('');
                setSearchDate('');
                setSearchExpanded(false);
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

      {/* Solo mostrar error si no hay viajes cargados y la carga falló */}
      {error && (!trips || trips.length === 0) ? (
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
          const timeWindowLabel = (windowValue?: string) => {
            if (windowValue === 'morning') return 'Mañana';
            if (windowValue === 'afternoon') return 'Tarde';
            if (windowValue === 'night') return 'Noche';
            return '';
          };

          const formatDate = (date: string, time?: string) => {
            if (!date) return t('tripListDateMissing');
            const d = new Date(date + 'T00:00:00');
            const locale = language === 'en' ? 'en-GB' : language === 'fr' ? 'fr-FR' : language === 'pt' ? 'pt-PT' : 'es-ES';
            const dateStr = d.toLocaleDateString(locale, {day: '2-digit', month: 'short'});
            const windowText = timeWindowLabel(item.timeWindow);
            if (windowText) return `${dateStr} · ${windowText}`;
            return dateStr;
          };
          return (
            <View style={styles.cardWrap}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TripDetail', {tripId: item.id, role: session?.role} as any)}>
              {item.tripKind === 'regatta' ? (
                <View style={styles.tripKindBadge}>
                  <Text style={styles.tripKindBadgeText}>🏁 {t('tripKindRegatta')}</Text>
                </View>
              ) : null}
              {item.boatImageUrl ? (
                <RemoteImage
                  uri={item.boatImageUrl}
                  style={styles.cardBoatImage}
                  fallbackText="⛵"
                  fallbackStyle={styles.cardBoatImageFallback}
                  fallbackTextStyle={styles.cardBoatImageFallbackText}
                />
              ) : null}
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
              <Text style={styles.meta}>🕒 {formatDate(item.departureDate)}</Text>
              {item.captainNote ? <Text style={styles.captainNote}>{item.captainNote}</Text> : null}
              
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
                  <TouchableOpacity
                    style={styles.ratingPressable}
                    onPress={(e: any) => {
                      e?.stopPropagation?.();

                      if (session?.role !== 'viajero') {
                        Alert.alert('Información', 'La calificación está disponible para viajeros.');
                        return;
                      }

                      if (!canRateTrip(item.id)) {
                        Alert.alert(
                          'No disponible aún',
                          'Podrás puntuar al capitán cuando tu reserva esté aceptada o completada.',
                        );
                        return;
                      }

                      if (hasAlreadyRatedCaptain(item.patronId)) {
                        Alert.alert('Ya calificado', 'Ya has calificado a este capitán.');
                        return;
                      }

                      handleMarkComplete(item);
                    }}
                  >
                    <RatingStars 
                      rating={item.patron.averageRating || 0}
                      size="sm"
                    />
                    {session?.role === 'viajero' ? (
                      <Text style={styles.ratingHint}>Toca estrellas para puntuar</Text>
                    ) : null}
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.footer}>
                <View>
                  <Text style={styles.seats}>👥 {item.availableSeats} {t('tripListSeats')}</Text>
                  {item.price > 0 ? (
                    <Text style={styles.price}>{item.price}€</Text>
                  ) : (
                    <>
                      <Text style={styles.priceFree}>0€ · Aporte en tareas</Text>
                      <Text style={styles.priceContribution}>{item.contributionType || 'Contribucion a acordar'}</Text>
                    </>
                  )}
                </View>
                {!isTripOwner(item) && (
                  <>
                    {item.tripKind === 'regatta' ? (
                      <View style={styles.fullBtn}>
                        <Text style={styles.fullBtnText}>🏁 Regata sin plazas de marinería</Text>
                      </View>
                    ) : item.availableSeats > 0 ? (
                      <View style={styles.reservationActions}>
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
                        {(() => {
                          const reservation = getUserReservationForTrip(item.id);
                          if (!reservation || !canCancelReservation(reservation.status)) {
                            return null;
                          }
                          return (
                            <TouchableOpacity
                              style={styles.cancelReservationBtn}
                              onPress={() => handleCancelReservation(String(reservation.id))}
                            >
                              <Text style={styles.cancelReservationBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                          );
                        })()}
                      </View>
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
                  onPress={() => handleDeleteTrip(item)}
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
  container: {flex: 1, backgroundColor: colors.background, padding: 16},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  topActions: {flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap'},
  actionBtn: {backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8},
  homeBtn: {backgroundColor: colors.textStrong},
  regattaBtn: {backgroundColor: colors.accent},
  profileBtn: {backgroundColor: colors.primaryAlt},
  exitBtn: {backgroundColor: colors.danger},
  actionText: {color: colors.white, fontWeight: '700'},
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {color: colors.textStrong, fontWeight: '600'},
  summaryCount: {color: colors.primary, fontWeight: '800', fontSize: 20},
  searchCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchHeaderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  searchTitle: {color: colors.text, fontWeight: '700', fontSize: 14},
  searchCollapseBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchCollapseBtnText: {color: colors.textStrong, fontWeight: '700', fontSize: 11},
  originCompactWrap: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    marginBottom: 4,
  },
  originCompactWrapExpanded: {
    marginBottom: 8,
  },
  originCompactLabel: {color: colors.textSubtle, fontSize: 11, fontWeight: '700', marginBottom: 2},
  originCompactInput: {
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchHint: {color: colors.textSubtle, fontSize: 11, marginBottom: 2},
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    marginBottom: 8,
    backgroundColor: colors.background,
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
  clearSearchText: {color: colors.textStrong, fontWeight: '600', fontSize: 12},
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
  card: {backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border},
  tripKindBadge: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tripKindBadgeText: {color: '#166534', fontWeight: '700', fontSize: 12},
  cardBoatImage: {width: '100%', height: 170, borderRadius: 10, marginBottom: 12, backgroundColor: colors.border},
  cardBoatImageFallback: {backgroundColor: '#e0f2fe'},
  cardBoatImageFallbackText: {fontSize: 40},
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
  editOwnerBtn: {backgroundColor: colors.primary},
  deleteOwnerBtn: {backgroundColor: colors.danger},
  ownerBtnText: {color: colors.white, fontWeight: '700', textAlign: 'center', fontSize: 13},
  title: {fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6},
  cardHeaderRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10},
  favoriteIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteIconText: {fontSize: 18},
  meta: {marginTop: 3, color: colors.textMuted, fontSize: 14},
  captainNote: {marginTop: 8, color: colors.textStrong, fontSize: 13, lineHeight: 18},
  patronInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  patronName: {color: colors.textStrong, fontSize: 14, fontWeight: '600'},
  boatInfoRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2},
  boatInfo: {color: colors.textSubtle, fontSize: 12, marginTop: 2},
  inlineFavoriteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inlineFavoriteText: {fontSize: 14},
  ratingPressable: {alignItems: 'flex-end'},
  ratingHint: {fontSize: 11, color: colors.textSubtle, marginTop: 2},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8},
  seats: {color: colors.textStrong, fontSize: 14},
  price: {fontSize: 18, fontWeight: '700', color: colors.primary},
  priceFree: {fontSize: 15, fontWeight: '700', color: colors.success},
  priceContribution: {fontSize: 12, color: colors.textMuted, marginTop: 2},
  completeBtn: {backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6},
  completeBtnText: {color: colors.white, fontWeight: '600', fontSize: 13},
  reserveBtn: {backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6},
  reserveBtnText: {color: colors.white, fontWeight: '600', fontSize: 13},
  reservedBtn: {backgroundColor: colors.success},
  reservationActions: {alignItems: 'flex-end', gap: 6},
  cancelReservationBtn: {backgroundColor: colors.danger, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6},
  cancelReservationBtnText: {color: colors.white, fontWeight: '700', fontSize: 12},
  fullBtn: {backgroundColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6},
  fullBtnText: {color: '#6b7280', fontWeight: '600', fontSize: 13},
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60},
  emptyIcon: {fontSize: 64, marginBottom: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6},
  emptyText: {fontSize: 14, color: '#94a3b8', textAlign: 'center'},
});
