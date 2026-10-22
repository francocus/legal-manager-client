import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PREFERENCES, PreferencesContext } from './preferences.context';
import { PREFERENCES_KEY } from '../consts/storageKeys';

const readPreferences = () => {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const PreferencesContextProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(readPreferences);

  const updatePreference = useCallback((key, value) => {
    setPreferences((previousPreferences) => {
      const nextPreferences = { ...previousPreferences, [key]: value };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(nextPreferences));
      return nextPreferences;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ preferences, updatePreference }),
    [preferences, updatePreference],
  );

  return <PreferencesContext value={contextValue}>{children}</PreferencesContext>;
};
