import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import enTranslation from '../../locales/en/translation.json';
import idTranslation from '../../locales/id/translation.json';

const STORAGE_KEY = 'user-language';

const resources = {
  en: {
    translation: enTranslation,
  },
  id: {
    translation: idTranslation,
  },
};

const initI18n = async () => {
  let savedLanguage = 'en';
  
  try {
    const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedLanguage) {
      savedLanguage = storedLanguage;
    } else {
      // Use device locale as fallback
      const deviceLocale = getLocales()[0]?.languageCode || 'en';
      savedLanguage = deviceLocale === 'id' ? 'id' : 'en';
    }
  } catch (error) {
    console.warn('Failed to load language from storage:', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      
      interpolation: {
        escapeValue: false,
      },
      
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

export const changeLanguage = async (language: 'en' | 'id') => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.warn('Failed to save language to storage:', error);
    // Still change the language even if storage fails
    await i18n.changeLanguage(language);
  }
};

export { initI18n };
export default i18n;