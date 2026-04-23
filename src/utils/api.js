import axios from 'axios';
const normalizeApiUrl = (value) => {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
    if (/\/api\/v1$/i.test(withoutTrailingSlash) || /\/v1$/i.test(withoutTrailingSlash)) {
        return withoutTrailingSlash;
    }
    if (/\/api$/i.test(withoutTrailingSlash)) {
        return `${withoutTrailingSlash}/v1`;
    }
    return `${withoutTrailingSlash}/v1`;
};
const envApiUrl = normalizeApiUrl(import.meta?.env?.VITE_API_URL);
const API_URL = envApiUrl ?? 'https://api.barcostop.net/v1';
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Users
export const userAPI = {
    register: (user) => api.post('/users', user),
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
};
// Trips
export const tripAPI = {
    create: (trip) => api.post('/trips', trip),
    getAll: () => api.get('/trips'),
    getById: (id) => api.get(`/trips/${id}`),
    getByPatron: (patronId) => api.get('/trips', { params: { patronId } }),
};
// Reservations
export const reservationAPI = {
    create: (reservation) => api.post('/reservations', reservation),
    getAll: () => api.get('/reservations'),
    getByTrip: (tripId) => api.get('/reservations', { params: { tripId } }),
    getByUser: (userId) => api.get('/reservations', { params: { userId } }),
    update: (id, updates) => api.patch(`/reservations/${id}`, updates),
};
// Messages
export const messageAPI = {
    send: (message) => api.post('/messages', message),
    getByConversation: (conversationId) => api.get(`/messages/${conversationId}`),
    getUserConversations: (userId) => api.get('/messages', { params: { userId } }),
};
export default api;
// Helpers to normalize Mongo `_id` to `id` for the frontend
export const mapId = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    const { _id, ...rest } = obj;
    return { id: _id ? String(_id) : (obj.id || ''), ...rest };
};
export const mapUser = (u) => mapId(u);
export const mapTrip = (t) => mapId(t);
