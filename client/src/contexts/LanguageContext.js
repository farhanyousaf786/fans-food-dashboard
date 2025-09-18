import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../i18n/config';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const changeLanguage = useCallback((lng) => {
    if (!lng) return;
    
    // Update i18n
    i18n.changeLanguage(lng);
    
    // Update state and localStorage
    setLanguage(lng);
    localStorage.setItem('language', lng);
    
    // Update document attributes
    const isRtl = lng === 'he';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    // Keep document language as 'en' to prevent browser UI changes
    document.documentElement.lang = 'en';
    
    // Keep title in English
    document.title = 'Fan Munch Dashboard';
      
  }, []);

  // Set initial language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    if (savedLanguage !== language) {
      changeLanguage(savedLanguage);
    }
  }, [changeLanguage, language]);

  // Add event listener for language changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue && e.newValue !== language) {
        changeLanguage(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language, changeLanguage]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
