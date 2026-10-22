import { apiRequest } from '../http/httpClient';
import { getAppointmentMinutes, mapAppointment } from '../../biz/appointments/Appointments.data';

const sortAppointments = (appointments) =>
  appointments.sort(
    (a, b) => a.dateObject - b.dateObject || getAppointmentMinutes(a) - getAppointmentMinutes(b),
  );

export const appointmentsApi = {
  getAll: async () => {
    const data = await apiRequest('/appointments');
    return sortAppointments((data?.appointments ?? []).map(mapAppointment));
  },

  getAvailability: async (lawyerId, date) =>
    (await apiRequest(`/appointments/availability?lawyerId=${lawyerId}&date=${date}`))?.slots ?? [],

  create: (payload) => apiRequest('/appointments', { method: 'POST', body: payload }),

  update: (id, payload) => apiRequest(`/appointments/${id}`, { method: 'PUT', body: payload }),

  remove: (id) => apiRequest(`/appointments/${id}`, { method: 'DELETE' }),
};
