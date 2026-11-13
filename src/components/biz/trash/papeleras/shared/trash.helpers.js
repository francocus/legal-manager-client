// deactivatedAt is an ISO string (or legacy 'yyyy-mm-dd') or null.
// Formats the exact date and time the item has been in the trash: DD/MM/YYYY HH:mm hs.
export const getDaysMeta = (deactivatedAt) => {
  if (!deactivatedAt) {
    return '—';
  }
  const date = new Date(deactivatedAt);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes} hs`;
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
