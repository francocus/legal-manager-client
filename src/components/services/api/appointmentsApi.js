import { apiRequest } from '../http/httpClient';
import { getAppointmentMinutes, mapAppointment } from '../../biz/appointments/Appointments.data';

// Mutating appointment actions are dedicated PATCH endpoints (confirm, cancel,
// reschedule): the .NET contract has no PUT /appointment.
export const sortAppointments = (appointments) =>
  appointments.sort(
    (a, b) => a.dateObject - b.dateObject || getAppointmentMinutes(a) - getAppointmentMinutes(b),
  );

export const appointmentsApi = {
  // Raw dto array for bulk loaders (DashboardDataProvider) that resolve names
  // and case numbers after every list is fetched.
  getAllRaw: async () => (await apiRequest('/appointment')) ?? [],

  getAll: async (userNames = {}, caseNumbers = {}) => {
    const data = (await apiRequest('/appointment')) ?? [];
    return sortAppointments(data.map((dto) => mapAppointment(dto, userNames, caseNumbers)));
  },

  // Availability slots arrive as "HH:MM:SS"; they are normalized to "HH:MM".
  getAvailability: async (lawyerId, date) => {
    const data = await apiRequest(`/appointment/availability?lawyerId=${lawyerId}&date=${date}`);
    return (data?.slots ?? []).map((slot) => String(slot).slice(0, 5));
  },

  // POST /appointment computes the status in the backend; clientId/lawyerId are
  // Guid strings and caseId is optional.
  create: (payload) => {
    const body = {
      title: payload?.title,
      date: payload?.date,
      time: payload?.time,
      endTime: payload?.endTime,
      reason: payload?.reason,
      area: payload?.area,
      location: payload?.location,
      notes: payload?.notes,
      clientId: payload?.clientId,
      lawyerId: payload?.lawyerId,
    };

    if (payload?.caseId) {
      body.caseId = payload.caseId;
    }

    return apiRequest('/appointment', { method: 'POST', body });
  },

  confirm: (id) => apiRequest(`/appointment/${id}/confirm`, { method: 'PATCH' }),

  cancel: (id) => apiRequest(`/appointment/${id}/cancel`, { method: 'PATCH' }),

  // Reschedule accepts only date/time/endTime: reason and lawyerId are not
  // accepted there.
  reschedule: (id, payload) =>
    apiRequest(`/appointment/${id}/reschedule`, {
      method: 'PATCH',
      body: {
        date: payload?.date,
        time: payload?.time,
        endTime: payload?.endTime,
      },
    }),

  remove: (id) => apiRequest(`/appointment/${id}`, { method: 'DELETE' }),
};
