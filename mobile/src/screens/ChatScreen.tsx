import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {feedback} from '../theme/feedback';
import {radius, spacing} from '../theme/layout';
import {useAuth} from '../contexts/AuthContext';
import {messageService} from '../services/api';
import type {Message} from '../types';
import {colors} from '../theme/colors';

export default function ChatScreen({route, navigation}: any) {
  const routeParams = route?.params?.params ?? route?.params ?? {};
  const {conversationId, otherUserName, otherUserId, tripId} = routeParams;
  const {session} = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string>(conversationId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [initializingChat, setInitializingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUserName || 'Chat',
      headerBackTitle: 'Atrás',
    });
  }, [navigation, otherUserName]);

  useEffect(() => {
    setActiveConversationId(conversationId || '');
  }, [conversationId]);

  useEffect(() => {
    const ensureConversation = async () => {
      if (activeConversationId || !session?.userId || !otherUserId) {
        return;
      }

      try {
        setInitializingChat(true);
        const convo = await messageService.createOrGetConversation({
          userId1: session.userId,
          userId2: otherUserId,
          tripId,
        });
        setActiveConversationId(convo.id);
        navigation.setParams({
          ...(route?.params ?? {}),
          conversationId: convo.id,
          otherUserId,
          otherUserName,
          tripId,
        });
      } catch (error) {
        console.error('Error ensuring conversation in ChatScreen:', error);
        feedback.error('No pudimos abrir el chat. Vuelve a intentarlo.');
      } finally {
        setInitializingChat(false);
      }
    };

    ensureConversation();
  }, [activeConversationId, session?.userId, otherUserId, otherUserName, tripId, navigation, route?.params]);

  const loadMessages = async () => {
    if (!activeConversationId) {
      setLoading(false);
      return;
    }

    try {
      if (!session?.userId) return;
      const data = await messageService.getMessages(activeConversationId, session.userId);
      setMessages(data);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Mark conversation as read
    if (session?.userId && activeConversationId) {
      messageService.markConversationAsRead(activeConversationId, session.userId).catch(() => {});
    }

    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [activeConversationId, session?.userId]);

  const handleSendMessage = async () => {
    if (!activeConversationId || !newMessage.trim() || !session?.userId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const message = await messageService.sendMessage({
        conversationId: activeConversationId,
        senderId: session.userId,
        content: messageContent,
      });
      setMessages(prev => [...prev, message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
      feedback.error('No pudimos enviar el mensaje. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isOwn = item.senderId === session?.userId;
    const timestamp = new Date(item.createdAt).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
        {!isOwn && (
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarInitial}>{item.senderName?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
            {timestamp}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyMessage = () => (
    <View style={styles.emptyChat}>
      <Text style={styles.emptyChatText}>
        👋 Comienza a chatear con {otherUserName}
      </Text>
    </View>
  );

  if (loading || initializingChat) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyMessage}
        contentContainerStyle={messages.length === 0 ? styles.emptyContainer : undefined}
        onEndReachedThreshold={0.5}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textSubtle}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!activeConversationId || !newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.sendButtonText}>📤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  messageContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownText: {
    color: colors.white,
  },
  otherText: {
    color: colors.textStrong,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: '#bfdbfe',
  },
  otherTimestamp: {
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyChatText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
    color: colors.textStrong,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderStrong,
  },
  sendButtonText: {
    fontSize: 18,
  },
});
