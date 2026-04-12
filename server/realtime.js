const {Server} = require('socket.io');
const db = require('./database');
const {verifyToken} = require('./utils/token');

let io = null;

const getConversationRoom = (conversationId) => `conversation:${String(conversationId || '').trim()}`;

const getHandshakeToken = (socket) => {
  const authToken = typeof socket.handshake?.auth?.token === 'string' ? socket.handshake.auth.token.trim() : '';
  if (authToken) return authToken;

  const authorization = typeof socket.handshake?.headers?.authorization === 'string'
    ? socket.handshake.headers.authorization.trim()
    : '';
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return '';
};

const initRealtime = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = getHandshakeToken(socket);
    if (!token) {
      next(new Error('Token requerido para WebSocket'));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.auth = {
        userId: String(payload.userId || ''),
        role: payload.role,
        email: payload.email,
        name: payload.name,
      };
      next();
    } catch (error) {
      next(new Error(error?.message || 'Token invalido'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('conversation:join', async (payload, ack) => {
      try {
        const conversationId = String(payload?.conversationId || '').trim();
        const userId = String(socket.auth?.userId || '').trim();

        if (!conversationId || !userId) {
          ack?.({ok: false, error: 'Datos invalidos para unirse al chat'});
          return;
        }

        const rows = await db.query(
          'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1',
          [conversationId, userId],
        );

        if (!Array.isArray(rows) || rows.length === 0) {
          ack?.({ok: false, error: 'No autorizado para este chat'});
          return;
        }

        socket.join(getConversationRoom(conversationId));
        ack?.({ok: true, conversationId});
      } catch (error) {
        ack?.({ok: false, error: error?.message || 'No se pudo unir al chat'});
      }
    });

    socket.on('conversation:leave', (payload) => {
      const conversationId = String(payload?.conversationId || '').trim();
      if (conversationId) {
        socket.leave(getConversationRoom(conversationId));
      }
    });
  });

  return io;
};

const emitConversationMessage = (conversationId, message) => {
  if (!io || !conversationId || !message) {
    return;
  }

  io.to(getConversationRoom(conversationId)).emit('conversation:message', message);
};

module.exports = {
  initRealtime,
  emitConversationMessage,
};