// deactivatedAt is an ISO string (or legacy 'yyyy-mm-dd') or null.
// Formats the exact date and time the item has been in the trash: DD/MM/YYYY HH:mm hs (hora Argentina).
export const getDaysMeta = (deactivatedAt) => {
  if (!deactivatedAt) {
    return '—';
  }
  let str = String(deactivatedAt).trim();
  if (str.includes('T') && !str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += 'Z';
  }
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')} hs`;
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
