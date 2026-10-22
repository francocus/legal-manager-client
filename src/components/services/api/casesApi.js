import { apiRequest } from '../http/httpClient';
import { mapCase } from '../../biz/cases/Cases.data';

export const casesApi = {
  getAll: async () => ((await apiRequest('/cases'))?.cases ?? []).map(mapCase),

  create: (payload) => apiRequest('/cases', { method: 'POST', body: payload }),

  update: (id, payload) => apiRequest(`/cases/${id}`, { method: 'PUT', body: payload }),

  remove: (id) => apiRequest(`/cases/${id}`, { method: 'DELETE' }),
};
