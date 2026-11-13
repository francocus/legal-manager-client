import { Link } from 'react-router';
import { Clock, UserRound, Briefcase, FileText } from 'lucide-react';
import { getStatusClass, parseAppointmentDateParts } from '../Appointments.data';
import { isAdmin, isLawyer } from '../../../services/consts/roles';

const AppointmentDetails = ({ appointment, user, onStatus, onCancel, onEdit, onDelete }) => {
  const status = appointment.status?.toLowerCase() ?? '';
  const isClient = user?.role === 'cliente';
  const userIsLawyer = isLawyer(user?.role);
  const userIsAdmin = isAdmin(user?.role);

  // Can delete if admin OR if lawyer assigned to this appointment
  const canDelete = userIsAdmin || (userIsLawyer && appointment.lawyerId === user.id);
  const showActions = (userIsLawyer || userIsAdmin) && status !== 'finalizado';

  const dateParts = parseAppointmentDateParts(appointment.date);
  const titleText = appointment.reason || appointment.title || 'Consulta jurídica';
  const showSecondaryReason =
    appointment.title &&
    appointment.reason &&
    appointment.title !== appointment.reason &&
    appointment.title !== 'Solicitud de turno';

  return (
    <article className={`appointment-ticket is-${status}`}>
      {/* 1. Left Stub: Dedicated Calendar Voucher */}
      <div className="appointment-ticket__stub">
        <span className="appointment-ticket__month">{dateParts.monthName}</span>
        <span className="appointment-ticket__day">{dateParts.dayNumber}</span>
        <span className="appointment-ticket__dayname">{dateParts.dayName}</span>
        <div className="appointment-ticket__time-pill">
          <Clock size={11} className="appointment-ticket__time-icon" />
          <span>{appointment.time || '--:--'}</span>
        </div>
      </div>

      {/* 2. Physical Ticket Divider with Notches & Perforation */}
      <div className="appointment-ticket__divider" aria-hidden="true">
        <span className="appointment-ticket__notch appointment-ticket__notch--top" />
        <span className="appointment-ticket__perforation" />
        <span className="appointment-ticket__notch appointment-ticket__notch--bottom" />
      </div>

      {/* 3. Ticket Main Body */}
      <div className="appointment-ticket__body">
        <div className="appointment-ticket__top">
          <div className="appointment-ticket__top-badges">
            <span className={`appointment-details__status ${getStatusClass(appointment.status)}`}>
              {appointment.status}
            </span>
            {appointment.caseNumber && appointment.caseNumber !== 'Sin expediente' ? (
              <span className="appointment-ticket__case-pill">
                <FileText size={12} />
                <span>Exp. {appointment.caseNumber}</span>
              </span>
            ) : null}
          </div>

          {/* Action buttons inside header */}
          <div className="appointment-ticket__actions">
            {showActions && status === 'pendiente' ? (
              <button
                type="button"
                className="appointment-admin-action appointment-admin-action--confirm"
                title="Confirmar turno"
                aria-label="Confirmar turno"
                onClick={() => onStatus?.(appointment, 'confirmado')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                </svg>
              </button>
            ) : null}

            {showActions && status !== 'cancelado' ? (
              <button
                type="button"
                className="appointment-admin-action appointment-admin-action--delete"
                title="Cancelar turno"
                aria-label="Cancelar turno"
                onClick={() => onCancel?.(appointment)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
                  <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
                </svg>
              </button>
            ) : null}

            {showActions ? (
              <button
                type="button"
                className="appointment-admin-action appointment-admin-action--edit"
                title="Reprogramar turno"
                aria-label="Reprogramar turno"
                onClick={() => onEdit?.(appointment)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M4 17.25V20h2.75L18.81 7.94l-2.75-2.75L4 17.25Zm14.71-9.54a.996.996 0 0 0 0-1.41l-1.01-1.01a.996.996 0 1 0-1.41 1.41l1.01 1.01c.39.39 1.03.39 1.41 0Z" />
                </svg>
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                className="appointment-admin-action appointment-admin-action--trash"
                title="Mandar a la papelera"
                aria-label="Mandar a la papelera"
                onClick={() => onDelete?.(appointment)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M9 3.75h6l1 1.5H20v1.5H4v-1.5h4l1-1.5Zm1.5 5.25h1.5v7.5h-1.5v-7.5Zm4.5 0h1.5v7.5H15v-7.5Zm-8.25 0h1.5v7.5h-1.5v-7.5Zm1.5 11.25h9A1.75 1.75 0 0 0 19 18v-8.25H5V18c0 .97.78 1.75 1.75 1.75Z" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Content Link */}
        <Link to={`/dashboard/appointments/${appointment.id}`} className="appointment-ticket__content">
          <div className="appointment-ticket__titles">
            <h3 className="appointment-ticket__subject">{titleText}</h3>
            {showSecondaryReason ? (
              <p className="appointment-ticket__desc">{appointment.title}</p>
            ) : null}
          </div>

          <div className="appointment-ticket__footer">
            <div className="appointment-ticket__participant">
              {isClient ? (
                <>
                  <Briefcase size={14} className="appointment-ticket__participant-icon" />
                  <span className="appointment-ticket__participant-text">
                    <span className="appointment-ticket__label">Abogado:</span>{' '}
                    <strong>{appointment.lawyerName}</strong>
                  </span>
                </>
              ) : (
                <>
                  <UserRound size={14} className="appointment-ticket__participant-icon" />
                  <span className="appointment-ticket__participant-text">
                    <span className="appointment-ticket__label">Cliente:</span>{' '}
                    <strong>{appointment.clientName}</strong>
                  </span>
                </>
              )}
            </div>

            {appointment.endTime ? (
              <span className="appointment-ticket__duration">
                Hasta las {appointment.endTime} hs
              </span>
            ) : null}
          </div>
        </Link>
      </div>
    </article>
  );
};

export default AppointmentDetails;
