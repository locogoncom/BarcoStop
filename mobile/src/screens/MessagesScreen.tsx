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
import {colors} from '../theme/colors';
import {feedback} from '../theme/feedback';
import {radius, spacing} from '../theme/layout';

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
      navigation.navigate('Chat', {
        otherUserName: user.name,
        otherUserId: user.id,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      feedback.error('No pudimos abrir el chat');
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
        <ActivityIndicator size="large" color={colors.primary} />
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
            placeholderTextColor={colors.textSubtle}
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
          <Text style={styles.userResultsHint}>Toca un usuario para abrir el chat y escribirle.</Text>
          {filteredUsers.length === 0 ? (
            <Text style={styles.noUserText}>No hay usuarios disponibles para iniciar chat</Text>
          ) : (
            <View style={styles.userList}>
              {filteredUsers.slice(0, 12).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.userCard}
                  onPress={() => handleStartChatWithUser(item)}>
                  <View>
                    <Text style={styles.userCardName}>{item.name}</Text>
                    <Text style={styles.userCardMeta}>{item.role === 'patron' ? 'Capitán' : 'Viajero'}</Text>
                  </View>
                  <Text style={styles.userCardAction}>Abrir</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    backgroundColor: colors.surface,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  newChatBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  newChatBtnActive: {
    backgroundColor: colors.primaryAlt,
  },
  newChatBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  userResultsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingTop: 4,
  },
  userResultsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: spacing.sm,
  },
  userResultsHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  userList: {
    gap: spacing.sm,
  },
  userCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userCardName: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 14,
  },
  userCardMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  userCardAction: {
    color: colors.primaryAlt,
    fontWeight: '700',
    fontSize: 13,
  },
  noUserText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: colors.borderStrong,
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.danger,
    borderRadius: radius.round,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
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
    color: colors.textStrong,
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
    color: colors.primary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSubtle,
    marginLeft: spacing.sm,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textMuted,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.textStrong,
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
