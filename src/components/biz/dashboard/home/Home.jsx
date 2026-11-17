import { useContext, useMemo } from 'react';
import { Link } from 'react-router';
import { FolderOpen } from 'lucide-react';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usePreferences } from '../../../services/preferences/preferences.context';
import { ROLES } from '../../../services/consts/roles';
import { getProfileMissingFields, isProfileComplete } from '../../../services/consts/profile';
import { formatDate, formatDateTime } from '../../../services/utils/format';
import { getStatusClass, getStatusLabel } from '../../cases/Cases.data';
import './Home.css';

const PROFILE_FIELD_LABELS = {
  phone: 'teléfono',
  address: 'dirección',
  schedule: 'horarios de atención',
};

const Home = () => {
  const { user } = useContext(AuthenticationContext);
  const { cases, appointments, clients, loading } = useDashboardData();
  const { preferences } = usePreferences();

  const role = user?.role;
  const isStaff = role === ROLES.ADMIN || role === ROLES.ABOGADO;

  const upcomingAppointments = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return appointments
      .filter(
        (appointment) =>
          appointment.date >= todayKey && appointment.status.toLowerCase() !== 'cancelado',
      )
      .slice(0, 4);
  }, [appointments]);

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status.toLowerCase() === 'pendiente',
  ).length;

  const activeCases = cases.filter(
    (legalCase) => !['cerrado', 'archivado'].includes(legalCase.status.toLowerCase()),
  ).length;

  // Last 3 cases sorted by lastUpdate descending
  const recentCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => {
        const da = a.lastUpdate ? new Date(a.lastUpdate) : new Date(0);
        const db = b.lastUpdate ? new Date(b.lastUpdate) : new Date(0);
        return db - da;
      })
      .slice(0, 3);
  }, [cases]);

  const profileIsComplete = isProfileComplete(user);
  const missingProfileFields = getProfileMissingFields(user);
  const missingProfileLabels = missingProfileFields
    .map((field) => PROFILE_FIELD_LABELS[field])
    .filter(Boolean);

  return (
    <section className="app-page home-view">
      <header className="app-page__header home-view__header">
        <div>
          <p className="app-page__eyebrow">Inicio</p>
          <h2 className="app-page__title">Hola, {user?.name ?? 'bienvenido'}</h2>
          <p className="app-page__subtitle">
            {isStaff
              ? 'Resumen rápido de la actividad del estudio.'
              : 'Resumen rápido de tu actividad.'}
          </p>
        </div>
      </header>

      {loading ? (
        <p className="app-page__subtitle">Cargando...</p>
      ) : (
        <>
          {/* One compact notice for any role with an incomplete profile. */}
          {!profileIsComplete && (
            <div className="home-profile-prompt" role="status">
              <span className="home-profile-prompt__text">
                Completá tu perfil: falta {missingProfileLabels.join(' y ')}.
              </span>
              <Link to="/dashboard/profile" className="app-button app-button--primary">
                Completar perfil
              </Link>
            </div>
          )}

          <div className="home-stats">
            <div className="app-panel home-stat">
              <span>Próximos turnos</span>
              <strong>{upcomingAppointments.length}</strong>
            </div>
            <div className="app-panel home-stat">
              <span>Turnos pendientes</span>
              <strong>{pendingAppointments}</strong>
            </div>
            <div className="app-panel home-stat">
              <span>Expedientes activos</span>
              <strong>{activeCases}</strong>
            </div>
            {isStaff ? (
              <div className="app-panel home-stat">
                <span>Clientes</span>
                <strong>{clients.length}</strong>
              </div>
            ) : (
              <div className="app-panel home-stat home-stat--status">
                <span>Estado del perfil</span>
                <strong>{profileIsComplete ? 'Completo' : 'Completar perfil'}</strong>
              </div>
            )}
          </div>

          <div className="home-panels">
            {/* Últimos expedientes consultados (replaces Accesos rápidos) */}
            <div className="app-panel home-panel">
              <div className="home-panel-head">
                <h3 className="app-panel__title">Últimos expedientes consultados</h3>
                <Link to="/dashboard/cases">Ver todos</Link>
              </div>
              {recentCases.length > 0 ? (
                <div className="home-recent-cases">
                  {recentCases.map((legalCase) => (
                    <Link
                      key={legalCase.id}
                      to={`/dashboard/cases/${legalCase.id}`}
                      className="home-recent-case"
                    >
                      <div className="home-recent-case__header">
                        <span className="home-recent-case__number">
                          <FolderOpen size={14} />
                          {legalCase.caseNumber}
                        </span>
                        <span
                          className={`home-recent-case__status ${getStatusClass(legalCase.status)}`}
                        >
                          {getStatusLabel(legalCase.status)}
                        </span>
                      </div>
                      <p className="home-recent-case__title">{legalCase.title}</p>
                      {legalCase.area ? (
                        <span className="home-recent-case__area">{legalCase.area}</span>
                      ) : null}
                      <span className="home-recent-case__update">
                        Actualizado: {formatDateTime(legalCase.lastUpdate, preferences.dateFormat)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="home-empty">
                  <p className="app-page__subtitle">
                    Todavía no hay expedientes registrados. Cuando se cargue el primero, va a aparecer acá.
                  </p>
                  <Link to="/dashboard/cases" className="app-button app-button--secondary">
                    Gestionar expedientes
                  </Link>
                </div>
              )}
            </div>

            <div className="app-panel home-panel">
              <div className="home-panel-head">
                <h3 className="app-panel__title">Próximos turnos</h3>
                <Link to="/dashboard/appointments">Ver todos</Link>
              </div>
              {upcomingAppointments.length > 0 ? (
                <ul className="home-list">
                  {upcomingAppointments.map((appointment) => (
                    <li key={appointment.id}>
                      <Link to={`/dashboard/appointments/${appointment.id}`}>
                        <span className="home-list__date">
                          {formatDate(appointment.date, preferences.dateFormat)} · {appointment.time}
                        </span>
                        <span className="home-list__main">
                          {appointment.clientName} con {appointment.lawyerName}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="app-page__subtitle">No hay turnos próximos.</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Home;
