import { addDays, getDateKey, getMonday, isSameDate } from '../Calendar.data';
import { getAppointmentAccent } from '../../appointments/Appointments.data';
import { WEEK_DAY_NAMES } from '../../../services/consts/calendarConsts';

const MonthView = ({
  cursorDate,
  selectedDate,
  today,
  appointmentsByDate,
  onDateChange,
  onSelectAppointment,
}) => {
  const monthStart = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const lastDay = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 0);
  const gridStart = getMonday(monthStart);
  const gridEnd = addDays(getMonday(lastDay), 6);
  const totalDays = Math.round((gridEnd - gridStart) / 86400000) + 1;
  const monthDays = Array.from({ length: totalDays }, (_, i) => addDays(gridStart, i));

  return (
    <div className="appointments-month-view">
      <div className="appointments-month-view__header">
        {WEEK_DAY_NAMES.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="appointments-month-view__grid">
        {monthDays.map((date) => {
          const dateKey = getDateKey(date);
          const dayAppointments = appointmentsByDate[dateKey] ?? [];
          return (
            <div
              key={dateKey}
              className={`appointments-month-cell ${isSameDate(date, selectedDate) ? 'is-selected' : ''} ${isSameDate(date, today) ? 'is-today' : ''} ${date.getMonth() !== cursorDate.getMonth() ? 'is-outside-month' : ''}`}
              onClick={() => onDateChange(date)}
            >
              <button
                type="button"
                className="appointments-month-cell__date"
                onClick={(event) => {
                  event.stopPropagation();
                  onDateChange(date);
                }}
                aria-label={`Seleccionar el día ${dateKey}`}
              >
                {date.getDate()}
              </button>
              <span
                className={`appointments-month-cell__events ${dayAppointments.length >= 3 ? 'has-scroll' : ''}`}
              >
                {dayAppointments.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`appointments-month-event ${getAppointmentAccent(a)}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectAppointment(a);
                    }}
                  >
                    {a.time} {a.clientName}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
