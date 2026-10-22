import { apiRequest } from '../http/httpClient';
import { mapUser } from '../../biz/users/User.data';

const mapUsers = (list) => (list ?? []).map(mapUser);

export const usersApi = {
  login: (credentials) =>
    apiRequest('/users/login', { method: 'POST', body: credentials, auth: false }),

  register: (payload) =>
    apiRequest('/users/register', { method: 'POST', body: payload, auth: false }),

  getAll: async () => mapUsers((await apiRequest('/users'))?.users),

  getLawyers: async () => mapUsers((await apiRequest('/users/lawyers'))?.lawyers),

  getClients: async () => mapUsers((await apiRequest('/users/clients'))?.clients),

  create: (payload) => apiRequest('/users', { method: 'POST', body: payload }),

  update: (id, payload) => apiRequest(`/users/${id}`, { method: 'PUT', body: payload }),

  remove: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
};
