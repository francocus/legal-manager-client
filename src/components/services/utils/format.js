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
