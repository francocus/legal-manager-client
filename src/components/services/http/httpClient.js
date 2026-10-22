import { API_URL } from '../consts/apiConsts';
import { TOKEN_KEY } from '../consts/storageKeys';

const DEFAULT_ERROR_MESSAGE = 'No se pudo completar la operación.';

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
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
    throw new Error(await getErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
};
