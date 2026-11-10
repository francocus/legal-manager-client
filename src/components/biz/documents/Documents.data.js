// DocumentType enum on the .NET side: 0 Escrito, 1 Expediente, 2 Contrato,
// 3 Prueba, 4 Generado. Upload forms speak lowercase labels and map them to
// the enum value; list rows speak the printed label.
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'escrito', label: 'Escrito', enumValue: 0 },
  { value: 'expediente', label: 'Expediente', enumValue: 1 },
  { value: 'contrato', label: 'Contrato', enumValue: 2 },
  { value: 'prueba', label: 'Prueba', enumValue: 3 },
];

export const getTypeLabel = (type) => {
  const option = Object.values(DOCUMENT_TYPE_OPTIONS).find((entry) => entry.enumValue === type);
  return option?.label ?? (type === 4 ? 'Generado' : '—');
};

export const typeValueToEnum = (value) =>
  DOCUMENT_TYPE_OPTIONS.find((entry) => entry.value === value)?.enumValue ?? null;

export const formatFileSize = (sizeBytes = 0) => {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

// AI drafts awaiting their single review read as pending; after the review
// they carry approve/discard; files uploaded by users wear no chip.
export const getDocumentState = (doc = {}) => {
  if (doc.isPendingReview) return { className: 'is-pending', label: 'Pendiente de revisión' };
  if (doc.generatedByAi && doc.approved === true) {
    return { className: 'is-active', label: 'Aprobado' };
  }
  if (doc.generatedByAi && doc.approved === false) {
    return { className: 'is-closed', label: 'Descartado' };
  }
  return null;
};

// The backend dto sends camelCase; approved/reviewedAt only carry values
// after the single AI review, and isPendingReview marks an unconditional
// draft awaiting the keep/discard decision.
export const mapDocument = (dto = {}) => ({
  id: dto.id ?? '',
  caseId: dto.caseId ?? '',
  fileName: dto.fileName ?? '',
  contentType: dto.contentType ?? '',
  sizeBytes: dto.sizeBytes ?? 0,
  type: dto.type ?? null,
  uploadDate: dto.uploadDate ?? '',
  active: dto.active ?? true,
  generatedByAi: Boolean(dto.generatedByAI),
  reviewedByUserId: dto.reviewedByUserId ?? null,
  reviewedAt: dto.reviewedAt ?? null,
  approved: dto.approved ?? null,
  isPendingReview: Boolean(dto.isPendingReview),
});
