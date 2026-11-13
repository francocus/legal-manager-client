const pad = (value) => String(value).padStart(2, '0');

export const formatDate = (value, dateFormat = 'dd/mm/yyyy') => {
  if (!value) {
    return '—';
  }

  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) {
    return String(value);
  }

  if (dateFormat === 'yyyy-mm-dd') {
    return `${year}-${month}-${day}`;
  }

  return `${pad(day)}/${pad(month)}/${year}`;
};

export const formatDateTime = (value, dateFormat = 'dd/mm/yyyy') => {
  if (!value) {
    return '—';
  }

  try {
    let str = String(value).trim();
    if (str.includes('T') || str.includes(' ') || str.includes(':')) {
      // If the ISO timestamp does not have timezone designators (Z or +/-offset),
      // it was persisted as UTC by backend, so append Z to parse as UTC.
      if (str.includes('T') && !str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
        str += 'Z';
      }
      const date = new Date(str);
      if (!Number.isNaN(date.getTime())) {
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
        const day = get('day');
        const month = get('month');
        const year = get('year');
        const hour = get('hour');
        const minute = get('minute');

        return `${day}/${month}/${year} ${hour}:${minute} hs`;
      }
    }
    return formatDate(value, dateFormat);
  } catch {
    return formatDate(value, dateFormat);
  }
};
