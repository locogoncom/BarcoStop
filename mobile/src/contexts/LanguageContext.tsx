import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {LanguageCode} from '../i18n/translations';
import {translations} from '../i18n/translations';

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (nextLanguage: LanguageCode) => void;
  t: (key: keyof typeof translations.en) => string;
};

const LANGUAGE_KEY = 'barcostop_language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const restoreLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored === 'en' || stored === 'es' || stored === 'fr' || stored === 'pt') {
          setLanguageState(stored);
        }
      } catch (_e) {
        // ignore storage error and keep english as fallback
      }
    };
    restoreLanguage();
  }, []);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage).catch(() => {
      // ignore storage error
    });
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof typeof translations.en) => translations[language][key],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
