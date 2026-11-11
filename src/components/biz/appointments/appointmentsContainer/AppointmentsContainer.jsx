import { useContext, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { appointmentsApi } from '../../../services/api/appointmentsApi';
import { useToast } from '../../../shared/toast/toast.context';
import { usePagination } from '../../../services/hooks/usePagination';
import { normalizeText } from '../../calendar/Calendar.data.js';
import AppointmentDetails from '../appointmentDetails/AppointmentDetails';
import AppointmentItem from '../appointmentItem/AppointmentItem';
import AppointmentsSearch from '../appointmentsSearch/AppointmentsSearch';
import NewAppointment from '../newAppointment/NewAppointment';
import ConfirmDialog from '../../../shared/confirmDialog/ConfirmDialog';
import { SkeletonRows } from '../../../shared/skeleton/Skeleton';
import EmptyState from '../../../shared/emptyState/EmptyState';
import Pagination from '../../../shared/pagination/Pagination';
import { ROLES } from '../../../services/consts/roles';
import '../appointments.css';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const AppointmentsContainer = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthenticationContext);
  const { appointments, clients, lawyers, loading, error, refreshAppointments } =
    useDashboardData();
  const { showToast } = useToast();

  const [searchAppointment, setSearchAppointment] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRequest, setShowRequest] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const isSysadmin = user?.role === ROLES.SYSADMIN;

  // Appointment lifecycle: confirm/cancel are dedicated PATCH endpoints, and
  // 'pendiente'/'finalizado' have no update endpoint (the backend computes
  // 'Finalizado' itself), so any other status value is rejected here.
  const handleStatus = async (appointment, status) => {
    const statusAction = { confirmado: 'confirm', cancelado: 'cancel' }[status];

    if (!statusAction) {
      showToast({
        variant: 'danger',
        message: 'Solo se puede confirmar o cancelar un turno.',
      });
      return;
    }

    try {
      await appointmentsApi[statusAction](appointment.id);
      await refreshAppointments();
      showToast({ variant: 'success', message: 'Turno actualizado correctamente.' });
    } catch (statusError) {
      showToast({
        variant: 'danger',
        message: statusError.message || 'No se pudo actualizar el turno.',
      });
    }
  };

  const handleRequest = async (form) => {
    await appointmentsApi.create(form);
    await refreshAppointments();
  };

  // The edit modal emits a reschedule payload: { date, time, endTime }.
  const handleEdit = async (appointment, form) => {
    await appointmentsApi.reschedule(appointment.id, form);
    await refreshAppointments();
    setAppointmentToEdit(null);
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await appointmentsApi.remove(id);
      await refreshAppointments();
      setAppointmentToDelete(null);
      showToast({ variant: 'success', message: 'Turno eliminado correctamente.' });
    } catch (deleteError) {
      showToast({
        variant: 'danger',
        message: deleteError.message || 'No se pudo eliminar el turno.',
      });
      throw deleteError;
    }
  };

  const searchValue = normalizeText(searchAppointment.trim());

  const roleFilteredAppointments = appointments.filter((appointment) => {
    if (statusFilter !== 'all' && appointment.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (user?.role === ROLES.ABOGADO) return appointment.lawyerId === user.id;
    if (user?.role === ROLES.CLIENTE) return appointment.clientId === user.id;
    return true;
  });

  const filteredAppointments = searchValue
    ? roleFilteredAppointments.filter((appointment) =>
        normalizeText(
          [
            appointment.clientName,
            appointment.lawyerName,
            appointment.reason,
            appointment.status,
            appointment.caseNumber,
          ].join(' '),
        ).includes(searchValue),
      )
    : roleFilteredAppointments;

  const { page, setPage, totalPages, pageItems } = usePagination(filteredAppointments, PAGE_SIZE);

  return (
    <section
      className={`appointments-panel ${isSysadmin ? 'appointments-panel--admin' : ''}${filteredAppointments.length > 0 ? ' has-scroll-content' : ''}`}
    >
      <div className="appointments-toolbar">
        <div>
          <p className="appointments-toolbar__eyebrow">
            {isSysadmin ? 'Gestión de turnos' : 'Visualizá y gestioná los turnos'}
          </p>
          <h2>{isSysadmin ? 'Gestión de turnos' : 'Turnos programados'}</h2>
        </div>

        <div className="appointments-toolbar__actions">
          <select
            className="appointments-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrar por estado"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="appointments-search-field">
            <AppointmentsSearch onSearch={setSearchAppointment} />
          </div>

          <Button
            type="button"
            className="appointments-create"
            onClick={() => setShowRequest(true)}
          >
            {user?.role === ROLES.CLIENTE ? 'Solicitar turno' : 'Agendar turno'}
          </Button>
        </div>
      </div>

      {error ? (
        <Alert className="users-alert" variant="danger">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <SkeletonRows rows={4} />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          title="No se encontraron turnos"
          message="Probá con otro término de búsqueda o cambiá el filtro de estado."
        />
      ) : (
        <>
          {!isSysadmin && (
            <div className="appointments-cards-grid">
              {pageItems.map((appointment) => (
                <AppointmentDetails
                  key={appointment.id}
                  appointment={appointment}
                  user={user}
                  onStatus={handleStatus}
                  onCancel={setAppointmentToCancel}
                  onEdit={setAppointmentToEdit}
                />
              ))}
            </div>
          )}

          {isSysadmin && (
            <div className="appointments-table-wrap">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Cliente / Abogado</th>
                    <th>Fecha</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={setAppointmentToEdit}
                      onDelete={setAppointmentToDelete}
                      onSelect={() => navigate(`/dashboard/appointments/${appointment.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        show={Boolean(appointmentToDelete)}
        onHide={() => setAppointmentToDelete(null)}
        onConfirm={() => handleDeleteAppointment(appointmentToDelete?.id)}
        title="Eliminar turno"
        message="¿Estás seguro que deseas eliminar el turno de"
        itemName={appointmentToDelete?.clientName}
        confirmLabel="Sí, deseo eliminarlo"
      />

      <ConfirmDialog
        show={Boolean(appointmentToCancel)}
        onHide={() => setAppointmentToCancel(null)}
        onConfirm={() => handleStatus(appointmentToCancel, 'cancelado')}
        title="Cancelar turno"
        message="¿Estás seguro que deseas cancelar el turno de"
        itemName={appointmentToCancel?.clientName}
        confirmLabel="Sí, deseo cancelarlo"
      />

      <NewAppointment
        key={
          showRequest || Boolean(appointmentToEdit) ? (appointmentToEdit?.id ?? 'new') : 'closed'
        }
        show={showRequest || Boolean(appointmentToEdit)}
        appointment={appointmentToEdit}
        onHide={() => {
          setShowRequest(false);
          setAppointmentToEdit(null);
        }}
        onSubmit={appointmentToEdit ? handleEdit : handleRequest}
        lawyers={lawyers}
        clients={clients}
        appointments={appointments}
        user={user}
      />
    </section>
  );
};

export default AppointmentsContainer;
