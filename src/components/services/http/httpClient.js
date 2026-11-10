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

// A FormData body travels as multipart: the browser supplies the
// Content-Type (including the boundary), so no explicit header is added.
export const apiRequest = async (
  path,
  { method = 'GET', body, auth = true, headers = {} } = {},
) => {
  const finalHeaders = { ...headers };
  const bodyIsFormData = body instanceof FormData;

  if (body !== undefined && !bodyIsFormData) {
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
    body: bodyIsFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
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

// Binary responses (document downloads) need the raw body instead of a JSON
// parse, while 401/error handling stays identical to apiRequest. The filename
// comes from the backend's Content-Disposition header when present; callers
// fall back to their own known document.name.
export const apiDownload = async (path, { auth = true } = {}) => {
  const headers = {};

  if (auth) {
    const token = readToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, { headers });

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearExpiredSession();
    }
    throw new Error(await getErrorMessage(response));
  }

  const blob = await response.blob();
  return {
    blob,
    fileName: response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? null,
  };
};
