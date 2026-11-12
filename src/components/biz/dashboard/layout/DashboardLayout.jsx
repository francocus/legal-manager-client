import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router';
import { House, Scale } from 'lucide-react';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import ToggleTheme from '../../../shared/toggleTheme/ToggleTheme.jsx';
import DashboardNav from '../dashboardNav/DashboardNav';
import ProfileMenu from '../profileMenu/ProfileMenu';
import { ROLES } from '../../../services/consts/roles';
import './DashboardLayout.css';

const EYEBROWS = {
  [ROLES.ADMIN]: 'Panel de Administración',
  [ROLES.ABOGADO]: 'Panel del estudio',
  [ROLES.CLIENTE]: 'Mi panel',
};

const DashboardLayout = () => {
  const { user } = useContext(AuthenticationContext);

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <span className="dashboard-brand__mark">
              <Scale size={20} />
            </span>
            <div>
              <p className="dashboard-eyebrow">{EYEBROWS[user?.role] ?? 'Mi panel'}</p>
              <h1>Legal Manager</h1>
              {user?.name && <span className="dashboard-user">{user.name}</span>}
            </div>
          </div>

          <div className="dashboard-actions">
            <NavLink
              to="/dashboard/home"
              className={({ isActive }) =>
                `app-icon-button dashboard-home${isActive ? ' is-active' : ''}`
              }
              aria-label="Inicio"
              title="Inicio"
            >
              <House size={20} />
            </NavLink>
            <DashboardNav role={user?.role} />
            <ToggleTheme />
            <ProfileMenu />
          </div>
        </header>

        <Outlet />
      </section>
    </main>
  );
};

export default DashboardLayout;
