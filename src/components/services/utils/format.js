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
    const str = String(value);
    if (str.includes('T') || str.includes(' ') || str.includes(':')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${day}/${month}/${year} ${hours}:${minutes} hs`;
      }
    }
    return formatDate(value, dateFormat);
  } catch {
    return formatDate(value, dateFormat);
  }
};
