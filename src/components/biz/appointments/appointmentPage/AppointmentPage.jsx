import { useContext, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usePreferences } from '../../../services/preferences/preferences.context';
import { appointmentsApi } from '../../../services/api/appointmentsApi';
import { useToast } from '../../../shared/toast/toast.context';
import { formatDate } from '../../../services/utils/format';
import { ROLES } from '../../../services/consts/roles';
import { getStatusClass } from '../Appointments.data';
import NewAppointment from '../newAppointment/NewAppointment';
import '../appointments.css';

const AppointmentPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthenticationContext);
  const { appointments, cases, clients, lawyers, loading, refreshAppointments } =
    useDashboardData();
  const { preferences } = usePreferences();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);

  const appointment = appointments.find((entry) => String(entry.id) === String(appointmentId));
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.ABOGADO;

  // Appointment lifecycle: confirm/cancel are dedicated PATCH endpoints, and
  // other statuses have no update endpoint, so they are rejected here.
  const handleStatus = async (status) => {
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

  // The edit modal emits a reschedule payload: { date, time, endTime }.
  const handleEdit = async (currentAppointment, form) => {
    await appointmentsApi.reschedule(currentAppointment.id, form);
    await refreshAppointments();
    showToast({ variant: 'success', message: 'Turno actualizado correctamente.' });
    setEditing(false);
  };

  if (loading) {
    return (
      <section className="app-page">
        <p className="app-page__subtitle">Cargando turno...</p>
      </section>
    );
  }

  if (!appointment) {
    return (
      <section className="app-page">
        <Alert variant="danger">No se encontró el turno solicitado.</Alert>
        <Link className="app-button app-button--secondary" to="/dashboard/appointments">
          Volver a turnos
        </Link>
      </section>
    );
  }

  const status = appointment.status.toLowerCase();

  return (
    <section className="app-page">
      <div className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Turno</p>
          <h2 className="app-page__title">{appointment.clientName}</h2>
          <p className="app-page__subtitle">Con {appointment.lawyerName}</p>
        </div>
        <div className="app-page__toolbar">
          <span className={`appointment-details__status ${getStatusClass(appointment.status)}`}>
            {appointment.status}
          </span>
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate('/dashboard/appointments')}
          >
            Volver
          </button>
          {canManage && status !== 'finalizado' ? (
            <button
              type="button"
              className="app-button app-button--primary"
              onClick={() => setEditing(true)}
            >
              Editar turno
            </button>
          ) : null}
        </div>
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Datos del turno</h3>
        <dl className="app-detail-grid">
          <div>
            <dt>Fecha</dt>
            <dd>{formatDate(appointment.date, preferences.dateFormat)}</dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd>
              {appointment.time} - {appointment.endTime}
            </dd>
          </div>
          <div>
            <dt>Expediente</dt>
            <dd>{appointment.caseNumber}</dd>
          </div>
          <div>
            <dt>Área</dt>
            <dd>{appointment.area || '—'}</dd>
          </div>
          <div>
            <dt>Ubicación</dt>
            <dd>{appointment.location || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Motivo</h3>
        <p className="app-text">{appointment.reason || 'Sin motivo.'}</p>
      </div>

      {appointment.notes ? (
        <div className="app-panel">
          <h3 className="app-panel__title">Notas</h3>
          <p className="app-text">{appointment.notes}</p>
        </div>
      ) : null}

      {canManage && status !== 'finalizado' ? (
        <div className="app-panel app-panel--actions">
          {status === 'pendiente' ? (
            <button
              type="button"
              className="app-button app-button--primary"
              onClick={() => handleStatus('confirmado')}
            >
              Confirmar turno
            </button>
          ) : null}
          {status !== 'cancelado' ? (
            <button
              type="button"
              className="app-button app-button--danger"
              onClick={() => handleStatus('cancelado')}
            >
              Cancelar turno
            </button>
          ) : null}
        </div>
      ) : null}

      <NewAppointment
        key={editing ? (appointment?.id ?? 'new') : 'closed'}
        show={editing}
        appointment={appointment}
        onHide={() => setEditing(false)}
        onSubmit={handleEdit}
        lawyers={lawyers}
        clients={clients}
        cases={cases}
        appointments={appointments}
        user={user}
      />
    </section>
  );
};

export default AppointmentPage;
