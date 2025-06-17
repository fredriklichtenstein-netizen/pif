
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

// Detect browser language with fallback
const detectLanguage = (): string => {
  // Check localStorage first
  const storedLang = localStorage.getItem('language');
  if (storedLang && ['sv', 'en'].includes(storedLang)) {
    return storedLang;
  }
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('sv')) {
    return 'sv';
  }
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  // Default fallback
  return 'sv';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'sv',
    interpolation: {
      escapeValue: false
    },
    // Force re-render when language changes
    react: {
      useSuspense: false
    }
  });

// Listen for language changes and force app refresh
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  // Force a slight delay to ensure all components re-render
  setTimeout(() => {
    window.dispatchEvent(new Event('languageChanged'));
  }, 100);
});

export default i18n;
