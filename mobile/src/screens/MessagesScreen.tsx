import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {messageService, userService} from '../services/api';
import type {Conversation, User} from '../types';

export default function MessagesScreen({navigation}: any) {
  const {session} = useAuth();
  const {t} = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);

  const loadConversations = async () => {
    try {
      if (!session?.userId) return;
      const data = await messageService.getConversations(session.userId);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    await loadUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadConversations();
      loadUsers();
    });
    return unsubscribe;
  }, [navigation, session?.userId]);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUserName: conversation.otherUserName,
      otherUserId: conversation.otherUserId,
    });
  };

  const handleStartChatWithUser = async (user: User) => {
    try {
      if (!session?.userId || !user?.id) return;
      setShowUserPicker(false);
      setQuery('');
      const convo = await messageService.createOrGetConversation({
        userId1: session.userId,
        userId2: user.id,
      });
      navigation.navigate('Chat', {
        conversationId: convo.id,
        otherUserName: user.name,
        otherUserId: user.id,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredConversations = normalizedQuery
    ? conversations.filter(c =>
        (c.otherUserName || '').toLowerCase().includes(normalizedQuery) ||
        (c.lastMessage || '').toLowerCase().includes(normalizedQuery),
      )
    : conversations;

  const conversationUserIds = new Set(conversations.map(c => c.otherUserId));
  const availableUsers = users.filter(
    user => user.id !== session?.userId && !conversationUserIds.has(user.id),
  );
  const filteredUsers = availableUsers.filter(user =>
    normalizedQuery ? (user.name || '').toLowerCase().includes(normalizedQuery) : true,
  );
  const shouldShowUsers = showUserPicker || normalizedQuery.length > 0;

  const renderConversation = ({item}: {item: Conversation}) => {
    const lastMessagePreview = item.lastMessage ? 
      (item.lastMessage.length > 50 ? item.lastMessage.substring(0, 50) + '...' : item.lastMessage) 
      : 'Sin mensajes aún';

    const lastMessageDate = item.lastMessageTime ? 
      new Date(item.lastMessageTime).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      : '';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          {item.otherUserAvatar ? (
            <Image
              source={{uri: item.otherUserAvatar}}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {item.otherUserName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.header}>
            <Text
              style={[
                styles.userName,
                item.unreadCount > 0 && styles.unreadText,
              ]}
              numberOfLines={1}
            >
              {item.otherUserName}
            </Text>
            <Text style={styles.timestamp}>{lastMessageDate}</Text>
          </View>
          <Text
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={2}
          >
            {lastMessagePreview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar conversación o usuario"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          <TouchableOpacity
            style={[styles.newChatBtn, showUserPicker && styles.newChatBtnActive]}
            onPress={() => setShowUserPicker(prev => !prev)}>
            <Text style={styles.newChatBtnText}>+ Nuevo chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {shouldShowUsers && (
        <View style={styles.userResultsSection}>
          <Text style={styles.userResultsTitle}>Usuarios ({filteredUsers.length})</Text>
          {filteredUsers.length === 0 ? (
            <Text style={styles.noUserText}>No hay usuarios disponibles para iniciar chat</Text>
          ) : (
            <FlatList
              data={filteredUsers}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.userChip}
                  onPress={() => handleStartChatWithUser(item)}>
                  <Text style={styles.userChipText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptySubtext}>
              {normalizedQuery ? 'Sin resultados para esa búsqueda' : 'Sin conversaciones aún'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  newChatBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  newChatBtnActive: {
    backgroundColor: '#0369a1',
  },
  newChatBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  userResultsSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  userResultsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  userChip: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#7dd3fc',
  },
  userChipText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  noUserText: {
    fontSize: 13,
    color: '#64748b',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#cbd5e1',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
    color: '#0284c7',
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyListContainer: {
    paddingTop: 28,
    alignItems: 'center',
  },
});
