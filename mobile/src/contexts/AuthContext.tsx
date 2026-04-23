import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {SessionData} from '../types';
import {API_ORIGIN} from '../config/apiConfig';
import {registerAuthFailureHandler, setAuthToken} from '../services/api';
import {feedback} from '../theme/feedback';

type AuthContextType = {
  session: SessionData | null;
  isLoading: boolean;
  login: (sessionData: SessionData) => Promise<void>;
  logout: () => Promise<void>;
};

const SESSION_KEY = 'barcostop_session';
const SESSION_STORAGE_VERSION = 2;

type PersistedSession = {
  version: number;
  apiOrigin: string;
  session: SessionData;
};

const isValidSessionData = (value: any): value is SessionData => {
  return Boolean(
    value &&
      value.userId &&
      value.email &&
      value.name &&
      value.role &&
      typeof value.token === 'string' &&
      value.token.trim(),
  );
};

const readPersistedSession = (raw: any): SessionData | null => {
  if (
    raw &&
    raw.version === SESSION_STORAGE_VERSION &&
    raw.apiOrigin === API_ORIGIN &&
    isValidSessionData(raw.session)
  ) {
    return raw.session;
  }

  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
    setAuthToken(null);
  };

  useEffect(() => {
    registerAuthFailureHandler(async (message) => {
      await clearSession();
      feedback.alert('Sesion expirada', message || 'Tu sesion ya no es valida. Inicia sesion de nuevo.');
    });

    return () => {
      registerAuthFailureHandler(null);
    };
  }, []);

  useEffect(() => {
    const restorePersistedSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!raw) {
          setAuthToken(null);
          return;
        }

        const parsed = JSON.parse(raw);
        const restoredSession = readPersistedSession(parsed);

        if (restoredSession) {
          setSession(restoredSession);
          setAuthToken(restoredSession.token || null);
          return;
        }

        await clearSession();
      } catch (error) {
        console.error('Error restoring session:', error);
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    };
    restorePersistedSession();
  }, []);

  const login = async (sessionData: SessionData) => {
    const persisted: PersistedSession = {
      version: SESSION_STORAGE_VERSION,
      apiOrigin: API_ORIGIN,
      session: sessionData,
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(persisted));
    setSession(sessionData);
    setAuthToken(sessionData.token || null);
  };

  const logout = async () => {
    await clearSession();
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
