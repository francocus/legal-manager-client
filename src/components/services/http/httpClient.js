import axios from 'axios';
import { API_URL } from '../consts/apiConsts';
import { TOKEN_KEY, USER_KEY, SESSION_EXPIRED_KEY } from '../consts/storageKeys';

const DEFAULT_ERROR_MESSAGE = 'No se pudo completar la operación.';

// Single shared instance: every call travels through the same base URL, so
// the api/ layer keeps dealing only with backend-relative paths.
const client = axios.create({ baseURL: API_URL });

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

// Resolves the human-readable backend error message. Historically this
// awaited a fetch Response body; since the move to axios it receives the
// rejected axios error instead (error.response.data may be an object, e.g.
// an RFC 7807 ProblemDetails carrying message/title/detail, or plain text).
export const getErrorMessage = (error) => {
  const payload = error?.response?.data;

  if (payload == null) {
    return DEFAULT_ERROR_MESSAGE;
  }

  if (typeof payload === 'string') {
    return payload || DEFAULT_ERROR_MESSAGE;
  }

  return payload?.message ?? payload?.title ?? payload?.detail ?? DEFAULT_ERROR_MESSAGE;
};

// Single request path for the whole app: plain objects are JSON-serialized
// by axios (which also sets the JSON Content-Type), while FormData bodies
// pass through untouched so the browser supplies the multipart Content-Type
// with the boundary. 204 or an empty payload resolves to null.
export const apiRequest = async (
  path,
  { method = 'GET', body, auth = true, headers = {} } = {},
) => {
  const requestHeaders = { ...headers };

  if (auth) {
    const token = readToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await client.request({
      url: path,
      method,
      headers: requestHeaders,
      data: body,
    });

    if (response.status === 204) {
      return null;
    }

    // Numbers and booleans stay falsy but valid payloads; only a genuinely
    // empty body maps to null, matching the old text-based parse.
    const data = response.data;
    return data === '' || data == null ? null : data;
  } catch (error) {
    // Expired/invalid JWT: clean up and bounce before surfacing the error.
    // 403 is a permissions issue, not a session issue, so it keeps the plain
    // error flow. The redirect is already scheduled when the caller sees it.
    if (auth && error?.response?.status === 401) {
      clearExpiredSession();
    }

    throw new Error(getErrorMessage(error));
  }
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

  try {
    // responseType 'blob' bypasses axios' JSON transform, so the raw file
    // arrives intact for the caller to hand to the browser.
    const response = await client.get(path, { headers, responseType: 'blob' });

    return {
      blob: response.data,
      fileName:
        response.headers?.['content-disposition']?.match(/filename="(.+)"/)?.[1] ?? null,
    };
  } catch (error) {
    if (auth && error?.response?.status === 401) {
      clearExpiredSession();
    }

    throw new Error(getErrorMessage(error));
  }
};
