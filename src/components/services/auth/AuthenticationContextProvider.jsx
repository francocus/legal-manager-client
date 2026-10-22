import { useState } from 'react';
import { AuthenticationContext } from './authentication.context';
import { usersApi } from '../api/usersApi';
import { TOKEN_KEY, USER_KEY } from '../consts/storageKeys';

const readStoredValue = (key, fallback = null) => {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return fallback;
    }

    return JSON.parse(storedValue);
  } catch (_error) {
    return fallback;
  }
};

export const AuthenticationContextProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredValue(USER_KEY));

  const persistSession = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const handleUserLogin = async (credentials) => {
    const data = await usersApi.login(credentials);

    persistSession(data.token, data.user);

    return data;
  };

  const handleUserRegister = async (form) => {
    await usersApi.register(form);

    return handleUserLogin({
      email: form.email,
      password: form.password,
    });
  };

  const handleUserLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const contextValue = {
    token,
    user,
    isAuthenticated: Boolean(token),
    handleUserLogin,
    handleUserRegister,
    handleUserLogout,
  };

  return <AuthenticationContext value={contextValue}>{children}</AuthenticationContext>;
};
