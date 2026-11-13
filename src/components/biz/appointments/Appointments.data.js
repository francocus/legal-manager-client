import { addHour, parseDate } from '../calendar/Calendar.data';

const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const getAppointmentMinutes = (appointment = {}) => {
  const [hours, minutes] = String(appointment.time ?? '0:0')
    .split(':')
    .map(Number);
  return hours * 60 + minutes;
};

export const formatAppointmentDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${d} ${months[date.getMonth()]}`;
};

export const getStatusClass = (status) => {
  const normalizedStatus = normalizeText(status).replace(/\s+/g, '-');
  if (normalizedStatus === 'confirmado') return 'is-confirmed';
  if (normalizedStatus === 'pendiente') return 'is-pending';
  if (normalizedStatus === 'cancelado') return 'is-cancelled';
  if (['finalizado', 'completado'].includes(normalizedStatus)) return 'is-finished';
  return '';
};

export const getAppointmentAccent = (appointment) => {
  const normalizedStatus = normalizeText(appointment.status);
  if (normalizedStatus === 'pendiente') return 'is-warning';
  if (normalizedStatus === 'cancelado') return 'is-danger';
  if (normalizedStatus === 'finalizado' || normalizedStatus === 'completado') return 'is-muted';
  return 'is-primary';
};

// The backend sends flat dto rows with ids only (no nested client/lawyer/case
// objects), so display names come from the userNames/caseNumbers resolver maps.
// Backend time fields keep seconds ('HH:MM:SS') and are normalized to 'HH:MM'.
export const mapAppointment = (appointment = {}, userNames = {}, caseNumbers = {}) => {
  const time = appointment.time ? String(appointment.time).slice(0, 5) : '';
  const endTime = appointment.endTime ? String(appointment.endTime).slice(0, 5) : '';
  const rawStatus = appointment.effectiveStatus ?? appointment.status ?? 'pendiente';
  const status = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : String(rawStatus);

  return {
    ...appointment,
    status,
    dateObject: appointment.date ? parseDate(appointment.date) : new Date(0),
    time,
    endTime: endTime || (time ? addHour(time) : ''),
    clientName: userNames[appointment.clientId] ?? appointment.client?.name ?? 'Cliente',
    lawyerName: userNames[appointment.lawyerId] ?? appointment.lawyer?.name ?? 'Abogado',
    lawyerId: appointment.lawyerId ?? appointment.lawyer?.id,
    clientId: appointment.clientId ?? appointment.client?.id,
    caseNumber: caseNumbers[appointment.caseId] ?? appointment.case?.caseNumber ?? 'Sin expediente',
  };
};
