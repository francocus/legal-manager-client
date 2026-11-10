import { apiDownload, apiRequest } from '../http/httpClient';
import { mapDocument, typeValueToEnum } from '../../biz/documents/Documents.data';

// Full .NET document contract (api/document): uploads are multipart,
// the AI summary is generated into a draft document whose decision travels
// through dedicated PATCH endpoints, and removal is always a logical
// deactivation (DELETE), never a physical one.
export const documentsApi = {
  getAll: async (caseId) =>
    ((await apiRequest(`/document/case/${caseId}`)) ?? []).map(mapDocument),

  getById: async (id) => mapDocument(await apiRequest(`/document/${id}`)),

  // POST /document expects form fields caseId + type and the raw file,
  // capped at 10 MB server-side.
  upload: (caseId, typeValue, file) => {
    const formData = new FormData();
    formData.append('caseId', caseId);
    formData.append('type', String(typeValueToEnum(typeValue)));
    formData.append('file', file);

    return apiRequest('/document', { method: 'POST', body: formData }).then(mapDocument);
  },

  // Server answers a FileResult stream: raw blob plus the filename from the
  // Content-Disposition header; callers fall back to their own known name.
  download: (id) => apiDownload(`/document/${id}/download`),

  // Generates one AI summary draft for the case. 409 while another draft
  // awaits its keep/discard decision; 502 when the LLM is unreachable.
  generateAiSummary: async (caseId) =>
    mapDocument(await apiRequest(`/document/case/${caseId}/generate-summary`, { method: 'POST' })),

  approve: (id) => apiRequest(`/document/${id}/approve`, { method: 'PATCH' }).then(mapDocument),

  discard: (id) => apiRequest(`/document/${id}/discard`, { method: 'PATCH' }).then(mapDocument),

  remove: (id) => apiRequest(`/document/${id}`, { method: 'DELETE' }),
};
