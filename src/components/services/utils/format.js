const pad = (value) => String(value).padStart(2, '0');

// The API stores dates as UTC ISO timestamps ('2026-11-17T17:02:13.3146127Z')
// while some forms still save plain 'yyyy-mm-dd'. Both paths are supported.
const isTimestamp = (value) => {
  if (value instanceof Date) return true;
  const str = String(value);
  return str.includes('T') || str.includes(':');
};

const parseTimestamp = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  let str = String(value).trim();
  if (!str) return null;

  // .NET serializes up to seven fractional digits; keep three so every engine
  // parses the milliseconds consistently.
  str = str.replace(/(\.\d{3})\d+/, '$1');

  // Timestamps without a timezone designator were persisted as UTC.
  if (str.includes('T') && !str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += 'Z';
  }

  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatParts = (date, dateFormat) => {
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value ?? '';

  if (dateFormat === 'yyyy-mm-dd') {
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  return `${get('day')}/${get('month')}/${get('year')}`;
};

export const formatDate = (value, dateFormat = 'dd/mm/yyyy') => {
  if (!value) {
    return '—';
  }

  // A full timestamp must not be split on '-': that would leave the time
  // glued to the day ("17T17:02:13Z/11/2026"). Delegate to the AR calendar.
  if (isTimestamp(value)) {
    const date = parseTimestamp(value);
    if (date) {
      return formatParts(date, dateFormat);
    }
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

  const date = parseTimestamp(value);
  if (!date) {
    return formatDate(value, dateFormat);
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

  const get = (type) => parts.find((part) => part.type === type)?.value ?? '';
  const datePart =
    dateFormat === 'yyyy-mm-dd'
      ? `${get('year')}-${get('month')}-${get('day')}`
      : `${get('day')}/${get('month')}/${get('year')}`;
  return `${datePart} ${get('hour')}:${get('minute')} hs`;
};
