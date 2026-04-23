import axios from 'axios';
import { User, Trip, Reservation, Message } from '../types';

const normalizeApiUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

const envApiUrl = normalizeApiUrl((import.meta as any)?.env?.VITE_API_URL);
const API_URL = envApiUrl ?? 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users
export const userAPI = {
  register: (user: User) => api.post('/users', user),
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
};

// Trips
export const tripAPI = {
  create: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => api.post('/trips', trip),
  getAll: () => api.get('/trips'),
  getById: (id: string) => api.get(`/trips/${id}`),
  getByPatron: (patronId: string) => api.get('/trips', { params: { patronId } }),
};

// Reservations
export const reservationAPI = {
  create: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => api.post('/reservations', reservation),
  getAll: () => api.get('/reservations'),
  getByTrip: (tripId: string) => api.get('/reservations', { params: { tripId } }),
  getByUser: (userId: string) => api.get('/reservations', { params: { userId } }),
  update: (id: string, updates: Partial<Reservation>) => api.patch(`/reservations/${id}`, updates),
};

// Messages
export const messageAPI = {
  send: (message: Omit<Message, 'id' | 'createdAt'>) => api.post('/messages', message),
  getByConversation: (conversationId: string) => api.get(`/messages/${conversationId}`),
  getUserConversations: (userId: string) => api.get('/messages', { params: { userId } }),
};

export default api;

// Helpers to normalize Mongo `_id` to `id` for the frontend
export const mapId = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  const { _id, ...rest } = obj as any;
  return { id: _id ? String(_id) : (obj.id || ''), ...rest };
};

export const mapUser = (u: any) => mapId(u);
export const mapTrip = (t: any) => mapId(t);
