import { API_URL } from '../consts/apiConsts';
import { TOKEN_KEY, USER_KEY, SESSION_EXPIRED_KEY } from '../consts/storageKeys';

const DEFAULT_ERROR_MESSAGE = 'No se pudo completar la operación.';

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

// A 401 on an authenticated call means the JWT is expired or invalid: drop
// the persisted session and bounce to login instead of leaving an empty
// "logged in" UI behind. Non-auth calls (login/register) never clean up.
const clearExpiredSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.setItem(SESSION_EXPIRED_KEY, 'true');
  } catch {
    // Blocked storage still allows the redirect below.
  }

  window.location.replace('/login');
};

export const getErrorMessage = async (response) => {
  try {
    const raw = await response.text();

    if (!raw) {
      return DEFAULT_ERROR_MESSAGE;
    }

    try {
      const payload = JSON.parse(raw);
      return payload?.message ?? payload?.title ?? payload?.detail ?? DEFAULT_ERROR_MESSAGE;
    } catch {
      return raw;
    }
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
};

export const apiRequest = async (
  path,
  { method = 'GET', body, auth = true, headers = {} } = {},
) => {
  const finalHeaders = { ...headers };

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = readToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Expired/invalid JWT: clean up and bounce before surfacing the error.
    // 403 is a permissions issue, not a session issue, so it keeps the plain
    // error flow. The redirect is already scheduled when the caller sees it.
    if (auth && response.status === 401) {
      clearExpiredSession();
    }

    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
};
