import { useNavigate } from 'react-router';
import { Alert } from 'react-bootstrap';
import { useTrash } from '../shared/useTrash';
import { getDaysMeta } from '../shared/trash.helpers';
import TrashActions from '../shared/TrashActions';
import { SkeletonRows } from '../../../../shared/skeleton/Skeleton';
import EmptyState from '../../../../shared/emptyState/EmptyState';
import { formatDate } from '../../../../services/utils/format';
import { getStatusClass } from '../../../appointments/Appointments.data';
import '../../../appointments/appointments.css';
import '../../trash.css';

// Papelera for turnos (admins and lawyers): mirrors the AppointmentsContainer
// panel, toolbar and table chrome while listing only trashed turnos. The
// backend already filters lawyer items server-side, so both roles see exactly
// the rows they may restore.
const TurnosPapelera = () => {
  const navigate = useNavigate();
  const { trash, loading, error, restore } = useTrash();
  const appointments = trash.appointments;

  return (
    <section className="appointments-panel appointments-panel--admin">
      <div className="appointments-toolbar">
        <div>
          <p className="appointments-toolbar__eyebrow">Papelera de turnos</p>
          <h2>Papelera de turnos</h2>
        </div>

        <div className="appointments-toolbar__actions">
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate('/dashboard/appointments')}
          >
            Volver
          </button>
        </div>
      </div>

      {error ? (
        <Alert className="users-alert" variant="danger">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? null : appointments.length === 0 ? (
        <EmptyState
          title="La papelera está vacía."
          message="No hay elementos eliminados por ahora."
        />
      ) : (
        <div className="appointments-table-wrap">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Turno</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>En la papelera</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((entry) => {
                const appointment = entry.appointment ?? {};
                return (
                  <tr key={appointment.id}>
                    <td className="appointment-admin-cell appointment-admin-cell--main">
                      <div className="trash-main">
                        <span className="trash-main__name">{appointment.title || '—'}</span>
                      </div>
                    </td>
                    <td className="appointment-admin-cell appointment-admin-cell--muted">
                      {formatDate(appointment.date)} {appointment.time}
                    </td>
                    <td className="appointment-admin-cell">
                      <span
                        className={`appointment-details__status ${getStatusClass(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="appointment-admin-cell appointment-admin-cell--muted">
                      <span className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</span>
                    </td>
                    <td className="appointment-admin-cell appointment-admin-cell--actions">
                      <TrashActions onRestore={() => restore('appointment', appointment.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TurnosPapelera;
