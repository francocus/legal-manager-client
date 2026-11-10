import { apiRequest } from '../http/httpClient';
import { mapCase } from '../../biz/cases/Cases.data';

// The .NET contract fixes which fields each write endpoint accepts: POST /case
// and PUT /case/{id} receive a specific field set (ids travel as Guid strings,
// status and lastUpdate are computed by the backend), while status changes and
// lawyer changes are dedicated PATCH endpoints.
export const casesApi = {
  // Raw dto array for bulk loaders (DashboardDataProvider) that resolve names
  // and case numbers after every list is fetched.
  getAllRaw: async () => (await apiRequest('/case')) ?? [],

  getAll: async (userNames = {}) =>
    ((await apiRequest('/case')) ?? []).map((dto) => mapCase(dto, userNames)),

  create: (payload) =>
    apiRequest('/case', {
      method: 'POST',
      body: {
        caseNumber: payload?.caseNumber,
        title: payload?.title,
        area: payload?.area,
        startDate: payload?.startDate,
        description: payload?.description,
        notes: payload?.notes,
        clientId: payload?.clientId,
        lawyerId: payload?.lawyerId,
      },
    }),

  // PUT /case/{id} accepts only display fields.
  update: (id, payload) =>
    apiRequest(`/case/${id}`, {
      method: 'PUT',
      body: {
        title: payload?.title,
        area: payload?.area,
        description: payload?.description,
        notes: payload?.notes,
      },
    }),

  setStatus: (id, status) =>
    apiRequest(`/case/${id}/status`, {
      method: 'PATCH',
      body: {
        status: { activo: 'Activo', pendiente: 'Pendiente', cerrado: 'Cerrado' }[status] ?? status,
      },
    }),

  addLawyer: (id, lawyerId) =>
    apiRequest(`/case/${id}/lawyers/add`, { method: 'PATCH', body: { lawyerId } }),

  removeLawyer: (id, lawyerId) =>
    apiRequest(`/case/${id}/lawyers/remove`, { method: 'PATCH', body: { lawyerId } }),

  remove: (id) => apiRequest(`/case/${id}`, { method: 'DELETE' }),
};
