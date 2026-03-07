import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert, Image} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {favoriteService} from '../services/api';

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
      setFavorites(Array.isArray(data) ? data : []);
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

    Alert.alert(
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
              Alert.alert('Éxito', 'Usuario eliminado de favoritos');
              await loadFavorites();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el favorito');
            }
          },
        },
      ]
    );
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
          keyExtractor={item => item.id}
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
                  <Text style={styles.userName}>{item.name || 'Usuario'}</Text>
                  <Text style={styles.userRole}>
                    {item.role === 'patron' ? '👨‍✈️ Capitán' : '🧳 Viajero'}
                  </Text>
                  {item.bio && (
                    <Text style={styles.userBio} numberOfLines={2}>
                      {item.bio}
                    </Text>
                  )}
                  {item.averageRating > 0 && (
                    <Text style={styles.rating}>
                      ⭐ {item.averageRating.toFixed(1)} / 5.0
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => {
                    // Navegar al chat con este usuario
                    navigation.navigate('Messages', {
                      screen: 'Chat',
                      params: {
                        otherUserId: item.id,
                        otherUserName: item.name,
                      },
                    });
                  }}
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
  container: {flex: 1, backgroundColor: '#f8fafc'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {fontSize: 24, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 4},
  headerSubtitle: {fontSize: 14, color: '#64748b'},

  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20},
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyTitle: {fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8},
  emptyText: {fontSize: 14, color: '#64748b', textAlign: 'center'},

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  userRole: {fontSize: 13, color: '#64748b', marginBottom: 4},
  userBio: {fontSize: 13, color: '#475569', marginTop: 4},
  rating: {fontSize: 13, color: '#f59e0b', marginTop: 4, fontWeight: '600'},

  actions: {flexDirection: 'row', gap: 8},
  chatBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chatBtnText: {color: '#fff', fontWeight: '600', fontSize: 14},
  removeBtn: {
    width: 48,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {fontSize: 18},
});
