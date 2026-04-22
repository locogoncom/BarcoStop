import axios from 'axios';
import {io, type Socket} from 'socket.io-client';
import type {Role, SessionData, Trip, User, UserSkill, Boat, Rating, Message, Conversation, Patron, SupportMessage, RegattaChatState, RegattaParticipant} from '../types';
import {API_BASE_URL, API_ORIGIN} from '../config/apiConfig';
import {logger} from '../utils/logger';
import {normalizeRemoteAssetUrl, toServerUploadPath} from '../utils/assets';

type AuthFailureHandler = (message: string) => void | Promise<void>;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type RequestPolicy = {
  retries: number;
  delayMs: number;
  timeoutMs: number;
};

const REQUEST_POLICIES = {
  authWrite: {retries: 2, delayMs: 1200, timeoutMs: 25000},
  chatRead: {retries: 2, delayMs: 300, timeoutMs: 15000},
  chatWrite: {retries: 2, delayMs: 500, timeoutMs: 20000},
  reservationRead: {retries: 1, delayMs: 350, timeoutMs: 15000},
  reservationWrite: {retries: 2, delayMs: 400, timeoutMs: 15000},
  userRead: {retries: 1, delayMs: 350, timeoutMs: 15000},
  userWrite: {retries: 1, delayMs: 400, timeoutMs: 20000},
  tripRead: {retries: 2, delayMs: 500, timeoutMs: 20000},
  tripWrite: {retries: 1, delayMs: 450, timeoutMs: 25000},
  miscRead: {retries: 1, delayMs: 350, timeoutMs: 15000},
  miscWrite: {retries: 1, delayMs: 450, timeoutMs: 20000},
  paymentRead: {retries: 1, delayMs: 400, timeoutMs: 15000},
  paymentWrite: {retries: 1, delayMs: 450, timeoutMs: 20000},
} as const satisfies Record<string, RequestPolicy>;

const SOCKET_CONNECT_TIMEOUT_MS = 5000;

const normalizeAssetUrl = normalizeRemoteAssetUrl;
const toServerAssetPath = toServerUploadPath;

const normalizeRole = (value: unknown): Role => {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'patron' || role === 'captain' || role === 'capitan' || role === 'patrón') {
    return 'patron';
  }
  return 'viajero';
};

const mapSessionData = (raw: any): SessionData => ({
  userId: String(raw?.userId ?? raw?.user_id ?? ''),
  email: String(raw?.email ?? ''),
  name: String(raw?.name ?? ''),
  role: normalizeRole(raw?.role),
  token: typeof raw?.token === 'string' && raw.token.trim() ? raw.token : undefined,
});

const mapUser = (raw: any): User => ({
  id: String(raw?.id ?? raw?.userId ?? raw?.user_id ?? ''),
  name: String(raw?.name ?? raw?.username ?? ''),
  email: String(raw?.email ?? ''),
  role: normalizeRole(raw?.role),
  avatar: normalizeAssetUrl(raw?.avatar) ?? null,
  bio: raw?.bio ?? null,
  boatName: raw?.boatName ?? raw?.boat_name ?? null,
  boatType: raw?.boatType ?? raw?.boat_type ?? null,
  skills: Array.isArray(raw?.skills) ? raw.skills : [],
  rating:
    typeof raw?.averageRating === 'number'
      ? raw.averageRating
      : typeof raw?.average_rating === 'number'
        ? raw.average_rating
        : typeof raw?.rating === 'number'
          ? raw.rating
          : typeof raw?.averageRating === 'string'
            ? parseFloat(raw.averageRating)
            : typeof raw?.average_rating === 'string'
              ? parseFloat(raw.average_rating)
              : undefined,
  reviewCount:
    typeof raw?.reviewCount === 'number'
      ? raw.reviewCount
      : typeof raw?.review_count === 'number'
        ? raw.review_count
        : Array.isArray(raw?.ratings)
          ? raw.ratings.length
          : undefined,
});

const warmUpBackend = async (): Promise<void> => {
  try {
    await axios.get(`${API_ORIGIN}/`, {timeout: 8000});
  } catch {
    // El login real reintentara y mostrara el error si el backend sigue caido.
  }
};

const shouldRetryRequest = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return true;

  const status = error.response?.status;
  const code = error.code ?? '';

  // Client/business validation errors are not recoverable via retries.
  if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }

  return (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    !status ||
    status >= 500 ||
    status === 408 ||
    status === 429
  );
};

const withPolicy = async <T>(
  run: (timeoutMs: number) => Promise<T>,
  policy: RequestPolicy,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= policy.retries; attempt++) {
    try {
      return await run(policy.timeoutMs);
    } catch (error) {
      lastError = error;
      const canRetry = shouldRetryRequest(error);
      if (!canRetry || attempt >= policy.retries) {
        throw error;
      }
      await sleep(policy.delayMs * (attempt + 1));
    }
  }

  throw lastError;
};

// Token management
let authToken: string | null = null;
let authFailureHandler: AuthFailureHandler | null = null;
let isHandlingAuthFailure = false;
let realtimeSocket: Socket | null = null;
let realtimeSocketToken: string | null = null;

const resetRealtimeSocket = () => {
  if (realtimeSocket) {
    realtimeSocket.removeAllListeners();
    realtimeSocket.disconnect();
    realtimeSocket = null;
  }
  realtimeSocketToken = null;
};

const getRealtimeSocket = (): Socket | null => {
  if (!authToken) {
    resetRealtimeSocket();
    return null;
  }

  if (realtimeSocket && realtimeSocketToken === authToken) {
    return realtimeSocket;
  }

  resetRealtimeSocket();
  realtimeSocket = io(API_ORIGIN, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    timeout: SOCKET_CONNECT_TIMEOUT_MS,
    auth: {
      token: authToken,
    },
  });
  realtimeSocketToken = authToken;
  return realtimeSocket;
};

const getAuthFailureMessage = (error: unknown): string | null => {
  if (!axios.isAxiosError(error)) return null;

  const status = error.response?.status;
  const requestAuthHeader = error.config?.headers?.Authorization ?? error.config?.headers?.authorization;
  if (status !== 401 || !authToken || !requestAuthHeader) {
    return null;
  }

  const backendMessage = typeof error.response?.data?.error === 'string' ? error.response.data.error.trim() : '';
  const normalizedMessage = backendMessage.toLowerCase();

  if (
    normalizedMessage.includes('token') ||
    normalizedMessage.includes('firma') ||
    normalizedMessage.includes('signature') ||
    normalizedMessage.includes('expirado') ||
    normalizedMessage.includes('expired') ||
    normalizedMessage.includes('autorizado')
  ) {
    return backendMessage || 'Tu sesion ya no es valida. Inicia sesion de nuevo.';
  }

  return 'Tu sesion ya no es valida. Inicia sesion de nuevo.';
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (!token) {
    resetRealtimeSocket();
  } else if (realtimeSocketToken && realtimeSocketToken !== token) {
    resetRealtimeSocket();
  }
  logger.debug('[API] Token configurado:', token ? 'Sí' : 'No');
};

export const registerAuthFailureHandler = (handler: AuthFailureHandler | null) => {
  authFailureHandler = handler;
};

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    logger.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers.Authorization ? '✓ Token' : '✗ Sin token',
    });
    return config;
  },
  (error) => {
    logger.error('[API] Error en request interceptor:', error);
    return Promise.reject(error);
  },
);

// Interceptor para loguear respuestas
api.interceptors.response.use(
  (response) => {
    logger.debug(`[API] ✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const authFailureMessage = getAuthFailureMessage(error);
    if (authFailureMessage && authFailureHandler && !isHandlingAuthFailure) {
      isHandlingAuthFailure = true;
      setAuthToken(null);
      Promise.resolve(authFailureHandler(authFailureMessage)).finally(() => {
        isHandlingAuthFailure = false;
      });
    }

    if (error.response) {
      logger.error(`[API] ❌ ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      logger.error('[API] ❌ No response:', error.message);
    } else {
      logger.error('[API] ❌ Request error:', error.message);
    }
    return Promise.reject(error);
  },
);

const mapBoat = (raw: any): Boat => {
  if (!raw || typeof raw !== 'object') {
    logger.warn('Invalid boat data:', raw);
    return {
      id: '',
      patronId: '',
      name: '',
      type: '',
      capacity: 0,
      safetyEquipment: [],
      description: '',
      status: 'inactive',
    };
  }

  const safetyEquipment = Array.isArray(raw.safetyEquipment) 
    ? raw.safetyEquipment 
    : (typeof raw.safetyEquipment === 'string' ? raw.safetyEquipment.split(',').map((s: string) => s.trim()) : []);

  return {
    id: String(raw.id ?? ''),
    patronId: String(raw.patronId ?? raw.patron_id ?? raw.patron?.id ?? ''),
    name: String(raw.name ?? ''),
    type: String(raw.type ?? ''),
    capacity: Number(raw.capacity ?? 0),
    length: raw.length ? Number(raw.length) : undefined,
    yearBuilt: raw.yearBuilt ? Number(raw.yearBuilt) : undefined,
    fuelType: raw.fuelType || undefined,
    licenseNumber: raw.licenseNumber || undefined,
    safetyEquipment: safetyEquipment,
    description: String(raw.description ?? ''),
    status: (raw.status ?? 'active') as Boat['status'],
    createdAt: raw.createdAt,
  };
};

const parseTripDescription = (
  description: unknown,
): {
  title: string;
  tripKind?: Trip['tripKind'];
  captainNote?: string;
  boatImageUrl?: string;
  timeWindow?: Trip['timeWindow'];
  contributionType?: string;
  contributionNote?: string;
} => {
  const text = typeof description === 'string' ? description : '';
  const marker = '\n[BSMETA]';
  const markerIndex = text.indexOf(marker);

  if (markerIndex < 0) {
    return {title: text.trim()};
  }

  const title = text.slice(0, markerIndex).trim();
  const rawMeta = text.slice(markerIndex + marker.length).trim();

  try {
    const parsed = JSON.parse(rawMeta);
    const timeWindow =
      parsed?.timeWindow === 'morning' || parsed?.timeWindow === 'afternoon' || parsed?.timeWindow === 'night'
        ? parsed.timeWindow
        : undefined;
    const tripKind = parsed?.tripKind === 'regatta' ? 'regatta' : 'trip';
    const contributionType =
      typeof parsed?.contributionType === 'string' && parsed.contributionType.trim()
        ? parsed.contributionType.trim()
        : undefined;
    const contributionNote =
      typeof parsed?.contributionNote === 'string' && parsed.contributionNote.trim()
        ? parsed.contributionNote.trim()
        : undefined;
    const captainNote =
      typeof parsed?.captainNote === 'string' && parsed.captainNote.trim()
        ? parsed.captainNote.trim()
        : undefined;
    const boatImageUrl = normalizeAssetUrl(parsed?.boatImageUrl);

    return {title, tripKind, captainNote, boatImageUrl, timeWindow, contributionType, contributionNote};
  } catch {
    return {title: text.trim()};
  }
};

const inferTimeWindow = (departureTime: unknown): Trip['timeWindow'] | undefined => {
  if (typeof departureTime !== 'string' || !departureTime) return undefined;
  const hour = Number(departureTime.slice(0, 2));
  if (!Number.isFinite(hour)) return undefined;
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'night';
};

const mapTrip = (raw: any): Trip => {
  // Validar que raw existe y tiene datos mínimos
  if (!raw || typeof raw !== 'object') {
    logger.warn('Invalid trip data:', raw);
    return {
      id: '',
      title: 'Viaje',
      origin: '',
      destination: '',
      departureDate: '',
      departureTime: '',
      availableSeats: 0,
      price: 0,
      patronId: '',
      status: 'active',
    };
  }

  const patronRaw = raw.patron ?? raw.captain ?? null;
  const hasFlatPatron = raw.patronName || raw.captainName || raw.boatName || raw.boatType || raw.patronId || raw.patron_id;
  const patron: Patron | undefined = patronRaw
    ? {
        id: String(patronRaw.id ?? patronRaw.userId ?? raw.patronId ?? raw.patron_id ?? ''),
        name: String(patronRaw.name ?? patronRaw.username ?? 'Capitán'),
        boatName: (patronRaw.boatName || patronRaw.boat_name) ? String(patronRaw.boatName || patronRaw.boat_name) : undefined,
        boatType: (patronRaw.boatType || patronRaw.boat_type) ? String(patronRaw.boatType || patronRaw.boat_type) : undefined,
        averageRating: Number(patronRaw.averageRating ?? patronRaw.average_rating ?? patronRaw.rating ?? 0),
      }
    : hasFlatPatron
      ? {
          id: String(raw.patronId ?? raw.patron_id ?? ''),
          name: String(raw.patronName ?? raw.captainName ?? 'Capitán'),
          boatName: (raw.boatName || raw.boat_name) ? String(raw.boatName || raw.boat_name) : undefined,
          boatType: (raw.boatType || raw.boat_type) ? String(raw.boatType || raw.boat_type) : undefined,
          averageRating: Number(raw.averageRating ?? raw.average_rating ?? raw.rating ?? 0),
        }
      : undefined;

  const parsedDescription = parseTripDescription(raw.description);
  const departureTime = String(raw.route?.departureTime || raw.departureTime || raw.departure_time || '');
  const departureDateRaw = String(raw.route?.departureDate || raw.departureDate || raw.departure_date || '');
  const departureDate = departureDateRaw ? departureDateRaw.split('T')[0].split(' ')[0] : '';

  return {
    id: String(raw.id ?? ''),
    tripKind: parsedDescription.tripKind ?? 'trip',
    title: String(
      parsedDescription.title ||
        `${raw.route?.origin || raw.origin || ''} → ${raw.route?.destination || raw.destination || ''}` ||
        'Viaje',
    ),
    captainNote: parsedDescription.captainNote,
    boatImageUrl: parsedDescription.boatImageUrl,
    origin: String(raw.route?.origin || raw.origin || ''),
    destination: String(raw.route?.destination || raw.destination || ''),
    departureDate,
    departureTime,
    timeWindow: parsedDescription.timeWindow ?? inferTimeWindow(departureTime),
    availableSeats: Number(raw.availableSeats ?? raw.available_seats ?? 0),
    price: Number(raw.cost ?? raw.price ?? 0),
    contributionType: parsedDescription.contributionType,
    contributionNote: parsedDescription.contributionNote,
    patronId: String(raw.patronId ?? raw.patron_id ?? ''),
    status: (raw.status ?? 'active') as Trip['status'],
    patron,
  };
};

const encodeTripDescription = (payload: {
  title: string;
  tripKind?: Trip['tripKind'];
  captainNote?: string;
  boatImageUrl?: string;
  timeWindow?: Trip['timeWindow'];
  contributionType?: string;
  contributionNote?: string;
}): string => {
  const title = payload.title.trim();
  const metadata: Record<string, string> = {};

  if (payload.tripKind) metadata.tripKind = payload.tripKind;
  if (payload.captainNote) metadata.captainNote = payload.captainNote.trim();
  if (payload.boatImageUrl) metadata.boatImageUrl = payload.boatImageUrl.trim();
  if (payload.timeWindow) metadata.timeWindow = payload.timeWindow;
  if (payload.contributionType) metadata.contributionType = payload.contributionType.trim();
  if (payload.contributionNote) metadata.contributionNote = payload.contributionNote.trim();

  if (Object.keys(metadata).length === 0) {
    return title;
  }

  return `${title}\n[BSMETA]${JSON.stringify(metadata)}`;
};

const mapConversation = (raw: any): Conversation => ({
  id: String(raw?.id ?? raw?.conversationId ?? raw?.conversation_id ?? ''),
  tripId: raw?.tripId ?? raw?.trip_id ?? undefined,
  otherUserId: String(raw?.otherUserId ?? raw?.other_user_id ?? ''),
  otherUserName: String(raw?.otherUserName ?? raw?.other_user_name ?? ''),
  otherUserAvatar: normalizeAssetUrl(raw?.otherUserAvatar ?? raw?.other_user_avatar),
  lastMessage: raw?.lastMessage ?? raw?.last_message ?? undefined,
  lastMessageTime: String(raw?.lastMessageTime ?? raw?.last_message_time ?? ''),
  unreadCount: Number(raw?.unreadCount ?? raw?.unread_count ?? 0),
  updatedAt: String(raw?.updatedAt ?? raw?.updated_at ?? ''),
});

const mapMessage = (raw: any): Message => ({
  id: String(raw?.id ?? ''),
  conversationId: String(raw?.conversationId ?? raw?.conversation_id ?? ''),
  senderId: String(raw?.senderId ?? raw?.sender_id ?? ''),
  senderName: raw?.senderName ?? raw?.sender_name ?? undefined,
  senderAvatar: normalizeAssetUrl(raw?.senderAvatar ?? raw?.sender_avatar),
  content: String(raw?.content ?? ''),
  isRead: Boolean(raw?.isRead ?? raw?.is_read ?? false),
  createdAt: String(raw?.createdAt ?? raw?.created_at ?? ''),
});

const mapSupportMessage = (raw: any): SupportMessage => ({
  id: String(raw?.id ?? ''),
  userId: String(raw?.userId ?? raw?.user_id ?? ''),
  message: String(raw?.message ?? ''),
  adminReply:
    typeof raw?.adminReply === 'string' && raw.adminReply.trim()
      ? raw.adminReply.trim()
      : typeof raw?.admin_reply === 'string' && raw.admin_reply.trim()
        ? raw.admin_reply.trim()
        : undefined,
  status: raw?.status === 'answered' || raw?.status === 'closed' ? raw.status : 'open',
  createdAt: Number(raw?.createdAt ?? raw?.created_at ?? Date.now()),
  updatedAt: Number(raw?.updatedAt ?? raw?.updated_at ?? raw?.createdAt ?? raw?.created_at ?? Date.now()),
  repliedAt: raw?.repliedAt ?? raw?.replied_at ? Number(raw?.repliedAt ?? raw?.replied_at) : undefined,
});

const mapRegattaParticipant = (raw: any): RegattaParticipant => ({
  reservationId: raw?.reservationId ?? raw?.reservation_id ? String(raw?.reservationId ?? raw?.reservation_id) : undefined,
  userId: String(raw?.userId ?? raw?.user_id ?? ''),
  userName: String(raw?.userName ?? raw?.user_name ?? 'Capitán'),
  userAvatar: normalizeAssetUrl(raw?.userAvatar ?? raw?.user_avatar),
  status: String(raw?.status ?? 'pending'),
  joinedAt: raw?.joinedAt ?? raw?.joined_at ? String(raw?.joinedAt ?? raw?.joined_at) : undefined,
});

export const userService = {
  async register(payload: {name: string; email: string; password: string; role: Role}): Promise<User> {
    const {data} = await withPolicy(
      timeout => api.post('/users', payload, {timeout}),
      REQUEST_POLICIES.authWrite,
    );
    return mapUser(data);
  },
  async getAll(role?: Role): Promise<User[]> {
    const params = role ? { role } : {};
    const {data} = await withPolicy(
      timeout => api.get('/users', {params, timeout}),
      REQUEST_POLICIES.userRead,
    );
    return Array.isArray(data) ? data.map(mapUser) : [];
  },
  async login(payload: {email: string; password: string; role?: Role}): Promise<SessionData> {
    await warmUpBackend();
    const requestPayload = {
      email: payload.email,
      password: payload.password,
    };
    const {data} = await withPolicy(
      timeout => api.post('/users/login', requestPayload, {timeout}),
      REQUEST_POLICIES.authWrite,
    );
    return mapSessionData(data);
  },
  async getById(userId: string): Promise<User> {
    const {data} = await withPolicy(
      timeout => api.get(`/users/${userId}`, {timeout}),
      REQUEST_POLICIES.userRead,
    );
    return mapUser(data);
  },
  async update(
    userId: string,
    payload: Partial<Pick<User, 'name' | 'avatar' | 'bio' | 'boatName' | 'boatType'>> & {skills?: UserSkill[]},
  ): Promise<User> {
    const normalizedPayload = {
      ...payload,
      avatar: payload.avatar === undefined ? undefined : toServerAssetPath(payload.avatar) ?? payload.avatar,
    };

    const {data} = await withPolicy(
      async timeout => {
        try {
          return await api.patch(`/users/${userId}`, normalizedPayload, {timeout});
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            return api.put(`/users/${userId}`, normalizedPayload, {timeout});
          }
          throw error;
        }
      },
      REQUEST_POLICIES.userWrite,
    );
    return mapUser(data);
  },
  async uploadAvatar(
    userId: string,
    fileUri: string,
    options?: {filename?: string; mimeType?: string},
  ): Promise<string> {
    const normalizedUri = fileUri.trim();
    const fallbackFilename = normalizedUri.split('/').pop() || `avatar-${Date.now()}.jpg`;
    const filename = (options?.filename?.trim() || fallbackFilename).trim();
    const mimeType =
      options?.mimeType?.trim() ||
      (filename.toLowerCase().endsWith('.png')
        ? 'image/png'
        : filename.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg');

    const formData = new FormData();
    formData.append('avatar', {
      uri: normalizedUri,
      name: filename,
      type: mimeType,
    } as any);

    const postAvatar = (path: string, timeout: number) =>
      api.post(path, formData, {
        timeout,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

    let data: any;
    try {
      ({data} = await withPolicy(
        timeout => postAvatar(`/users/${userId}/avatar`, timeout),
        REQUEST_POLICIES.userWrite,
      ));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        try {
          ({data} = await withPolicy(
            timeout => postAvatar(`/users/avatar/${userId}`, timeout),
            REQUEST_POLICIES.userWrite,
          ));
        } catch (legacyError) {
          if (axios.isAxiosError(legacyError) && legacyError.response?.status === 404) {
            throw new Error('El backend publicado no tiene activa la subida de foto de perfil. Hay que desplegar la API actualizada.');
          }
          throw legacyError;
        }
      } else {
        throw error;
      }
    }

    return toServerAssetPath(data?.avatar) || '';
  },
};

export const tripService = {
  async getAll(): Promise<Trip[]> {
    const {data} = await withPolicy(
      timeout => api.get('/trips', {timeout}),
      REQUEST_POLICIES.tripRead,
    );
    return Array.isArray(data) ? data.map(mapTrip) : [];
  },
  async getById(tripId: string): Promise<Trip> {
    const {data} = await withPolicy(
      timeout => api.get(`/trips/${tripId}`, {timeout}),
      REQUEST_POLICIES.tripRead,
    );
    return mapTrip(data);
  },
  async create(payload: {
    tripKind?: Trip['tripKind'];
    title: string;
    captainNote?: string;
    boatImageUrl?: string;
    origin: string;
    destination: string;
    departureDate: string;
    availableSeats: number;
    price: number;
    patronId: string;
    timeWindow?: Trip['timeWindow'];
    contributionType?: string;
    contributionNote?: string;
  }): Promise<Trip> {
    const [datePart, timePart] = payload.departureDate.split(' ');

    const requestBody = {
      actorId: payload.patronId,
      patronId: payload.patronId,
      route: {
        origin: payload.origin,
        destination: payload.destination,
        departureDate: datePart || payload.departureDate,
        departureTime: timePart || '10:00:00',
        estimatedDuration: '',
      },
      description: encodeTripDescription({
        title: payload.title,
        tripKind: payload.tripKind,
        captainNote: payload.captainNote,
        boatImageUrl: toServerAssetPath(payload.boatImageUrl) ?? payload.boatImageUrl,
        timeWindow: payload.timeWindow,
        contributionType: payload.contributionType,
        contributionNote: payload.contributionNote,
      }),
      availableSeats: payload.availableSeats,
      cost: payload.price,
    };

    const {data} = await withPolicy(
      timeout => api.post('/trips', requestBody, {timeout}),
      REQUEST_POLICIES.tripWrite,
    );
    return mapTrip(data);
  },
  async update(tripId: string, payload: Partial<{
    actorId: string;
    title: string;
    tripKind: Trip['tripKind'];
    captainNote: string;
    boatImageUrl: string;
    origin: string;
    destination: string;
    departureDate: string;
    departureTime: string;
    availableSeats: number;
    price: number;
    timeWindow: Trip['timeWindow'];
    contributionType: string;
    contributionNote: string;
  }>): Promise<Trip> {
    const requestBody: any = {};

    if (payload.actorId !== undefined) requestBody.actorId = payload.actorId;

    if (
      payload.title !== undefined ||
      payload.tripKind !== undefined ||
      payload.captainNote !== undefined ||
      payload.boatImageUrl !== undefined ||
      payload.timeWindow !== undefined ||
      payload.contributionType !== undefined ||
      payload.contributionNote !== undefined
    ) {
      requestBody.description = encodeTripDescription({
        title: payload.title ?? '',
        tripKind: payload.tripKind,
        captainNote: payload.captainNote,
        boatImageUrl: toServerAssetPath(payload.boatImageUrl) ?? payload.boatImageUrl,
        timeWindow: payload.timeWindow,
        contributionType: payload.contributionType,
        contributionNote: payload.contributionNote,
      });
    }
    if (
      payload.origin !== undefined ||
      payload.destination !== undefined ||
      payload.departureDate !== undefined ||
      payload.departureTime !== undefined
    ) {
      requestBody.route = {
        ...(payload.origin !== undefined ? {origin: payload.origin} : {}),
        ...(payload.destination !== undefined ? {destination: payload.destination} : {}),
        ...(payload.departureDate !== undefined ? {departureDate: payload.departureDate} : {}),
        ...(payload.departureTime !== undefined ? {departureTime: payload.departureTime} : {}),
      };
    }
    if (payload.availableSeats !== undefined) requestBody.availableSeats = payload.availableSeats;
    if (payload.price !== undefined) requestBody.cost = payload.price;

    const {data} = await withPolicy(
      timeout => api.patch(`/trips/${tripId}`, requestBody, {timeout}),
      REQUEST_POLICIES.tripWrite,
    );
    return mapTrip(data);
  },
  async cancel(tripId: string): Promise<void> {
    throw new Error('actorId es requerido para cancelar viaje');
  },
  async cancelWithActor(tripId: string, actorId: string): Promise<void> {
    await withPolicy(
      timeout => api.patch(`/trips/${tripId}`, { status: 'cancelled', actorId }, {timeout}),
      REQUEST_POLICIES.tripWrite,
    );
  },
  async deleteWithActor(tripId: string, actorId: string): Promise<void> {
    await withPolicy(
      timeout => api.delete(`/trips/${tripId}`, {params: {actorId}, timeout}),
      REQUEST_POLICIES.tripWrite,
    );
  },
  async uploadImage(
    ownerId: string,
    imageUri: string,
    options?: {filename?: string; mimeType?: string; imageKind?: 'trip' | 'regatta'},
  ): Promise<string> {
    const normalizedUri = imageUri.trim();
    if (!normalizedUri) {
      throw new Error('La imagen es requerida');
    }

    const fallbackFilename = normalizedUri.split('/').pop() || `trip-${Date.now()}.jpg`;
    const normalizedFilename = options?.filename?.trim() || fallbackFilename;
    const mimeType =
      options?.mimeType?.trim() ||
      (normalizedFilename.toLowerCase().endsWith('.png')
        ? 'image/png'
        : normalizedFilename.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg');

    const formData = new FormData();
    formData.append('image', {
      uri: normalizedUri,
      name: normalizedFilename,
      type: mimeType,
    } as any);

    let data: any;
    try {
      ({data} = await withPolicy(
        timeout =>
          api.post('/trips/upload-image', formData, {
            timeout,
            headers: {
              'Content-Type': 'multipart/form-data',
              'x-user-id': ownerId,
              'x-image-kind': options?.imageKind === 'regatta' ? 'regatta' : 'trip',
            },
          }),
        REQUEST_POLICIES.tripWrite,
      ));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('La API activa no tiene disponible la subida de imagen todavía.');
      }
      throw error;
    }

    return toServerAssetPath(data?.image) || '';
  },
};

export const boatService = {
  async getAll(patronId?: string): Promise<Boat[]> {
    const params = patronId ? { patronId } : {};
    const {data} = await withPolicy(
      timeout => api.get('/boats', {params, timeout}),
      REQUEST_POLICIES.miscRead,
    );
    return Array.isArray(data) ? data.map(mapBoat) : [];
  },
  async getById(boatId: string): Promise<Boat> {
    const {data} = await withPolicy(
      timeout => api.get(`/boats/${boatId}`, {timeout}),
      REQUEST_POLICIES.miscRead,
    );
    return mapBoat(data);
  },
  async create(payload: {
    patronId: string;
    name: string;
    type: string;
    capacity: number;
    length?: number;
    yearBuilt?: number;
    fuelType?: string;
    licenseNumber?: string;
    safetyEquipment: string[];
    description: string;
  }): Promise<Boat> {
    const {data} = await withPolicy(
      timeout => api.post('/boats', {...payload, actorId: payload.patronId}, {timeout}),
      REQUEST_POLICIES.miscWrite,
    );
    return mapBoat(data);
  },
  async update(
    boatId: string,
    payload: Partial<Omit<Boat, 'id' | 'patronId' | 'createdAt'>> & {actorId: string}
  ): Promise<Boat> {
    const {data} = await withPolicy(
      timeout => api.patch(`/boats/${boatId}`, payload, {timeout}),
      REQUEST_POLICIES.miscWrite,
    );
    return mapBoat(data);
  },
  async delete(boatId: string, actorId: string): Promise<void> {
    await withPolicy(
      timeout => api.delete(`/boats/${boatId}`, {params: {actorId}, timeout}),
      REQUEST_POLICIES.miscWrite,
    );
  },
};

export const ratingService = {
  async submitRating(payload: {
    userId: string;
    ratedBy: string;
    rating: number;
    comment?: string;
  }): Promise<Rating> {
    const {data} = await withPolicy(
      timeout => api.post('/ratings', payload, {timeout}),
      REQUEST_POLICIES.miscWrite,
    );
    return data;
  },
  async getRatings(userId: string): Promise<{
    ratings: Rating[];
    averageRating: number;
    reviewCount: number;
  }> {
    const {data} = await withPolicy(
      timeout => api.get(`/ratings/user/${userId}`, {timeout}),
      REQUEST_POLICIES.miscRead,
    );
    return data;
  },
  async getRatingsByUser(userId: string): Promise<Rating[]> {
    const {data} = await withPolicy(
      timeout => api.get(`/ratings/from/${userId}`, {timeout}),
      REQUEST_POLICIES.miscRead,
    );
    return Array.isArray(data) ? data : [];
  },
};

export const reservationService = {
  async createReservation(payload: {tripId: string; userId: string; seats?: number}): Promise<any> {
    const {data} = await withPolicy(
      timeout => api.post('/reservations', payload, {timeout}),
      REQUEST_POLICIES.reservationWrite,
    );
    return data;
  },
  async getUserReservations(userId: string): Promise<any[]> {
    const {data} = await withPolicy(
      timeout => api.get(`/reservations?userId=${userId}`, {timeout}),
      REQUEST_POLICIES.reservationRead,
    );
    return Array.isArray(data) ? data : [];
  },
  async getTripReservations(tripId: string): Promise<any[]> {
    const {data} = await withPolicy(
      timeout => api.get(`/reservations?tripId=${tripId}`, {timeout}),
      REQUEST_POLICIES.reservationRead,
    );
    return Array.isArray(data) ? data : [];
  },
  async updateReservation(id: string, status: string): Promise<any> {
    const {data} = await withPolicy(
      timeout => api.patch(`/reservations/${id}`, {status}, {timeout}),
      REQUEST_POLICIES.reservationWrite,
    );
    return data;
  },
};

export const messageService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    const {data} = await withPolicy(
      timeout => api.get(`/messages/conversations/${userId}`, {timeout}),
      REQUEST_POLICIES.chatRead,
    );
    return Array.isArray(data) ? data.map(mapConversation).filter(c => c.id) : [];
  },
  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0): Promise<Message[]> {
    const {data} = await withPolicy(
      timeout =>
        api.get(`/messages/conversation/${conversationId}/messages?limit=${limit}&offset=${offset}&userId=${encodeURIComponent(userId)}`, {
          timeout,
        }),
      REQUEST_POLICIES.chatRead,
    );
    return Array.isArray(data) ? data.map(mapMessage).filter(m => m.id) : [];
  },
  async sendMessage(payload: {conversationId: string; senderId: string; content: string}): Promise<Message> {
    if (!payload.conversationId || !payload.senderId || !payload.content?.trim()) {
      throw new Error('Payload de mensaje invalido');
    }

    const {data} = await withPolicy(
      timeout => api.post('/messages/send', payload, {timeout}),
      REQUEST_POLICIES.chatWrite,
    );
    const message = mapMessage(data);
    if (!message.id) {
      throw new Error('Respuesta invalida al enviar mensaje');
    }
    return message;
  },
  async createOrGetConversation(payload: {userId1: string; userId2: string; tripId?: string}): Promise<{id: string; created: boolean}> {
    if (!payload.userId1 || !payload.userId2) {
      throw new Error('Usuarios invalidos para crear chat');
    }

    const findExistingConversation = async () => {
      const existing = await messageService.getConversations(payload.userId1);
      const exactTripMatch = existing.find(conversation => {
        const sameUser = String(conversation.otherUserId || '') === String(payload.userId2);
        const sameTrip = String(conversation.tripId || '') === String(payload.tripId || '');
        return sameUser && sameTrip;
      });

      if (exactTripMatch?.id) {
        return {id: exactTripMatch.id, created: false};
      }

      const directMatch = existing.find(conversation => {
        const sameUser = String(conversation.otherUserId || '') === String(payload.userId2);
        const noTrip = !conversation.tripId;
        return sameUser && noTrip;
      });

      if (directMatch?.id) {
        return {id: directMatch.id, created: false};
      }

      return null;
    };

    const existingConversation = await findExistingConversation().catch(() => null);
    if (existingConversation) {
      return existingConversation;
    }

    const primaryPayload = {
      ...payload,
      tripId: payload.tripId || null,
    };

    try {
      const {data} = await withPolicy(
        timeout => api.post('/messages/conversation', primaryPayload, {timeout}),
        REQUEST_POLICIES.chatWrite,
      );
      if (!data?.id) throw new Error('Respuesta invalida de conversacion');
      return {id: String(data.id), created: Boolean(data.created)};
    } catch (error) {
      const fallbackExistingConversation = await findExistingConversation().catch(() => null);
      if (fallbackExistingConversation) {
        return fallbackExistingConversation;
      }

      // Fallback defensivo: si falla por tripId, reintenta chat directo entre usuarios.
      if (payload.tripId) {
        const {data} = await withPolicy(
          timeout =>
            api.post(
              '/messages/conversation',
              {
                userId1: payload.userId1,
                userId2: payload.userId2,
                tripId: null,
              },
              {timeout},
            ),
          REQUEST_POLICIES.chatWrite,
        );
        if (!data?.id) throw error;
        return {id: String(data.id), created: Boolean(data.created)};
      }
      throw error;
    }
  },

  async markMessageAsRead(messageId: string): Promise<void> {
    await withPolicy(
      timeout => api.patch(`/messages/${messageId}/read`, undefined, {timeout}),
      REQUEST_POLICIES.chatWrite,
    );
  },
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    await withPolicy(
      timeout => api.patch(`/messages/conversation/${conversationId}/read-all`, {userId}, {timeout}),
      REQUEST_POLICIES.chatRead,
    );
  },
  async getBlockStatus(userId: string, otherUserId: string): Promise<{blocked: boolean; blockedByMe: boolean; blockedByOther: boolean}> {
    const {data} = await withPolicy(
      timeout => api.get('/messages/block/status', {params: {userId, otherUserId}, timeout}),
      REQUEST_POLICIES.chatRead,
    );
    return {
      blocked: Boolean(data?.blocked),
      blockedByMe: Boolean(data?.blockedByMe),
      blockedByOther: Boolean(data?.blockedByOther),
    };
  },
  async blockUser(payload: {blockerId: string; blockedUserId: string; reason?: string}): Promise<void> {
    await withPolicy(
      timeout => api.post('/messages/block', payload, {timeout}),
      REQUEST_POLICIES.chatWrite,
    );
  },
  async unblockUser(payload: {blockerId: string; blockedUserId: string}): Promise<void> {
    await withPolicy(
      timeout => api.delete('/messages/block', {data: payload, timeout}),
      REQUEST_POLICIES.chatWrite,
    );
  },
  async reportUser(payload: {
    reporterId: string;
    reportedUserId: string;
    conversationId?: string;
    messageId?: string;
    reason: string;
    details?: string;
  }): Promise<{id: string; status: string}> {
    const {data} = await withPolicy(
      timeout => api.post('/messages/report', payload, {timeout}),
      REQUEST_POLICIES.chatWrite,
    );
    return {
      id: String(data?.id ?? ''),
      status: String(data?.status ?? ''),
    };
  },
  async getRegattaChatState(tripId: string, userId: string): Promise<RegattaChatState> {
    const {data} = await withPolicy(
      timeout => api.get(`/messages/regatta/${tripId}/chat`, {params: {userId}, timeout}),
      REQUEST_POLICIES.chatRead,
    );
    return {
      conversationId: String(data?.conversationId ?? ''),
      participants: Array.isArray(data?.participants) ? data.participants.map(mapRegattaParticipant) : [],
    };
  },
  async getRegattaMessages(tripId: string, userId: string, limit = 100, offset = 0): Promise<Message[]> {
    const {data} = await withPolicy(
      timeout => api.get(`/messages/regatta/${tripId}/chat/messages`, {params: {userId, limit, offset}, timeout}),
      REQUEST_POLICIES.chatRead,
    );
    return Array.isArray(data) ? data.map(mapMessage).filter(m => m.id) : [];
  },
  async sendRegattaMessage(tripId: string, payload: {userId: string; content: string}): Promise<Message> {
    const {data} = await withPolicy(
      timeout => api.post(`/messages/regatta/${tripId}/chat/messages`, payload, {timeout}),
      REQUEST_POLICIES.chatWrite,
    );
    return mapMessage(data);
  },
  async subscribeToConversationMessages(
    conversationId: string,
    listener: (message: Message) => void,
  ): Promise<() => void> {
    const normalizedConversationId = String(conversationId || '').trim();
    const socket = getRealtimeSocket();

    if (!normalizedConversationId || !socket) {
      return () => {};
    }

    const eventName = 'conversation:message';
    const handleMessage = (payload: any) => {
      if (String(payload?.conversationId ?? '') !== normalizedConversationId) {
        return;
      }
      const mapped = mapMessage(payload);
      if (mapped.id) {
        listener(mapped);
      }
    };

    const joinConversation = () => new Promise<boolean>((resolve) => {
      socket.emit('conversation:join', {conversationId: normalizedConversationId}, (response: any) => {
        resolve(Boolean(response?.ok));
      });
    });

    if (!socket.connected) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), SOCKET_CONNECT_TIMEOUT_MS);
        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.once('connect_error', () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.connect();
      });
    }

    const joined = socket.connected ? await joinConversation() : false;
    if (!joined) {
      return () => {};
    }

    socket.on(eventName, handleMessage);

    return () => {
      socket.off(eventName, handleMessage);
      socket.emit('conversation:leave', {conversationId: normalizedConversationId});
    };
  },
};

export const favoriteService = {
  async getUserFavorites(userId: string): Promise<any[]> {
    const {data} = await withPolicy(
      timeout => api.get(`/favorites/${userId}`, {timeout}),
      REQUEST_POLICIES.miscRead,
    );
    return Array.isArray(data) ? data : [];
  },
  async isFavorite(userId: string, favoriteUserId: string): Promise<boolean> {
    const favorites = await favoriteService.getUserFavorites(userId);
    return favorites.some(item => String(item?.id ?? item?.favoriteUserId ?? item?.favorite_user_id ?? '') === String(favoriteUserId));
  },
  async addFavorite(userId: string, favoriteUserId: string): Promise<any> {
    const {data} = await withPolicy(
      timeout => api.post('/favorites', {userId, favoriteUserId}, {timeout}),
      REQUEST_POLICIES.miscWrite,
    );
    return data;
  },
  async removeFavorite(userId: string, favoriteUserId: string): Promise<void> {
    await withPolicy(
      timeout => api.delete(`/favorites/${userId}/${favoriteUserId}`, {timeout}),
      REQUEST_POLICIES.miscWrite,
    );
  },
};

export const donationService = {
  async createDonation(payload: {userId: string; amount: number; paypalTransactionId?: string}): Promise<any> {
    const {data} = await withPolicy(
      timeout => api.post('/donations', payload, {timeout}),
      REQUEST_POLICIES.paymentWrite,
    );
    return data;
  },
  async getUserDonations(userId: string): Promise<{donations: any[]; total: number; count: number}> {
    const {data} = await withPolicy(
      timeout => api.get(`/donations/user/${userId}`, {timeout}),
      REQUEST_POLICIES.paymentRead,
    );
    return data;
  },
};

export const supportMessageService = {
  async getUserMessages(userId: string): Promise<SupportMessage[]> {
    try {
      const {data} = await withPolicy(
        timeout => api.get(`/support-messages/user/${userId}`, {timeout}),
        REQUEST_POLICIES.miscRead,
      );
      return Array.isArray(data) ? data.map(mapSupportMessage).filter(item => item.id) : [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
  async createMessage(payload: {userId: string; message: string}): Promise<SupportMessage> {
    try {
      const {data} = await withPolicy(
        timeout => api.post('/support-messages', payload, {timeout}),
        REQUEST_POLICIES.miscWrite,
      );
      return mapSupportMessage(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('El buzon de mejora todavia no esta disponible en la API publicada.');
      }
      throw error;
    }
  },
  async deleteMessage(id: string): Promise<void> {
    try {
      await withPolicy(
        timeout => api.delete(`/support-messages/${id}`, {timeout}),
        REQUEST_POLICIES.miscWrite,
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('El buzon de mejora todavia no esta disponible en la API publicada.');
      }
      throw error;
    }
  },
};

export const tripCheckpointService = {
  async listByTrip(tripId: string, limit = 100): Promise<any[]> {
    const {data} = await withPolicy(
      timeout => api.get(`/trip-checkpoints?tripId=${tripId}&limit=${limit}`, {timeout}),
      REQUEST_POLICIES.miscRead,
    );
    return Array.isArray(data) ? data : [];
  },
  async create(payload: {tripId: string; userId: string; checkpointType: 'start' | 'mid' | 'arrival' | 'event'; note?: string}): Promise<any> {
    const {data} = await withPolicy(
      timeout => api.post('/trip-checkpoints', payload, {timeout}),
      REQUEST_POLICIES.miscWrite,
    );
    return data;
  },
};

export default api;
