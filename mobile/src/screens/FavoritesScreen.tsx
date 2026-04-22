import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {API_ORIGIN} from '../config/apiConfig';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {favoriteService, messageService, userService} from '../services/api';
import {RemoteImage} from '../components/RemoteImage';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, shadows, spacing} from '../theme/layout';

const toSafeRating = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeAvatarUri = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(https?:\/\/|content:\/\/|file:\/\/|ph:\/\/|assets-library:\/\/)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;
  if (/^uploads\//i.test(trimmed)) return `${API_ORIGIN}/${trimmed}`;
  return trimmed;
};

const normalizeFavorite = (raw: any) => ({
  ...raw,
  id: String(raw?.favoriteUserId ?? raw?.id ?? ''),
  name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Usuario',
  role: raw?.role === 'patron' ? 'patron' : 'traveler',
  avatar: normalizeAvatarUri(raw?.avatar),
  bio: typeof raw?.bio === 'string' ? raw.bio : '',
  averageRating: toSafeRating(raw?.averageRating ?? raw?.average_rating ?? raw?.rating),
  reviewCount: Number(raw?.reviewCount ?? raw?.ratings?.length ?? 0) || 0,
});

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTopUsers, setShowTopUsers] = useState(false);

  const loadFavorites = async () => {
    if (!session?.userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const data = await favoriteService.getUserFavorites(session.userId);
      const normalized = Array.isArray(data)
        ? data
            .map(normalizeFavorite)
            .filter(item => item.id.length > 0)
        : [];
      setFavorites(normalized);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUsers = async () => {
    if (!session?.userId) {
      setAllUsers([]);
      return;
    }

    try {
      const data = await userService.getAll();
      const normalized = Array.isArray(data)
        ? data
            .map(normalizeFavorite)
            .filter(item => item.id.length > 0 && item.id !== session.userId)
        : [];
      setAllUsers(normalized);
    } catch (error) {
      console.error('Error loading users for favorites search:', error);
      setAllUsers([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFavorites();
      loadUsers();
    }, [session?.userId])
  );

  const handleAddFavorite = async (favoriteUserId: string) => {
    if (!session?.userId) return;

    try {
      await favoriteService.addFavorite(session.userId, favoriteUserId);
      feedback.success('Usuario agregado a favoritos');
      await loadFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
      feedback.error('No se pudo agregar a favoritos');
    }
  };

  const handleRemoveFavorite = async (favoriteUserId: string) => {
    if (!session?.userId) return;

    feedback.confirm(
      'Eliminar favorito',
      '¿Estás seguro de que quieres eliminar este usuario de tus favoritos?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoriteService.removeFavorite(session.userId, favoriteUserId);
              feedback.success('Usuario eliminado de favoritos');
              await loadFavorites();
            } catch (error) {
              feedback.error('No se pudo eliminar el favorito');
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async (user: any) => {
    if (!session?.userId || !user?.id) {
      feedback.error('No pudimos iniciar el chat');
      return;
    }

    try {
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          chatSeed: `${user.id}-${Date.now()}`,
          otherUserId: user.id,
          otherUserName: user.name,
        },
      });
    } catch (error) {
      console.error('Error starting chat from favorites:', error);
      feedback.error('No pudimos abrir el chat');
    }
  };

  const openPublicProfile = (userId: string) => {
    if (!userId) return;
    const parentNav = navigation.getParent?.() || navigation;
    parentNav.navigate('UserPublicProfile', {userId});
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const favoriteIds = new Set(favorites.map(item => item.id));
  const filteredFavorites = normalizedQuery
    ? favorites.filter(item => `${item.name} ${item.bio || ''}`.toLowerCase().includes(normalizedQuery))
    : favorites;
  const searchResults = normalizedQuery
    ? allUsers.filter(item => {
        const haystack = `${item.name} ${item.email || ''} ${item.bio || ''}`.toLowerCase();
        return !favoriteIds.has(item.id) && haystack.includes(normalizedQuery);
      })
    : [];
  const topUsers = [...allUsers]
    .filter(item => item.id && toSafeRating(item.averageRating) > 0)
    .sort((left, right) => {
      const byRating = toSafeRating(right.averageRating) - toSafeRating(left.averageRating);
      if (byRating !== 0) return byRating;
      return (right.reviewCount || 0) - (left.reviewCount || 0);
    })
    .slice(0, 10);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ Mis Favoritos</Text>
        <Text style={styles.headerSubtitle}>Usuarios que has guardado</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar usuarios"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={styles.topToggleBtn} onPress={() => setShowTopUsers(prev => !prev)}>
          <Text style={styles.topToggleBtnText}>{showTopUsers ? 'Ocultar top 10' : '🏆 Ver top 10 usuarios'}</Text>
        </TouchableOpacity>
      </View>

      {showTopUsers ? (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Top 10 por puntuación</Text>
          {topUsers.length === 0 ? (
            <Text style={styles.topEmptyText}>Todavía no hay suficientes valoraciones para mostrar el ranking.</Text>
          ) : (
            topUsers.map((item, index) => (
              <TouchableOpacity key={`top-${item.id}`} style={styles.searchCard} onPress={() => openPublicProfile(item.id)}>
                <View style={styles.userInfo}>
                  <RemoteImage
                    uri={item.avatar}
                    style={styles.avatar}
                    fallbackText={item.name?.slice(0, 1)?.toUpperCase() || '👤'}
                    fallbackStyle={styles.avatarFallback}
                    fallbackTextStyle={styles.avatarFallbackText}
                  />
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>#{index + 1} {item.name}</Text>
                    <Text style={styles.userRole}>{item.role === 'patron' ? '👨‍✈️ Capitán' : '🧳 Viajero'}</Text>
                    <Text style={styles.rating}>⭐ {toSafeRating(item.averageRating).toFixed(1)} / 5.0 · {item.reviewCount || 0} reseñas</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : null}

      {searchResults.length > 0 ? (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Usuarios encontrados</Text>
          {searchResults.slice(0, 8).map(item => (
            <View key={`search-${item.id}`} style={styles.searchCard}>
              <TouchableOpacity style={styles.userInfo} onPress={() => openPublicProfile(item.id)}>
                <RemoteImage
                  uri={item.avatar}
                  style={styles.avatar}
                  fallbackText={item.name?.slice(0, 1)?.toUpperCase() || (item.role === 'patron' ? '⛵' : '🧳')}
                  fallbackStyle={styles.avatarFallback}
                  fallbackTextStyle={styles.avatarFallbackText}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userRole}>{item.role === 'patron' ? '👨‍✈️ Capitán' : '🧳 Viajero'}</Text>
                  {item.bio ? <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text> : null}
                  {toSafeRating(item.averageRating) > 0 ? (
                    <Text style={styles.rating}>⭐ {toSafeRating(item.averageRating).toFixed(1)} / 5.0</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={() => handleAddFavorite(item.id)}>
                <Text style={styles.addBtnText}>➕ Favorito</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {filteredFavorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyTitle}>{normalizedQuery ? 'Sin resultados' : 'Sin favoritos'}</Text>
          <Text style={styles.emptyText}>
            {normalizedQuery ? 'No encontramos usuarios o favoritos con esa búsqueda' : 'Aún no has agregado usuarios a tus favoritos'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item, index) => item.id || `favorite-${index}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFavorites(); }} />
          }
          renderItem={({item}) => (
            <View style={styles.card}>
              <TouchableOpacity style={styles.userInfo} onPress={() => openPublicProfile(item.id)}>
                <RemoteImage
                  uri={item.avatar}
                  style={styles.avatar}
                  fallbackText={item.name?.slice(0, 1)?.toUpperCase() || (item.role === 'patron' ? '⛵' : '🧳')}
                  fallbackStyle={styles.avatarFallback}
                  fallbackTextStyle={styles.avatarFallbackText}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userRole}>
                    {item.role === 'patron' ? '👨‍✈️ Capitán' : '🧳 Viajero'}
                  </Text>
                  {item.bio && (
                    <Text style={styles.userBio} numberOfLines={2}>
                      {item.bio}
                    </Text>
                  )}
                  {toSafeRating(item.averageRating) > 0 && (
                    <Text style={styles.rating}>
                      ⭐ {toSafeRating(item.averageRating).toFixed(1)} / 5.0
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => handleStartChat(item)}
                >
                  <Text style={styles.chatBtnText}>💬 Mensaje</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveFavorite(item.id)}
                >
                  <Text style={styles.removeBtnText}>❌</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  
  header: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {fontSize: 24, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 4},
  headerSubtitle: {fontSize: 14, color: colors.textMuted},
  searchInput: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textStrong,
  },
  topToggleBtn: {
    marginTop: spacing.md,
    backgroundColor: '#ede9fe',
    borderRadius: radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  topToggleBtnText: {color: '#5b21b6', fontWeight: '700'},
  resultsSection: {paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm},
  resultsTitle: {fontSize: 16, fontWeight: '700', color: colors.textStrong},
  topEmptyText: {fontSize: 13, color: colors.textMuted},
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  addBtn: {
    marginTop: spacing.sm,
    backgroundColor: '#dcfce7',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addBtnText: {color: '#166534', fontWeight: '700'},

  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyTitle: {fontSize: 20, fontWeight: 'bold', color: colors.textStrong, marginBottom: 8},
  emptyText: {fontSize: 14, color: colors.textMuted, textAlign: 'center'},

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: 8,
    ...shadows.card,
  },
  userInfo: {flexDirection: 'row', marginBottom: 12},
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarFallback: {backgroundColor: '#e0f2fe'},
  avatarFallbackText: {fontSize: 24, fontWeight: '800', color: colors.primary},
  userDetails: {flex: 1},
  userName: {fontSize: 18, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 4},
  userRole: {fontSize: 13, color: colors.textMuted, marginBottom: 4},
  userBio: {fontSize: 13, color: colors.textStrong, marginTop: 4},
  rating: {fontSize: 13, color: '#f59e0b', marginTop: 4, fontWeight: '600'},

  actions: {flexDirection: 'row', gap: spacing.sm},
  chatBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chatBtnText: {color: colors.white, fontWeight: '600', fontSize: 14},
  removeBtn: {
    width: 48,
    backgroundColor: '#fee2e2',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {fontSize: 18},
});
