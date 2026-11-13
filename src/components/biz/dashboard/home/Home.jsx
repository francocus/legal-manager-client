import { useContext, useMemo } from 'react';
import { Link } from 'react-router';
import { CalendarDays, ClipboardList, FolderOpen, Users } from 'lucide-react';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usePreferences } from '../../../services/preferences/preferences.context';
import { ROLES } from '../../../services/consts/roles';
import { formatDate } from '../../../services/utils/format';
import './Home.css';

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
      .slice(0, 5);
  }, [appointments]);

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status.toLowerCase() === 'pendiente',
  ).length;

  const activeCases = cases.filter(
    (legalCase) => !['cerrado', 'archivado'].includes(legalCase.status.toLowerCase()),
  ).length;

  const quickActions = [
    { to: '/dashboard/calendar', label: 'Calendario', icon: CalendarDays },
    {
      to: '/dashboard/appointments',
      label: role === ROLES.CLIENTE ? 'Mis turnos' : 'Turnos',
      icon: ClipboardList,
    },
    {
      to: '/dashboard/cases',
      label: role === ROLES.CLIENTE ? 'Mis expedientes' : 'Expedientes',
      icon: FolderOpen,
    },
    ...(isStaff ? [{ to: '/dashboard/clients', label: 'Clientes', icon: Users }] : []),
  ];

  return (
    <section className="app-page">
      <header className="app-page__header">
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
          {role === ROLES.ABOGADO && !user?.schedule && (
            <div
              className="home-schedule-prompt"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '16px 20px',
                borderRadius: 16,
                background:
                  'radial-gradient(circle at top left, rgba(70, 130, 220, 0.16), transparent 70%), rgba(20, 30, 45, 0.85)',
                border: '1px solid rgba(120, 172, 214, 0.35)',
                marginBottom: 20,
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 4px', color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>
                  📅 Configurá tus días y horarios de atención
                </h4>
                <p style={{ margin: 0, color: '#c3d6e6', fontSize: '0.88rem' }}>
                  Definí en qué días y franjas horarias tus clientes podrán solicitar turnos con vos.
                </p>
              </div>
              <Link
                to="/dashboard/profile"
                className="app-button app-button--primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                Configurar horarios
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
            ) : null}
          </div>

          <div className="app-panel">
            <h3 className="app-panel__title">Accesos rápidos</h3>
            <div className="home-actions">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.to} to={action.to} className="home-action">
                    <Icon size={20} />
                    <span>{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="app-panel">
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
        </>
      )}
    </section>
  );
};

export default Home;
