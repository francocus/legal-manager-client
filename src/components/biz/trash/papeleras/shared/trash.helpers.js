const DAY_MS = 86400000;

// deactivatedAt is 'yyyy-mm-dd' or null for legacy rows; null (or anything
// the browser cannot parse) falls back to the placeholder dash.
export const getDaysMeta = (deactivatedAt) => {
  if (!deactivatedAt) {
    return '—';
  }
  const deactivated = new Date(deactivatedAt);
  if (Number.isNaN(deactivated.getTime())) {
    return '—';
  }
  const days = Math.floor((Date.now() - deactivated.getTime()) / DAY_MS);
  if (days <= 0) {
    return 'En la papelera desde hoy';
  }
  return `En la papelera hace ${days} ${days === 1 ? 'día' : 'días'}`;
};

// 'N turnos · M documentos asociados' is shown only while at least one of the
// linked counters is above zero, pluralizing each count naturally.
export const getChildrenMeta = (entry = {}) => {
  const totalAppointments = entry.totalAppointments ?? 0;
  const totalDocuments = entry.totalDocuments ?? 0;
  if (totalAppointments + totalDocuments <= 0) {
    return null;
  }
  return `${totalAppointments} ${totalAppointments === 1 ? 'turno' : 'turnos'} · ${
    totalDocuments
  } ${totalDocuments === 1 ? 'documento' : 'documentos'} asociados`;
};

// caseNumber/caseTitle are null when the parent case is inactive; the dash
// between number and title is skipped when the title is missing.
export const getDocumentCaseLabel = (entry = {}) => {
  if (!entry.caseNumber) {
    return '—';
  }
  return entry.caseTitle ? `${entry.caseNumber} - ${entry.caseTitle}` : entry.caseNumber;
};
