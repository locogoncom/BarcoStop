import { useState, useEffect, useCallback } from 'react';
import { User, Trip, Reservation, Message, Conversation } from '../types';
import {
  getUsers,
  saveUsers,
  getTrips,
  saveTrips,
  getReservations,
  saveReservations,
  getMessages,
  saveMessages,
  getConversations,
  saveConversations,
  getCurrentUser,
  saveCurrentUser,
  getUserById,
  getTripById,
} from '../utils/storage';
import { tripAPI, reservationAPI, mapTrip } from '../utils/api';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const register = useCallback((user: User) => {
    // Just save current user, don't modify user list (App.tsx handles that)
    saveCurrentUser(user);
    setCurrentUser(user);
  }, []);

  const login = useCallback((userId: string) => {
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
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    tripAPI.getAll().then((response) => {
      setTrips(response.data.map(mapTrip));
    }).catch((err) => console.error('Error fetching trips:', err));
  }, []);

  const addTrip = useCallback((trip: Trip) => {
    setTrips((prev) => [...prev, trip]);
  }, []);

  const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
    setTrips((prev) => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter(t => t.id !== id));
  }, []);

  const getTripsByPatron = useCallback((patronId: string): Trip[] => {
    return trips.filter(t => t.patronId === patronId);
  }, [trips]);

  return { trips, addTrip, updateTrip, deleteTrip, getTripsByPatron };
};

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    reservationAPI.getAll().then((response) => {
      setReservations(response.data);
    }).catch((err) => console.error('Error fetching reservations:', err));
  }, []);

  const addReservation = useCallback((reservation: Reservation) => {
    setReservations((prev) => [...prev, reservation]);
  }, []);

  const updateReservation = useCallback((id: string, updates: Partial<Reservation>) => {
    reservationAPI.update(id, updates).then((response) => {
      setReservations((prev) =>
        prev.map(r => (r.id === id ? response.data : r))
      );
    }).catch((err) => console.error('Error updating reservation:', err));
  }, []);

  const getReservationsByTrip = useCallback((tripId: string): Reservation[] => {
    return reservations.filter(r => r.tripId === tripId);
  }, [reservations]);

  const getReservationsByTraveler = useCallback((travelerId: string): Reservation[] => {
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setConversations(getConversations());
    setMessages(getMessages());
  }, []);

  const sendMessage = useCallback((message: Message) => {
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

  const getConversationMessages = useCallback((conversationId: string): Message[] => {
    return messages.filter(m => m.conversationId === conversationId).sort((a, b) => a.createdAt - b.createdAt);
  }, [messages]);

  const getUserConversations = useCallback((userId: string): Conversation[] => {
    return conversations.filter(c => c.participants.includes(userId));
  }, [conversations]);

  return { conversations, messages, sendMessage, getConversationMessages, getUserConversations };
};
