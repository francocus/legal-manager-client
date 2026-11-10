import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import {
  addDays,
  addHour,
  addMonths,
  formatMonthTitle,
  getDateKey,
  getSunday,
  pad,
  parseDate,
} from '../../calendar/Calendar.data';
import { DAY_NAMES, SLOTS, MONTH_NAMES } from '../../../services/consts/calendarConsts';
import { appointmentsApi } from '../../../services/api/appointmentsApi';
import { useToast } from '../../../shared/toast/toast.context';

const emptyForm = { lawyerId: '', date: '', time: '', reason: '' };
const todayKey = getDateKey(addDays(new Date(), 1));
const NewAppointment = ({
  show,
  onHide,
  onSubmit,
  lawyers,
  clients,
  user,
  appointments = [],
  appointment,
}) => {
  const { showToast } = useToast();
  const [isEdit, setIsEdit] = useState(Boolean(appointment));
  const [form, setForm] = useState(emptyForm);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  useEffect(() => {
    if (!show) return;
    setIsEdit(Boolean(appointment));
    setMessage('');
    const n = new Date();
    setCalendarMonth(new Date(n.getFullYear(), n.getMonth(), 1));
    // Editing reschedules only (date/time); reason, lawyer and status are
    // not accepted for edit anymore.
    setForm(
      appointment
        ? {
            date: appointment.date,
            time: appointment.time,
            reason: appointment.reason,
          }
        : emptyForm,
    );
  }, [show, appointment]);

  useEffect(() => {
    const loadSlots = async () => {
      setSlots([]);
      if (isEdit || !form.lawyerId || !form.date) return;
      try {
        const availableSlots = await appointmentsApi.getAvailability(form.lawyerId, form.date);
        setSlots(availableSlots);
      } catch (_error) {
        setSlots([]);
      }
    };

    loadSlots();
  }, [form.date, form.lawyerId, isEdit]);

  const monthStart = calendarMonth;
  const monthGridStart = getSunday(monthStart);
  const monthDays = Array.from({ length: 35 }, (_, index) => addDays(monthGridStart, index));
  const busyDates = appointments
    .filter(({ lawyerId, status }) => String(lawyerId) === form.lawyerId && status !== 'cancelado')
    .reduce((dates, { date }) => ({ ...dates, [date]: true }), {});

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!form.date || !form.time || !form.reason.trim() || (!isEdit && !form.lawyerId))
      return setMessage(
        isEdit ? 'Completa fecha, horario y motivo.' : 'Completa abogado, fecha, horario y motivo.',
      );

    // clientId is required by the contract: the cliente role always requests
    // for itself (Guid from the claims), the other roles must select a client.
    const clientId = form.clientId || (user?.role === 'cliente' ? user?.id : undefined);
    if (!isEdit && user?.role !== 'cliente' && !clientId)
      return setMessage('Selecciona un cliente para el turno.');
    if (!isEdit && form.date < todayKey)
      return setMessage('La fecha no puede ser anterior al día de hoy.');
    try {
      setLoading(true);
      // Creating posts the contract body (no status: the backend computes
      // 'Pendiente') with Guid string ids; editing reschedules only
      // date/time/endTime.
      await onSubmit(
        isEdit
          ? appointment
          : {
              ...form,
              clientId,
              lawyerId: form.lawyerId,
              title: 'Solicitud de turno',
              endTime: addHour(form.time),
            },
        isEdit
          ? {
              date: form.date,
              time: form.time,
              endTime: addHour(form.time),
            }
          : undefined,
      );
      showToast({
        variant: 'success',
        message: isEdit ? 'Turno actualizado correctamente.' : 'Turno solicitado correctamente.',
      });
      onHide();
    } catch (error) {
      setMessage(error.message || `No se pudo ${isEdit ? 'modificar' : 'solicitar'} el turno.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && !isEdit && user?.role === 'abogado') {
      setForm((prev) => ({ ...prev, lawyerId: user.id }));
    }
  }, [show, isEdit, user]);

  return (
    <Modal
      show={show}
      centered
      backdrop="static"
      onHide={onHide}
      dialogClassName={`cases-modal__dialog ${isEdit ? '' : 'appointment-request-modal__dialog'}`}
      contentClassName="cases-modal__content"
      backdropClassName="cases-modal__backdrop"
    >
      <Modal.Header className="cases-modal__header" closeButton closeVariant="white">
        <div>
          <p className="cases-modal__eyebrow">Agenda</p>
          <Modal.Title>
            {isEdit
              ? 'Modificar turno'
              : user?.role === 'cliente'
                ? 'Solicitar turno'
                : 'Agendar turno'}
          </Modal.Title>
        </div>
      </Modal.Header>
      <Form className="cases-form text-white" onSubmit={submit}>
        <Modal.Body className={`cases-modal__body ${isEdit ? '' : 'appointment-request-modal'}`}>
          {message && <Alert variant="danger">{message}</Alert>}

          {!isEdit && user?.role !== 'cliente' && (
            <Form.Group className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Select
                value={form.clientId || ''}
                onChange={(event) => setForm({ ...form, clientId: event.target.value })}
              >
                <option value="">Seleccionar cliente</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {/* The lawyer is schedule-locked at creation; reschedule does not
              accept lawyerId. */}
          {user?.role !== 'abogado' && !isEdit && (
            <Form.Group className="mb-3">
              <Form.Label>Abogado</Form.Label>
              <Form.Select
                value={form.lawyerId || ''}
                onChange={(event) => setForm({ ...form, lawyerId: event.target.value, time: '' })}
              >
                <option value="">Seleccionar abogado</option>
                {lawyers?.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {isEdit ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Horario</Form.Label>
                <Form.Select
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                >
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          ) : (
            <div className="appointment-request-modal__grid">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9fb8cc',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: '0 6px',
                    }}
                    onClick={() => setCalendarMonth((m) => addMonths(m, -1))}
                  >
                    {'<'}
                  </button>
                  <span className="appointment-request-modal__month" style={{ margin: 0 }}>
                    {formatMonthTitle(monthStart)}
                  </span>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9fb8cc',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: '0 6px',
                    }}
                    onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                  >
                    {'>'}
                  </button>
                </div>
                <div className="appointment-request-modal__calendar">
                  {DAY_NAMES.map((dayName) => (
                    <span key={dayName}>{dayName}</span>
                  ))}
                  {monthDays.map((date) => {
                    const dateKey = getDateKey(date);
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        disabled={dateKey < todayKey}
                        className={`${form.date === dateKey ? 'is-selected' : ''} ${busyDates[dateKey] ? 'has-appointments' : ''} ${date.getMonth() !== monthStart.getMonth() || dateKey < todayKey ? 'is-muted' : ''}`}
                        onClick={() => setForm({ ...form, date: dateKey, time: '' })}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="appointment-request-modal__slots">
                <strong>Horarios</strong>
                {form.date ? (
                  <span>
                    {DAY_NAMES[parseDate(form.date).getDay()]} {pad(parseDate(form.date).getDate())}{' '}
                    de {MONTH_NAMES[parseDate(form.date).getMonth()]}
                  </span>
                ) : (
                  <span>Selecciona una fecha</span>
                )}
                {slots.length ? (
                  slots.map((slot) => (
                    <label key={slot} className={form.time === slot ? 'is-selected' : ''}>
                      <span>{slot}</span>
                      <input
                        type="radio"
                        name="slot"
                        checked={form.time === slot}
                        onChange={() => setForm({ ...form, time: slot })}
                      />
                    </label>
                  ))
                ) : (
                  <p>No hay horarios disponibles.</p>
                )}
              </div>
            </div>
          )}
          {/* Editing cannot change the reason: reschedule accepts only
              date/time/endTime. */}
          <Form.Group className={isEdit ? '' : 'mt-3'}>
            <Form.Label>{isEdit ? 'Motivo' : 'Motivo breve'}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.reason}
              readOnly={isEdit}
              placeholder={isEdit ? undefined : 'Motivo breve de la consulta...'}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="cases-modal__footer">
          <Button
            type="button"
            variant="secondary"
            className="cases-form__button cases-form__button--secondary appointment-cancel-button"
            onClick={onHide}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="cases-form__button cases-form__button--primary appointment-submit-button"
            disabled={loading}
          >
            {loading
              ? isEdit
                ? 'Guardando...'
                : user?.role === 'cliente'
                  ? 'Solicitando...'
                  : 'Agendando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Confirmar cita'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewAppointment;
