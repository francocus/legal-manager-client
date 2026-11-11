import { apiRequest } from '../http/httpClient';
import { ROLES } from '../consts/roles';
import { mapUser } from '../../biz/users/User.data';

const mapUsers = (list) => (list ?? []).map(mapUser);

// Splits "Nombre Apellido" into { firstName, lastName }: the first token is
// the firstName and the rest, joined back, is the lastName. Empty-safe.
export const splitPersonName = (name) => {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const [firstName, ...rest] = parts;

  return {
    firstName: firstName ?? '',
    lastName: rest.join(' '),
  };
};

const toPersonBody = (payload) => {
  const { firstName, lastName } = splitPersonName(payload?.name);

  return {
    firstName,
    lastName,
    dni: payload?.dni,
    email: payload?.email,
    password: payload?.password,
  };
};

export const usersApi = {
  login: (credentials) =>
    apiRequest('/auth/login', { method: 'POST', body: credentials, auth: false }),

  // /auth/register accepts only { firstName, lastName, dni, email, password }.
  register: (payload) =>
    apiRequest('/auth/register', { method: 'POST', body: toPersonBody(payload), auth: false }),

  getAll: async () => mapUsers(await apiRequest('/user')),

  getLawyers: async () => mapUsers(await apiRequest('/user/lawyers')),

  getClients: async () => mapUsers(await apiRequest('/user/clients')),

  // The backend has no single create endpoint: the path depends on the role,
  // and the create bodies reject extra fields such as "active".
  create: (payload) => {
    const body = toPersonBody(payload);

    if (payload?.role === ROLES.SYSADMIN) {
      return apiRequest('/user/admin', { method: 'POST', body });
    }

    if (payload?.role === ROLES.ABOGADO) {
      // /user/lawyer requires a non-nullable barNumber.
      return apiRequest('/user/lawyer', {
        method: 'POST',
        body: { ...body, barNumber: payload?.barNumber },
      });
    }

    return apiRequest('/user/client', { method: 'POST', body });
  },

  // PUT /user/:id accepts only display fields; password, role and active are rejected.
  update: (id, payload) => {
    const { firstName, lastName } = splitPersonName(payload?.name);

    return apiRequest(`/user/${id}`, {
      method: 'PUT',
      body: { firstName, lastName, dni: payload?.dni, email: payload?.email },
    });
  },

  remove: (id) => apiRequest(`/user/${id}`, { method: 'DELETE' }),

  // PATCH /user/:id/role changes the role of a non-admin user (admins are
  // command-created and immutable). barNumber and specialties only matter
  // when the new role is "abogado"; nulls let the backend drop them.
  changeRole: (id, payload) =>
    apiRequest(`/user/${id}/role`, {
      method: 'PATCH',
      body: {
        role: payload?.role,
        barNumber: payload?.barNumber ?? null,
        specialties: payload?.specialties ?? null,
      },
    }),
};
