import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {SessionData} from '../types';
import {setAuthToken} from '../services/api';

type AuthContextType = {
  session: SessionData | null;
  isLoading: boolean;
  login: (sessionData: SessionData) => Promise<void>;
  logout: () => Promise<void>;
};

const SESSION_KEY = 'barcostop_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Validar que la sesión tenga los campos necesarios
          if (parsed && parsed.userId && parsed.email && parsed.name && parsed.role) {
            setSession(parsed);
            setAuthToken(parsed.token || null);
          } else {
            // Sesión inválida, limpiar
            await AsyncStorage.removeItem(SESSION_KEY);
            setAuthToken(null);
          }
        }
      } catch (error) {
        // Error al parsear, limpiar storage
        console.error('Error restoring session:', error);
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (sessionData: SessionData) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSession(sessionData);
    setAuthToken(sessionData.token || null);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({session, isLoading, login, logout}),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
