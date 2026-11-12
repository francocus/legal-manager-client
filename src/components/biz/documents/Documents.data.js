// DocumentType enum on the .NET side: 0 Escrito, 1 Expediente, 2 Contrato,
// 3 Prueba, 4 Generado. Upload forms speak lowercase labels and map them to
// the enum value; list rows speak the printed label.
// The backend serializes enums as strings (JsonStringEnumConverter), so
// incoming rows carry "Escrito"/"Generado"/... while uploads still send
// integers (accepted by the same converter). Labels resolve both shapes.
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'escrito', label: 'Escrito', enumValue: 0 },
  { value: 'expediente', label: 'Expediente', enumValue: 1 },
  { value: 'contrato', label: 'Contrato', enumValue: 2 },
  { value: 'prueba', label: 'Prueba', enumValue: 3 },
];

const GENERATED_LABEL = 'Generado';

export const getTypeLabel = (type) => {
  const option = Object.values(DOCUMENT_TYPE_OPTIONS).find(
    (entry) =>
      entry.enumValue === type ||
      entry.label.toLowerCase() === String(type ?? '').toLowerCase(),
  );
  const isGenerated = type === 4 || String(type ?? '') === GENERATED_LABEL;
  return option?.label ?? (isGenerated ? GENERATED_LABEL : '—');
};

export const typeValueToEnum = (value) =>
  DOCUMENT_TYPE_OPTIONS.find((entry) => entry.value === value)?.enumValue ?? null;

export const formatFileSize = (sizeBytes = 0) => {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Confirm-first reality: nothing generated is persisted until the user
// hits "Guardar", which posts the draft to /document/generated. AI drafts
// arrive already approved (approved = true) and wear the "Aprobado" chip;
// saved constancias persist with approved = null (type Generado) and get
// the neutral "Generado" chip. isPendingReview is a legacy defensive dto
// flag kept only so stale pending drafts still read as pending; uploaded
// files wear no chip.
export const getDocumentState = (doc = {}) => {
  if (doc.isPendingReview) return { className: 'is-pending', label: 'Pendiente de revisión' };
  if (doc.generatedByAi && doc.approved === true) {
    return { className: 'is-active', label: 'Aprobado' };
  }
  if ((doc.generatedByAi || doc.type === 4 || doc.type === 'Generado') && doc.approved === null) {
    return { className: 'is-closed', label: 'Generado' };
  }
  return null;
};

// The backend dto sends camelCase; approved is true for AI documents saved
// through /document/generated, null for constancias and uploaded files, and
// isPendingReview survives only as a legacy defensive flag.
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
