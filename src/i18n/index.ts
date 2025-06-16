
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import sv from '../locales/sv.json';
import en from '../locales/en.json';

const resources = {
  sv: {
    translation: sv
  },
  en: {
    translation: en
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'sv', // Default to Swedish
    fallbackLng: 'sv',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
