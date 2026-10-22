import { createContext, useContext } from 'react';

export const DEFAULT_PREFERENCES = {
  dateFormat: 'dd/mm/yyyy',
};

export const PreferencesContext = createContext(null);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences debe usarse dentro de PreferencesContextProvider.');
  }

  return context;
};
