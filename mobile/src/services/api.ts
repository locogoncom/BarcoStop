import axios from 'axios';
import type {Role, SessionData, Trip, User, UserSkill, Boat, Rating, Message, Conversation, Patron} from '../types';
import {API_BASE_URL} from '../config/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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
    patronId: String(raw.patronId ?? raw.patron_id ?? patron?.id ?? ''),
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
  const hasFlatPatron = raw.patronName || raw.captainName || raw.boatName || raw.boatType;
  const patron: Patron | undefined = patronRaw
    ? {
        id: String(patronRaw.id ?? patronRaw.userId ?? raw.patronId ?? raw.patron_id ?? ''),
        name: String(patronRaw.name ?? patronRaw.username ?? 'Capitán'),
        boatName: patronRaw.boatName ? String(patronRaw.boatName) : undefined,
        boatType: patronRaw.boatType ? String(patronRaw.boatType) : undefined,
        averageRating: Number(patronRaw.averageRating ?? patronRaw.rating ?? 0),
      }
    : hasFlatPatron
      ? {
          id: String(raw.patronId ?? raw.patron_id ?? ''),
          name: String(raw.patronName ?? raw.captainName ?? 'Capitán'),
          boatName: raw.boatName ? String(raw.boatName) : undefined,
          boatType: raw.boatType ? String(raw.boatType) : undefined,
          averageRating: Number(raw.averageRating ?? raw.rating ?? 0),
        }
    : undefined;

  return {
    id: String(raw.id ?? ''),
    title: String(raw.description || `${raw.route?.origin || raw.origin || ''} → ${raw.route?.destination || raw.destination || ''}` || 'Viaje'),
    origin: String(raw.route?.origin || raw.origin || ''),
    destination: String(raw.route?.destination || raw.destination || ''),
    departureDate: String(raw.route?.departureDate || raw.departureDate || raw.departure_date || ''),
    departureTime: String(raw.route?.departureTime || raw.departureTime || raw.departure_time || ''),
    availableSeats: Number(raw.availableSeats ?? raw.available_seats ?? 0),
    price: Number(raw.cost ?? raw.price ?? 0),
    patronId: String(raw.patronId ?? raw.patron_id ?? ''),
    status: (raw.status ?? 'active') as Trip['status'],
    patron,
  };
};

export const userService = {
  async register(payload: {name: string; email: string; role: Role}): Promise<User> {
    const {data} = await api.post('/users', payload);
    return data;
  },
  async getAll(role?: Role): Promise<User[]> {
    const params = role ? { role } : {};
    const {data} = await api.get('/users', { params });
    return Array.isArray(data) ? data : [];
  },
  async login(payload: {email: string; role: Role}): Promise<SessionData> {
    const {data} = await api.post('/users/login', payload);
    return data;
  },
  async getById(userId: string): Promise<User> {
    const {data} = await api.get(`/users/${userId}`);
    return data;
  },
  async update(
    userId: string,
    payload: Partial<Pick<User, 'name' | 'bio' | 'boatName' | 'boatType'>> & {skills?: UserSkill[]},
  ): Promise<User> {
    const {data} = await api.patch(`/users/${userId}`, payload);
    return data;
  },
};

export const tripService = {
  async getAll(): Promise<Trip[]> {
    const {data} = await api.get('/trips');
    return Array.isArray(data) ? data.map(mapTrip) : [];
  },
  async getById(tripId: string): Promise<Trip> {
    const {data} = await api.get(`/trips/${tripId}`);
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
      description: payload.title,
      availableSeats: payload.availableSeats,
      cost: payload.price,
    };

    const {data} = await api.post('/trips', requestBody);
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
  }>): Promise<Trip> {
    const requestBody: any = {};

    if (payload.actorId !== undefined) requestBody.actorId = payload.actorId;

    if (payload.title !== undefined) requestBody.description = payload.title;
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

    const {data} = await api.patch(`/trips/${tripId}`, requestBody);
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
    const {data} = await api.get('/boats', { params });
    return Array.isArray(data) ? data.map(mapBoat) : [];
  },
  async getById(boatId: string): Promise<Boat> {
    const {data} = await api.get(`/boats/${boatId}`);
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
    const {data} = await api.post('/boats', {...payload, actorId: payload.patronId});
    return mapBoat(data);
  },
  async update(
    boatId: string,
    payload: Partial<Omit<Boat, 'id' | 'patronId' | 'createdAt'>> & {actorId: string}
  ): Promise<Boat> {
    const {data} = await api.patch(`/boats/${boatId}`, payload);
    return mapBoat(data);
  },
  async delete(boatId: string, actorId: string): Promise<void> {
    await api.delete(`/boats/${boatId}`, {params: {actorId}});
  },
};

export const ratingService = {
  async submitRating(payload: {
    userId: string;
    ratedBy: string;
    rating: number;
    comment?: string;
  }): Promise<Rating> {
    const {data} = await api.post('/ratings', payload);
    return data;
  },
  async getRatings(userId: string): Promise<{
    ratings: Rating[];
    averageRating: number;
    reviewCount: number;
  }> {
    const {data} = await api.get(`/ratings/user/${userId}`);
    return data;
  },
  async getRatingsByUser(userId: string): Promise<Rating[]> {
    const {data} = await api.get(`/ratings/from/${userId}`);
    return Array.isArray(data) ? data : [];
  },
};

export const reservationService = {
  async createReservation(payload: {tripId: string; userId: string; seats?: number}): Promise<any> {
    const {data} = await api.post('/reservations', payload);
    return data;
  },
  async getUserReservations(userId: string): Promise<any[]> {
    const {data} = await api.get(`/reservations?userId=${userId}`);
    return Array.isArray(data) ? data : [];
  },
  async getTripReservations(tripId: string): Promise<any[]> {
    const {data} = await api.get(`/reservations?tripId=${tripId}`);
    return Array.isArray(data) ? data : [];
  },
  async updateReservation(id: string, status: string): Promise<any> {
    const {data} = await api.patch(`/reservations/${id}`, {status});
    return data;
  },
};

export const messageService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    const {data} = await api.get(`/messages/conversations/${userId}`);
    return Array.isArray(data) ? data : [];
  },
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const {data} = await api.get(`/messages/conversation/${conversationId}/messages?limit=${limit}&offset=${offset}`);
    return Array.isArray(data) ? data : [];
  },
  async sendMessage(payload: {conversationId: string; senderId: string; content: string}): Promise<Message> {
    const {data} = await api.post('/messages/send', payload);
    return data;
  },
  async createOrGetConversation(payload: {userId1: string; userId2: string; tripId?: string}): Promise<{id: string; created: boolean}> {
    const {data} = await api.post('/messages/conversation', payload);
    return data;
  },
  async markMessageAsRead(messageId: string): Promise<void> {
    await api.patch(`/messages/${messageId}/read`);
  },
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    await api.patch(`/messages/conversation/${conversationId}/read-all`, {userId});
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
    const {data} = await api.post('/donations', payload);
    return data;
  },
  async getUserDonations(userId: string): Promise<{donations: any[]; total: number; count: number}> {
    const {data} = await api.get(`/donations/user/${userId}`);
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
