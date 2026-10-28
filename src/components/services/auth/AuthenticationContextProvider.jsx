import { useState } from 'react';
import { AuthenticationContext } from './authentication.context';
import { usersApi } from '../api/usersApi';
import { TOKEN_KEY, USER_KEY } from '../consts/storageKeys';
import { mapApiRole } from '../consts/roles';
import { decodeJwtPayload } from './jwt';

// Claim URIs issued by the .NET backend (System.Security.Claims defaults).
const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const NAME_IDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

// The login endpoint answers only the short-lived token, so the session user
// is rebuilt from the JWT claims (id, email, role) until the API adds a real
// name claim.
const buildUserFromClaims = (token, credentials = {}) => {
  const claims = decodeJwtPayload(token) ?? {};
  const email = claims[EMAIL_CLAIM] ?? claims.email ?? credentials.email ?? '';

  return {
    id: claims.sub ?? claims[NAME_IDENTIFIER_CLAIM] ?? null,
    email,
    role: mapApiRole(claims[ROLE_CLAIM] ?? claims.role),
    name: email,
  };
};

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
    // POST /auth/login answers only { token } (a 15-minute JWT): there is no
    // user body, so the user is rebuilt from the token claims and name stays
    // the email until the API exposes a real name claim.
    const { token } = await usersApi.login(credentials);
    const user = buildUserFromClaims(token, credentials);

    persistSession(token, user);

    return { token, user };
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
