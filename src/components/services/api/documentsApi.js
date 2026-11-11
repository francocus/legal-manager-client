import { apiDownload, apiRequest } from '../http/httpClient';
import { mapDocument, typeValueToEnum } from '../../biz/documents/Documents.data';

// Full .NET document contract (api/document): uploads are multipart,
// AI summaries and constancias are generated into client-held drafts that
// only reach the backend through an explicit save, and removal is always a
// logical deactivation (DELETE), never a physical one.
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

  // Generates one AI summary draft for the case. Confirm-first contract:
  // the draft is NOT persisted, so this returns the raw dto untouched
  // (it has no id/row yet, mapping it as a document would be wrong).
  // 400 on invalid case, 409 on concurrent generation, 502 when the LLM is
  // unreachable.
  generateAiSummary: (caseId) =>
    apiRequest(`/document/case/${caseId}/generate-summary`, { method: 'POST' }),

  // Same confirm-first contract, but for a case constancia: the server
  // always answers with an empty summaryText.
  generateConstancia: (caseId) =>
    apiRequest(`/document/case/${caseId}/generate-constancia`, { method: 'POST' }),

  // Persists a client-held draft. AI drafts arrive already approved
  // server-side; constancias persist with approved = null.
  saveGenerated: ({ caseId, pdfBase64, summaryText, generatedByAi }) =>
    apiRequest('/document/generated', {
      method: 'POST',
      body: { caseId, pdfBase64, summaryText, generatedByAi },
    }).then(mapDocument),

  remove: (id) => apiRequest(`/document/${id}`, { method: 'DELETE' }),
};
