import axios from 'axios';
import type {Role, SessionData, Trip, User, UserSkill, Boat, Rating, Message, Conversation, Patron} from '../types';
import {API_BASE_URL, API_ORIGIN} from '../config/apiConfig';

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
  chatRead: {retries: 2, delayMs: 300, timeoutMs: 6000},
  chatWrite: {retries: 2, delayMs: 500, timeoutMs: 15000},
  reservationRead: {retries: 1, delayMs: 350, timeoutMs: 7000},
  reservationWrite: {retries: 2, delayMs: 400, timeoutMs: 9000},
  userRead: {retries: 1, delayMs: 350, timeoutMs: 8000},
  userWrite: {retries: 1, delayMs: 400, timeoutMs: 10000},
  tripRead: {retries: 1, delayMs: 350, timeoutMs: 9000},
  tripWrite: {retries: 1, delayMs: 450, timeoutMs: 12000},
  miscRead: {retries: 1, delayMs: 350, timeoutMs: 9000},
  miscWrite: {retries: 1, delayMs: 450, timeoutMs: 12000},
  paymentRead: {retries: 1, delayMs: 400, timeoutMs: 9000},
  paymentWrite: {retries: 1, delayMs: 450, timeoutMs: 12000},
} as const satisfies Record<string, RequestPolicy>;

const normalizeAssetUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^(https?:\/\/|content:\/\/|file:\/\/|ph:\/\/|assets-library:\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  if (/^uploads\//i.test(trimmed)) {
    return `${API_ORIGIN}/${trimmed}`;
  }

  return trimmed;
};

const toServerAssetPath = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('/uploads/')) return trimmed;
  if (/^uploads\//i.test(trimmed)) return `/${trimmed}`;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads/')) {
        return parsed.pathname;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
};

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
  id: String(raw?.id ?? raw?.userId ?? ''),
  name: String(raw?.name ?? ''),
  email: String(raw?.email ?? ''),
  role: normalizeRole(raw?.role),
  avatar: normalizeAssetUrl(raw?.avatar) ?? null,
  bio: raw?.bio ?? null,
  boatName: raw?.boatName ?? raw?.boat_name ?? null,
  boatType: raw?.boatType ?? raw?.boat_type ?? null,
  skills: Array.isArray(raw?.skills) ? raw.skills : [],
  rating: typeof raw?.rating === 'number' ? raw.rating : (raw?.average_rating ? Number(raw.average_rating) : undefined),
  reviewCount: typeof raw?.reviewCount === 'number' ? raw.reviewCount : (raw?.total_ratings ? Number(raw.total_ratings) : undefined),
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

export const setAuthToken = (token: string | null) => {
  authToken = token;
  console.log('[API] Token configurado:', token ? 'Sí' : 'No');
};

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers.Authorization ? '✓ Token' : '✗ Sin token',
    });
    return config;
  },
  (error) => {
    console.error('[API] Error en request interceptor:', error);
    return Promise.reject(error);
  },
);

// Interceptor para loguear respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] ❌ ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.error('[API] ❌ No response:', error.message);
    } else {
      console.error('[API] ❌ Request error:', error.message);
    }
    return Promise.reject(error);
  },
);

const mapBoat = (raw: any): Boat => {
  if (!raw || typeof raw !== 'object') {
    console.warn('Invalid boat data:', raw);
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
    const contributionType =
      typeof parsed?.contributionType === 'string' && parsed.contributionType.trim()
        ? parsed.contributionType.trim()
        : undefined;
    const contributionNote =
      typeof parsed?.contributionNote === 'string' && parsed.contributionNote.trim()
        ? parsed.contributionNote.trim()
        : undefined;

    return {title, timeWindow, contributionType, contributionNote};
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
    console.warn('Invalid trip data:', raw);
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
  const hasFlatPatron = raw.patronName || raw.captainName || raw.boatName || raw.boatType || raw.patron_name;

  let patron: Patron | undefined;

  if (patronRaw) {
    patron = {
      id: String(patronRaw.id ?? patronRaw.userId ?? raw.patronId ?? raw.patron_id ?? ''),
      name: String(patronRaw.name ?? patronRaw.username ?? 'Capitán'),
      boatName: patronRaw.boatName || patronRaw.boat_name ? String(patronRaw.boatName || patronRaw.boat_name) : undefined,
      boatType: patronRaw.boatType || patronRaw.boat_type ? String(patronRaw.boatType || patronRaw.boat_type) : undefined,
      averageRating: Number(patronRaw.averageRating ?? patronRaw.rating ?? patronRaw.average_rating ?? 0),
    };
  } else if (hasFlatPatron) {
    patron = {
      id: String(raw.patronId ?? raw.patron_id ?? ''),
      name: String(raw.patronName ?? raw.patron_name ?? raw.captainName ?? 'Capitán'),
      boatName: raw.boatName || raw.boat_name ? String(raw.boatName || raw.boat_name) : undefined,
      boatType: raw.boatType || raw.boat_type ? String(raw.boatType || raw.boat_type) : undefined,
      averageRating: Number(raw.averageRating ?? raw.rating ?? raw.average_rating ?? 0),
    };
  }

  const parsedDescription = parseTripDescription(raw.description);
  const departureTime = String(raw.route?.departureTime || raw.departureTime || raw.departure_time || '');

  return {
    id: String(raw.id ?? ''),
    title: String(
      parsedDescription.title ||
        `${raw.route?.origin || raw.origin || ''} → ${raw.route?.destination || raw.destination || ''}` ||
        'Viaje',
    ),
    origin: String(raw.route?.origin || raw.origin || ''),
    destination: String(raw.route?.destination || raw.destination || ''),
    departureDate: String(raw.route?.departureDate || raw.departureDate || raw.departure_date || ''),
    departureTime,
    timeWindow: parsedDescription.timeWindow ?? inferTimeWindow(departureTime),
    availableSeats: Number(raw.availableSeats ?? raw.available_seats ?? 0),
    price: Number(raw.cost ?? raw.price ?? 0),
    contributionType: parsedDescription.contributionType,
    contributionNote: parsedDescription.contributionNote,
    patronId: String(raw.patronId ?? raw.patron_id ?? patron?.id ?? ''),
    status: (raw.status ?? 'active') as Trip['status'],
    patron,
  };
};

const encodeTripDescription = (payload: {
  title: string;
  timeWindow?: Trip['timeWindow'];
  contributionType?: string;
  contributionNote?: string;
}): string => {
  const title = payload.title.trim();
  const metadata: Record<string, string> = {};

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
    title: string;
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

    if (payload.title !== undefined) {
      requestBody.description = encodeTripDescription({
        title: payload.title,
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
    await api.patch(`/trips/${tripId}`, { status: 'cancelled', actorId });
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
};

export const favoriteService = {
  async getUserFavorites(userId: string): Promise<any[]> {
    const {data} = await api.get(`/favorites/${userId}`);
    return Array.isArray(data) ? data : [];
  },
  async addFavorite(userId: string, favoriteUserId: string): Promise<any> {
    const {data} = await api.post('/favorites', {userId, favoriteUserId});
    return data;
  },
  async removeFavorite(userId: string, favoriteUserId: string): Promise<void> {
    await api.delete(`/favorites/${userId}/${favoriteUserId}`);
  },
  async isFavorite(userId: string, favoriteUserId: string): Promise<boolean> {
    try {
      const {data} = await api.get(`/favorites/${userId}/${favoriteUserId}/check`);
      return data.isFavorite || false;
    } catch {
      return false;
    }
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

export const tripCheckpointService = {
  async listByTrip(tripId: string, limit = 100): Promise<any[]> {
    const {data} = await api.get(`/trip-checkpoints?tripId=${tripId}&limit=${limit}`);
    return Array.isArray(data) ? data : [];
  },
  async create(payload: {tripId: string; userId: string; checkpointType: 'start' | 'mid' | 'arrival' | 'event'; note?: string}): Promise<any> {
    const {data} = await api.post('/trip-checkpoints', payload);
    return data;
  },
};

export default api;
