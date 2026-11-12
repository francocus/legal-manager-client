import { apiRequest } from '../http/httpClient';
import { mapAppointment } from '../../biz/appointments/Appointments.data';
import { mapDocument } from '../../biz/documents/Documents.data';

// The /trash contract answers three flat lists. Cases arrive in a dedicated
// trash shape (deactivatedAt + counters), while the nested appointment and
// document payloads keep the standard dto shapes those modules already map,
// so the shared mappers are reused and only the wrapper rows are normalized.
const toDeactivatedAt = (value) => (value == null || value === '' ? null : String(value));

const mapTrashCase = (item = {}) => ({
  id: item.id ?? '',
  caseNumber: item.caseNumber ?? '',
  title: item.title ?? '',
  deactivatedAt: toDeactivatedAt(item.deactivatedAt),
  totalAppointments: item.totalAppointments ?? 0,
  totalDocuments: item.totalDocuments ?? 0,
});

const mapTrashAppointment = (item = {}) => ({
  appointment: mapAppointment(item.appointment ?? {}),
  deactivatedAt: toDeactivatedAt(item.deactivatedAt),
});

const mapTrashDocument = (item = {}) => ({
  document: mapDocument(item.document ?? {}),
  // caseNumber/caseTitle are null when the parent case is inactive too.
  caseNumber: item.caseNumber ?? null,
  caseTitle: item.caseTitle ?? null,
  deactivatedAt: toDeactivatedAt(item.deactivatedAt),
});

export const trashApi = {
  getTrash: async () => {
    const data = (await apiRequest('/trash')) ?? {};
    return {
      cases: (data.cases ?? []).map(mapTrashCase),
      appointments: (data.appointments ?? []).map(mapTrashAppointment),
      documents: (data.documents ?? []).map(mapTrashDocument),
    };
  },

  // Logical restores: the row leaves the trash and goes back to its module.
  restoreCase: (id) => apiRequest(`/trash/case/${id}/restore`, { method: 'POST' }),
  restoreAppointment: (id) => apiRequest(`/trash/appointment/${id}/restore`, { method: 'POST' }),
  restoreDocument: (id) => apiRequest(`/trash/document/${id}/restore`, { method: 'POST' }),

  // Physical deletes. Cases with linked children reject with a message about
  // deleting them first, surfaced through apiRequest error handling.
  hardDeleteCase: (id) => apiRequest(`/trash/case/${id}`, { method: 'DELETE' }),
  hardDeleteAppointment: (id) => apiRequest(`/trash/appointment/${id}`, { method: 'DELETE' }),
  hardDeleteDocument: (id) => apiRequest(`/trash/document/${id}`, { method: 'DELETE' }),
};
