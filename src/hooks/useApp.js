import { useState, useEffect, useCallback } from 'react';
import { getMessages, saveMessages, getConversations, saveConversations, getCurrentUser, saveCurrentUser, getUserById, } from '../utils/storage';
import { tripAPI, reservationAPI, mapTrip } from '../utils/api';
export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
        setLoading(false);
    }, []);
    const register = useCallback((user) => {
        // Just save current user, don't modify user list (App.tsx handles that)
        saveCurrentUser(user);
        setCurrentUser(user);
    }, []);
    const login = useCallback((userId) => {
        const user = getUserById(userId);
        if (user) {
            saveCurrentUser(user);
            setCurrentUser(user);
            return true;
        }
        return false;
    }, []);
    const logout = useCallback(() => {
        saveCurrentUser(null);
        setCurrentUser(null);
    }, []);
    return { currentUser, loading, register, login, logout };
};
export const useTrips = () => {
    const [trips, setTrips] = useState([]);
    useEffect(() => {
        tripAPI.getAll().then((response) => {
            setTrips(response.data.map(mapTrip));
        }).catch((err) => console.error('Error fetching trips:', err));
    }, []);
    const addTrip = useCallback((trip) => {
        setTrips((prev) => [...prev, trip]);
    }, []);
    const updateTrip = useCallback((id, updates) => {
        setTrips((prev) => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    }, []);
    const deleteTrip = useCallback((id) => {
        setTrips((prev) => prev.filter(t => t.id !== id));
    }, []);
    const getTripsByPatron = useCallback((patronId) => {
        return trips.filter(t => t.patronId === patronId);
    }, [trips]);
    return { trips, addTrip, updateTrip, deleteTrip, getTripsByPatron };
};
export const useReservations = () => {
    const [reservations, setReservations] = useState([]);
    useEffect(() => {
        reservationAPI.getAll().then((response) => {
            setReservations(response.data);
        }).catch((err) => console.error('Error fetching reservations:', err));
    }, []);
    const addReservation = useCallback((reservation) => {
        setReservations((prev) => [...prev, reservation]);
    }, []);
    const updateReservation = useCallback((id, updates) => {
        reservationAPI.update(id, updates).then((response) => {
            setReservations((prev) => prev.map(r => (r.id === id ? response.data : r)));
        }).catch((err) => console.error('Error updating reservation:', err));
    }, []);
    const getReservationsByTrip = useCallback((tripId) => {
        return reservations.filter(r => r.tripId === tripId);
    }, [reservations]);
    const getReservationsByTraveler = useCallback((travelerId) => {
        return reservations.filter(r => r.travelerId === travelerId);
    }, [reservations]);
    return {
        reservations,
        addReservation,
        updateReservation,
        getReservationsByTrip,
        getReservationsByTraveler,
    };
};
export const useChat = () => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    useEffect(() => {
        setConversations(getConversations());
        setMessages(getMessages());
    }, []);
    const sendMessage = useCallback((message) => {
        const allMessages = getMessages();
        const newMessages = [...allMessages, message];
        saveMessages(newMessages);
        setMessages(newMessages);
        // Update or create conversation
        const allConversations = getConversations();
        const existingConv = allConversations.find(c => c.id === message.conversationId);
        if (existingConv) {
            existingConv.lastMessage = message;
            existingConv.updatedAt = Date.now();
        }
        saveConversations(allConversations);
        setConversations(allConversations);
    }, []);
    const getConversationMessages = useCallback((conversationId) => {
        return messages.filter(m => m.conversationId === conversationId).sort((a, b) => a.createdAt - b.createdAt);
    }, [messages]);
    const getUserConversations = useCallback((userId) => {
        return conversations.filter(c => c.participants.includes(userId));
    }, [conversations]);
    return { conversations, messages, sendMessage, getConversationMessages, getUserConversations };
};
