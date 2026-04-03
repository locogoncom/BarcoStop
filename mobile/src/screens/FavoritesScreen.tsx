import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {favoriteService, messageService} from '../services/api';
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, shadows, spacing} from '../theme/layout';

const toSafeRating = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeFavorite = (raw: any) => ({
  ...raw,
  id: String(raw?.favoriteUserId ?? raw?.id ?? ''),
  name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Usuario',
  role: raw?.role === 'patron' ? 'patron' : 'traveler',
  averageRating: toSafeRating(raw?.averageRating),
});

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const {session} = useAuth();
  const {t} = useLanguage();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFavorites();
    }, [session?.userId])
  );

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
          otherUserId: user.id,
          otherUserName: user.name,
        },
      });
    } catch (error) {
      console.error('Error starting chat from favorites:', error);
      feedback.error('No pudimos abrir el chat');
    }
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ Mis Favoritos</Text>
        <Text style={styles.headerSubtitle}>Usuarios que has guardado</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyTitle}>Sin favoritos</Text>
          <Text style={styles.emptyText}>
            Aún no has agregado usuarios a tus favoritos
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, index) => item.id || `favorite-${index}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFavorites(); }} />
          }
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.role === 'patron' ? '⛵' : '🧳'}
                  </Text>
                </View>
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
              </View>

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
  avatarText: {fontSize: 28},
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
