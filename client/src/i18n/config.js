import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './translations/en.json';
import heTranslations from './translations/he.json';

// Define RTL languages
const rtlLanguages = ['he', 'ar', 'fa', 'ur'];

// Helper function to check if language is RTL
export const isRTL = (lang) => rtlLanguages.includes(lang);

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Debug only in development
    debug: process.env.NODE_ENV === 'development',
    
    // Translation resources
    resources: {
      en: { translation: enTranslations },
      he: { translation: heTranslations }
    },
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
      checkWhitelist: true
    },
    
    // Default language
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    
    // Whitelist supported languages
    supportedLngs: ['en', 'he'],
    
    // Don't use a key separator as we use dots in keys
    keySeparator: '.',
    
    // Interpolation config
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ','
    },
    
    // React i18next config
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'b', 'span'],
      nsMode: 'default'
    }
  });

// Set initial direction
document.documentElement.dir = isRTL(i18n.language) ? 'rtl' : 'ltr';
// Keep document language as 'en' to prevent browser UI changes
document.documentElement.lang = 'en';
document.title = 'Fan Munch Dashboard';

// Handle language changes
i18n.on('languageChanged', (lng) => {
  const isRtl = isRTL(lng);
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  // Keep document language as 'en' to prevent browser UI changes
  document.documentElement.lang = 'en';
  document.title = 'Fan Munch Dashboard';
});

export default i18n;
