import React, {useCallback, useEffect, useRef, useState} from 'react';
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
  AppState,
  Keyboard,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {feedback} from '../theme/feedback';
import {radius, spacing} from '../theme/layout';
import {useAuth} from '../contexts/AuthContext';
import {messageService} from '../services/api';
import type {Message} from '../types';
import {colors} from '../theme/colors';
import {getErrorMessage, isAuthorizationError, isNotFoundError} from '../utils/errors';

const CHAT_POLL_INTERVAL_MS = 5000;

export default function ChatScreen({route, navigation}: any) {
  const routeParams = route?.params?.params ?? route?.params ?? {};
  const {conversationId, otherUserName, otherUserId, tripId, chatSeed} = routeParams;
  const {session} = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string>(conversationId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [initializingChat, setInitializingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAppActive, setIsAppActive] = useState(true);
  const [messageAccessBlocked, setMessageAccessBlocked] = useState(false);
  const [blockState, setBlockState] = useState({blocked: false, blockedByMe: false, blockedByOther: false});
  const [moderating, setModerating] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTargetRef = useRef('');
  const recoveringConversationRef = useRef(false);
  const accessErrorNotifiedRef = useRef(false);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({animated});
    });
  }, []);

  const appendUniqueMessage = useCallback((message: Message) => {
    if (!message?.id) {
      return;
    }

    setMessages(prev => (prev.some(item => item.id === message.id) ? prev : [...prev, message]));
    setTimeout(() => scrollToBottom(), 80);
  }, [scrollToBottom]);

  useEffect(() => {
    navigation.setOptions({
      title: otherUserName || 'Chat',
      headerBackTitle: 'Atrás',
    });
  }, [navigation, otherUserName]);

  useEffect(() => {
    const explicitConversationId = typeof conversationId === 'string' ? conversationId.trim() : '';
    const targetKey = `${String(session?.userId || '')}:${String(otherUserId || '')}:${String(tripId || '')}:${String(chatSeed || '')}`;

    if (explicitConversationId) {
      lastTargetRef.current = targetKey;
      setActiveConversationId(explicitConversationId);
      setMessages([]);
      setMessageAccessBlocked(false);
      accessErrorNotifiedRef.current = false;
      return;
    }

    if (lastTargetRef.current !== targetKey) {
      lastTargetRef.current = targetKey;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setActiveConversationId('');
      setMessages([]);
      setMessageAccessBlocked(false);
      accessErrorNotifiedRef.current = false;
      setLoading(Boolean(session?.userId && otherUserId));
    }
  }, [chatSeed, conversationId, otherUserId, session?.userId, tripId]);

  const recoverConversationAccess = useCallback(async () => {
    if (recoveringConversationRef.current || !session?.userId || !otherUserId) {
      return false;
    }

    recoveringConversationRef.current = true;
    try {
      setInitializingChat(true);
      const convo = await messageService.createOrGetConversation({
        userId1: session.userId,
        userId2: otherUserId,
        tripId,
      });

      if (!convo?.id || convo.id === activeConversationId) {
        return false;
      }

      setActiveConversationId(convo.id);
      setMessages([]);
      setMessageAccessBlocked(false);
      accessErrorNotifiedRef.current = false;
      navigation.setParams({
        ...(route?.params ?? {}),
        conversationId: convo.id,
        otherUserId,
        otherUserName,
        tripId,
        chatSeed,
      });
      return true;
    } catch (recoveryError) {
      console.error('Error recovering conversation access:', recoveryError);
      return false;
    } finally {
      recoveringConversationRef.current = false;
      setInitializingChat(false);
    }
  }, [activeConversationId, chatSeed, navigation, otherUserId, otherUserName, route?.params, session?.userId, tripId]);

  useEffect(() => {
    const ensureConversation = async () => {
      if (activeConversationId || !session?.userId || !otherUserId) {
        if (!activeConversationId) {
          setLoading(false);
        }
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
        feedback.error(getErrorMessage(error, 'No pudimos abrir el chat. Vuelve a intentarlo.'));
        setLoading(false);
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
      setMessageAccessBlocked(false);
      setMessages(data);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
      if (isAuthorizationError(error) || isNotFoundError(error)) {
        const resolvedMessage = getErrorMessage(error, '');
        const canRecover = /participant|autorizado/i.test(resolvedMessage) && Boolean(otherUserId);
        if (canRecover) {
          const recovered = await recoverConversationAccess();
          if (recovered) {
            return;
          }
        }

        setMessageAccessBlocked(true);
        if (!accessErrorNotifiedRef.current) {
          accessErrorNotifiedRef.current = true;
          if (!isNotFoundError(error)) {
            feedback.info('Este chat se ha desincronizado. Hemos detenido la actualizacion automatica para evitar errores repetidos.');
          }
        }
        return;
      }
      feedback.error(getErrorMessage(error, 'No pudimos cargar los mensajes'));
    } finally {
      setLoading(false);
    }
  };

  const loadBlockStatus = useCallback(async () => {
    if (!session?.userId || !otherUserId) {
      setBlockState({blocked: false, blockedByMe: false, blockedByOther: false});
      return;
    }
    try {
      const state = await messageService.getBlockStatus(session.userId, otherUserId);
      setBlockState(state);
    } catch (error) {
      console.error('Error loading block status:', error);
    }
  }, [session?.userId, otherUserId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      setIsAppActive(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    if (!activeConversationId || !isAppActive || messageAccessBlocked) return;

    // load now + poll
    loadMessages();
    pollTimerRef.current = setInterval(loadMessages, CHAT_POLL_INTERVAL_MS);
  }, [activeConversationId, isAppActive, messageAccessBlocked, stopPolling]);

  useFocusEffect(
    useCallback(() => {
      startPolling();
      loadBlockStatus();

      if (session?.userId && activeConversationId && !messageAccessBlocked) {
        messageService.markConversationAsRead(activeConversationId, session.userId).catch(() => {});
      }

      return () => stopPolling();
    }, [activeConversationId, loadBlockStatus, messageAccessBlocked, session?.userId, startPolling, stopPolling]),
  );

  useEffect(() => {
    setMessageAccessBlocked(false);
    accessErrorNotifiedRef.current = false;
  }, [activeConversationId, session?.userId]);

  useEffect(() => {
    if (isAppActive) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isAppActive, startPolling, stopPolling]);

  useEffect(() => {
    if (!activeConversationId || !isAppActive || messageAccessBlocked) {
      return;
    }

    let unsubscribe = () => {};
    let disposed = false;

    messageService.subscribeToConversationMessages(activeConversationId, appendUniqueMessage)
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
  }, [activeConversationId, appendUniqueMessage, isAppActive, messageAccessBlocked]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setTimeout(() => scrollToBottom(), 60);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setTimeout(() => scrollToBottom(false), 60);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToBottom]);

  const handleSendMessage = async () => {
    if (!activeConversationId || !newMessage.trim() || !session?.userId || blockState.blocked) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const message = await messageService.sendMessage({
        conversationId: activeConversationId,
        senderId: session.userId,
        content: messageContent,
      });
      appendUniqueMessage(message);
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
      feedback.error(getErrorMessage(error, 'No pudimos enviar el mensaje. Intenta de nuevo.'));
    } finally {
      setSending(false);
    }
  };

  const handleBlockToggle = () => {
    if (!session?.userId || !otherUserId || moderating) return;
    if (blockState.blockedByOther) {
      feedback.info('No puedes bloquear o desbloquear porque este usuario te ha bloqueado.');
      return;
    }

    if (blockState.blockedByMe) {
      feedback.confirm('Desbloquear usuario', `¿Quieres desbloquear a ${otherUserName || 'este usuario'}?`, [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Desbloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              setModerating(true);
              await messageService.unblockUser({blockerId: session.userId, blockedUserId: otherUserId});
              await loadBlockStatus();
              feedback.success('Usuario desbloqueado.');
            } catch (error) {
              feedback.error(getErrorMessage(error, 'No pudimos desbloquear al usuario.'));
            } finally {
              setModerating(false);
            }
          },
        },
      ]);
      return;
    }

    feedback.confirm('Bloquear usuario', `Si bloqueas a ${otherUserName || 'este usuario'} no podran enviarse mensajes.`, [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Bloquear',
        style: 'destructive',
        onPress: async () => {
          try {
            setModerating(true);
            await messageService.blockUser({
              blockerId: session.userId,
              blockedUserId: otherUserId,
              reason: 'Bloqueo desde chat',
            });
            await loadBlockStatus();
            feedback.success('Usuario bloqueado.');
          } catch (error) {
            feedback.error(getErrorMessage(error, 'No pudimos bloquear al usuario.'));
          } finally {
            setModerating(false);
          }
        },
      },
    ]);
  };

  const handleReportUser = () => {
    if (!session?.userId || !otherUserId || moderating) return;
    feedback.confirm('Reportar usuario', 'Selecciona un motivo de reporte.', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Acoso',
        onPress: async () => {
          try {
            setModerating(true);
            await messageService.reportUser({
              reporterId: session.userId,
              reportedUserId: otherUserId,
              conversationId: activeConversationId || undefined,
              reason: 'acoso',
            });
            feedback.success('Reporte enviado. Nuestro equipo revisara el caso.');
          } catch (error) {
            feedback.error(getErrorMessage(error, 'No pudimos enviar el reporte.'));
          } finally {
            setModerating(false);
          }
        },
      },
      {
        text: 'Spam/Estafa',
        onPress: async () => {
          try {
            setModerating(true);
            await messageService.reportUser({
              reporterId: session.userId,
              reportedUserId: otherUserId,
              conversationId: activeConversationId || undefined,
              reason: 'spam_estafa',
            });
            feedback.success('Reporte enviado. Nuestro equipo revisara el caso.');
          } catch (error) {
            feedback.error(getErrorMessage(error, 'No pudimos enviar el reporte.'));
          } finally {
            setModerating(false);
          }
        },
      },
    ]);
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyMessage}
        contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.listContent}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onContentSizeChange={() => scrollToBottom(false)}
      />
      <View style={styles.safetyRow}>
        <TouchableOpacity style={styles.safetyButton} onPress={handleReportUser} disabled={moderating}>
          <Text style={styles.safetyButtonText}>Reportar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.safetyButton} onPress={handleBlockToggle} disabled={moderating}>
          <Text style={[styles.safetyButtonText, styles.blockText]}>
            {blockState.blockedByMe ? 'Desbloquear' : 'Bloquear'}
          </Text>
        </TouchableOpacity>
      </View>

      {blockState.blocked ? (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedBannerText}>
            {blockState.blockedByMe
              ? 'Tienes bloqueado a este usuario. Desbloquealo para continuar el chat.'
              : 'Este usuario te ha bloqueado. No puedes enviar mensajes.'}
          </Text>
        </View>
      ) : null}

      {messageAccessBlocked ? (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedBannerText}>
            Este chat estaba apuntando a una conversacion invalida. Puedes volver atras y abrirlo de nuevo.
          </Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textSubtle}
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
          returnKeyType="send"
          maxLength={500}
          editable={!sending && !blockState.blocked && !messageAccessBlocked}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!activeConversationId || !newMessage.trim() || sending || blockState.blocked || messageAccessBlocked}
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
  messagesList: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
  safetyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  safetyButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: '#eef2ff',
  },
  safetyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryAlt,
  },
  blockText: {
    color: '#b91c1c',
  },
  blockedBanner: {
    backgroundColor: '#fef2f2',
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  blockedBannerText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '600',
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
