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
      const specialties = Array.isArray(payload?.specialties)
        ? payload.specialties
        : typeof payload?.specialties === 'string' && payload.specialties.trim()
          ? payload.specialties
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : null;

      // /user/lawyer requires a non-nullable barNumber.
      return apiRequest('/user/lawyer', {
        method: 'POST',
        body: {
          ...body,
          barNumber: payload?.barNumber,
          phone: payload?.phone || null,
          specialties: specialties?.length ? specialties : null,
        },
      });
    }

    return apiRequest('/user/client', {
      method: 'POST',
      body: {
        ...body,
        phone: payload?.phone || null,
        address: payload?.address || null,
      },
    });
  },

  getById: async (id) => mapUser(await apiRequest(`/user/${id}`)),

  // PUT /user/:id accepts only display fields; password, role and active are rejected.
  update: (id, payload) => {
    const { firstName, lastName } = splitPersonName(payload?.name);

    return apiRequest(`/user/${id}`, {
      method: 'PUT',
      body: { firstName, lastName, dni: payload?.dni, email: payload?.email },
    });
  },

  updateClientPhone: (id, phone) =>
    apiRequest(`/user/client/${id}/phone`, { method: 'PATCH', body: { phone } }),

  updateClientAddress: (id, address) =>
    apiRequest(`/user/client/${id}/address`, { method: 'PATCH', body: { address } }),

  updateLawyerPhone: (id, phone) =>
    apiRequest(`/user/lawyer/${id}/phone`, { method: 'PATCH', body: { phone } }),

  updateBarNumber: (id, barNumber) =>
    apiRequest(`/user/lawyer/${id}/bar-number`, { method: 'PATCH', body: { barNumber } }),

  updateSpecialties: (id, specialties) => {
    const list = Array.isArray(specialties)
      ? specialties
      : String(specialties ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    return apiRequest(`/user/lawyer/${id}/specialties`, {
      method: 'PATCH',
      body: { specialties: list },
    });
  },

  updateWithRoleFields: async (id, payload, original = {}) => {
    await usersApi.update(id, payload);

    const role = payload?.role || original?.role;
    const patches = [];

    if (role === ROLES.CLIENTE) {
      if (payload?.phone !== undefined && payload.phone !== original.phone) {
        patches.push(usersApi.updateClientPhone(id, payload.phone || null));
      }
      if (payload?.address !== undefined && payload.address !== original.address) {
        patches.push(usersApi.updateClientAddress(id, payload.address || null));
      }
    } else if (role === ROLES.ABOGADO) {
      if (payload?.phone !== undefined && payload.phone !== original.phone) {
        patches.push(usersApi.updateLawyerPhone(id, payload.phone || null));
      }
      if (
        payload?.barNumber !== undefined &&
        payload.barNumber !== original.barNumber &&
        payload.barNumber.trim()
      ) {
        patches.push(usersApi.updateBarNumber(id, payload.barNumber.trim()));
      }
      if (payload?.specialties !== undefined) {
        const specs = Array.isArray(payload.specialties)
          ? payload.specialties
          : String(payload.specialties)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
        const origSpecs = Array.isArray(original.specialties)
          ? original.specialties
          : String(original.specialties || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

        if (specs.length > 0 && JSON.stringify(specs) !== JSON.stringify(origSpecs)) {
          patches.push(usersApi.updateSpecialties(id, specs));
        }
      }
    }

    if (patches.length > 0) {
      await Promise.all(patches);
    }
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
