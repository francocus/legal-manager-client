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

export const mapAppointment = (appointment = {}) => ({
  ...appointment,
  dateObject: appointment.date ? parseDate(appointment.date) : new Date(0),
  clientName: appointment.client?.name ?? 'Cliente',
  lawyerName: appointment.lawyer?.name ?? 'Abogado',
  lawyerId: appointment.lawyer?.id ?? appointment.lawyerId,
  clientId: appointment.client?.id ?? appointment.clientId,
  caseNumber: appointment.case?.caseNumber ?? 'Sin expediente',
  endTime: appointment.endTime || (appointment.time ? addHour(appointment.time) : ''),
});
