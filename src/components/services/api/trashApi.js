import { apiRequest } from '../http/httpClient';
import { mapAppointment } from '../../biz/appointments/Appointments.data';
import { mapDocument } from '../../biz/documents/Documents.data';
import { mapUser } from '../../biz/users/User.data';

// The /trash contract answers four flat lists. Cases arrive in a dedicated
// trash shape (deactivatedAt + counters), while the nested appointment,
// document and user payloads keep the standard dto shapes those modules
// already map, so the shared mappers are reused and only the wrapper rows
// are normalized.
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

// The trash users row nests the user payload ({ user, deactivatedAt, isAdmin }),
// so mapUser runs over item.user (mapApiRole resolves 'cliente'/'abogado'/'admin').
const mapTrashUser = (item = {}) => ({
  user: mapUser(item.user ?? {}),
  isAdmin: Boolean(item.isAdmin),
  deactivatedAt: toDeactivatedAt(item.deactivatedAt),
});

export const trashApi = {
  getTrash: async () => {
    const data = (await apiRequest('/trash')) ?? {};
    return {
      cases: (data.cases ?? []).map(mapTrashCase),
      appointments: (data.appointments ?? []).map(mapTrashAppointment),
      documents: (data.documents ?? []).map(mapTrashDocument),
      users: (data.users ?? []).map(mapTrashUser),
    };
  },

  // Logical restores: the row leaves the trash and goes back to its module.
  restoreCase: (id) => apiRequest(`/trash/case/${id}/restore`, { method: 'POST' }),
  restoreAppointment: (id) => apiRequest(`/trash/appointment/${id}/restore`, { method: 'POST' }),
  restoreDocument: (id) => apiRequest(`/trash/document/${id}/restore`, { method: 'POST' }),
  restoreUser: (id) => apiRequest(`/trash/user/${id}/restore`, { method: 'POST' }),

  // Physical deletes. Cases with linked children (and users with references)
  // reject with a message about deleting them first, surfaced through
  // apiRequest error handling.
  hardDeleteCase: (id) => apiRequest(`/trash/case/${id}`, { method: 'DELETE' }),
  hardDeleteAppointment: (id) => apiRequest(`/trash/appointment/${id}`, { method: 'DELETE' }),
  hardDeleteDocument: (id) => apiRequest(`/trash/document/${id}`, { method: 'DELETE' }),
  hardDeleteUser: (id) => apiRequest(`/trash/user/${id}`, { method: 'DELETE' }),
};
