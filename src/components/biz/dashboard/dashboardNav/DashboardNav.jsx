import { NavLink } from 'react-router';
import { ROLES } from '../../../services/consts/roles';

const NAV_ITEMS = {
  [ROLES.SYSADMIN]: [
    { to: '/dashboard/calendar', label: 'Calendario' },
    { to: '/dashboard/appointments', label: 'Turnos' },
    { to: '/dashboard/cases', label: 'Expedientes' },
    { to: '/dashboard/clients', label: 'Clientes' },
    { to: '/dashboard/users', label: 'Usuarios' },
  ],
  [ROLES.ABOGADO]: [
    { to: '/dashboard/calendar', label: 'Calendario' },
    { to: '/dashboard/appointments', label: 'Turnos' },
    { to: '/dashboard/cases', label: 'Expedientes' },
    { to: '/dashboard/clients', label: 'Clientes' },
  ],
  [ROLES.CLIENTE]: [
    { to: '/dashboard/calendar', label: 'Calendario' },
    { to: '/dashboard/appointments', label: 'Mis Turnos' },
    { to: '/dashboard/cases', label: 'Mis Expedientes' },
  ],
};

const DashboardNav = ({ role }) => {
  const items = NAV_ITEMS[role] ?? NAV_ITEMS[ROLES.CLIENTE];

  return (
    <nav className="dashboard-nav" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `dashboard-nav__link${isActive ? ' is-active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default DashboardNav;
