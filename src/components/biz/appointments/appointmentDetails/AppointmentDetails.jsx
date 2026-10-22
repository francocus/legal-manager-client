import { Link } from 'react-router';
import { getStatusClass } from '../Appointments.data';

const AppointmentDetails = ({ appointment, user, onStatus, onCancel, onEdit }) => {
  const status = appointment.status.toLowerCase();
  const isClient = user?.role === 'cliente';
  const showActions = user?.role === 'abogado' && status !== 'finalizado';

  return (
    <article className="appointment-card">
      <Link to={`/dashboard/appointments/${appointment.id}`} className="appointment-card__link">
        <div className="appointment-card__row">
          <span className="appointment-card__date">
            {appointment.date} · {appointment.time} - {appointment.endTime}
          </span>
          <span className={`appointment-details__status ${getStatusClass(appointment.status)}`}>
            {appointment.status}
          </span>
        </div>
        <h3 className="appointment-card__title">
          {isClient ? appointment.lawyerName : appointment.clientName}
        </h3>
        <p className="appointment-card__reason">{appointment.reason}</p>
        <p className="appointment-card__meta">
          {isClient ? 'Abogado' : 'Cliente'}: {isClient ? appointment.lawyerName : appointment.clientName}
        </p>
      </Link>

      {showActions ? (
        <div className="appointment-card__actions">
          {status === 'pendiente' ? (
            <button
              type="button"
              className="appointment-admin-action appointment-admin-action--confirm"
              title="Confirmar turno"
              aria-label="Confirmar turno"
              onClick={() => onStatus(appointment, 'confirmado')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
              </svg>
            </button>
          ) : null}
          {status !== 'cancelado' ? (
            <button
              type="button"
              className="appointment-admin-action appointment-admin-action--delete"
              title="Cancelar turno"
              aria-label="Cancelar turno"
              onClick={() => onCancel(appointment)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="appointment-admin-action appointment-admin-action--edit"
            title="Editar turno"
            aria-label="Editar turno"
            onClick={() => onEdit(appointment)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 17.25V20h2.75L18.81 7.94l-2.75-2.75L4 17.25Zm14.71-9.54a.996.996 0 0 0 0-1.41l-1.01-1.01a.996.996 0 1 0-1.41 1.41l1.01 1.01c.39.39 1.03.39 1.41 0Z" />
            </svg>
          </button>
        </div>
      ) : null}
    </article>
  );
};

export default AppointmentDetails;
