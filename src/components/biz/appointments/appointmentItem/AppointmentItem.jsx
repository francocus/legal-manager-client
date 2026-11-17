import { getStatusClass } from '../Appointments.data';

const AppointmentItem = ({ appointment, onStatus, onCancel, onEdit, onDelete, onSelect }) => {
  const status = appointment.status?.toLowerCase() ?? '';

  return (
    <tr
      className={`appointment-admin-row${onSelect ? ' is-clickable' : ''}`}
      onClick={() => onSelect?.(appointment)}
    >
      <td className="appointment-admin-cell appointment-admin-cell--main">
        <div className="appointment-admin-main">
          <span className="appointment-admin-main__name">{appointment.clientName}</span>
          <span className="appointment-admin-main__lawyer">{appointment.lawyerName}</span>
        </div>
      </td>
      <td className="appointment-admin-cell appointment-admin-cell--muted">
        {appointment.date} {appointment.time}
      </td>
      <td className="appointment-admin-cell appointment-admin-cell--muted">{appointment.reason}</td>
      <td className="appointment-admin-cell">
        <span className={`appointment-details__status ${getStatusClass(appointment.status)}`}>
          {appointment.status}
        </span>
      </td>
      <td className="appointment-admin-cell appointment-admin-cell--actions">
        <div className="appointment-admin-actions">
          {status === 'pendiente' && (
            <button
              type="button"
              className="appointment-admin-action appointment-admin-action--confirm"
              title="Confirmar turno"
              aria-label="Confirmar turno"
              onClick={(event) => {
                event.stopPropagation();
                onStatus?.(appointment, 'confirmado');
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
              </svg>
            </button>
          )}
          {status !== 'cancelado' && status !== 'finalizado' && (
            <button
              type="button"
              className="appointment-admin-action appointment-admin-action--cancel"
              title="Cancelar turno"
              aria-label="Cancelar turno"
              onClick={(event) => {
                event.stopPropagation();
                onCancel?.(appointment);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
              </svg>
            </button>
          )}
          {status !== 'finalizado' && (
            <button
              type="button"
              className="appointment-admin-action appointment-admin-action--edit"
              title="Editar turno"
              aria-label="Editar turno"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(appointment);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 17.25V20h2.75L18.81 7.94l-2.75-2.75L4 17.25Zm14.71-9.54a.996.996 0 0 0 0-1.41l-1.01-1.01a.996.996 0 1 0-1.41 1.41l1.01 1.01c.39.39 1.03.39 1.41 0Z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="appointment-admin-action appointment-admin-action--delete"
            title="Eliminar turno"
            aria-label="Eliminar turno"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(appointment);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 3.75h6l1 1.5H20v1.5H4v-1.5h4l1-1.5Zm1.5 5.25h1.5v7.5h-1.5v-7.5Zm4.5 0h1.5v7.5H15v-7.5Zm-8.25 0h1.5v7.5h-1.5v-7.5Zm1.5 11.25h9A1.75 1.75 0 0 0 19 18v-8.25H5V18c0 .97.78 1.75 1.75 1.75Z" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AppointmentItem;
