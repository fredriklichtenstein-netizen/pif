
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import English translations
import enNavigation from '../locales/en/navigation.json';
import enHome from '../locales/en/home.json';
import enFeed from '../locales/en/feed.json';
import enCategories from '../locales/en/categories.json';
import enAuth from '../locales/en/auth.json';
import enPost from '../locales/en/post.json';
import enProfile from '../locales/en/profile.json';
import enInteractions from '../locales/en/interactions.json';
import enComments from '../locales/en/comments.json';
import enUI from '../locales/en/ui.json';
import enStatus from '../locales/en/status.json';
import enCommon from '../locales/en/common.json';
import enLanguage from '../locales/en/language.json';

// Import Swedish translations
import svNavigation from '../locales/sv/navigation.json';
import svHome from '../locales/sv/home.json';
import svFeed from '../locales/sv/feed.json';
import svCategories from '../locales/sv/categories.json';
import svAuth from '../locales/sv/auth.json';
import svPost from '../locales/sv/post.json';
import svProfile from '../locales/sv/profile.json';
import svInteractions from '../locales/sv/interactions.json';
import svComments from '../locales/sv/comments.json';
import svUI from '../locales/sv/ui.json';
import svStatus from '../locales/sv/status.json';
import svCommon from '../locales/sv/common.json';
import svLanguage from '../locales/sv/language.json';

const resources = {
  en: {
    translation: {
      ...enNavigation,
      ...enHome,
      ...enFeed,
      ...enCategories,
      ...enAuth,
      ...enPost,
      ...enProfile,
      ...enInteractions,
      ...enComments,
      ...enUI,
      ...enStatus,
      ...enCommon,
      ...enLanguage
    }
  },
  sv: {
    translation: {
      ...svNavigation,
      ...svHome,
      ...svFeed,
      ...svCategories,
      ...svAuth,
      ...svPost,
      ...svProfile,
      ...svInteractions,
      ...svComments,
      ...svUI,
      ...svStatus,
      ...svCommon,
      ...svLanguage
    }
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
