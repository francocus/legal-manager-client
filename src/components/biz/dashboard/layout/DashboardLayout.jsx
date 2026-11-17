import { useContext, useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router';
import { House, Scale } from 'lucide-react';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { usersApi } from '../../../services/api/usersApi';
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
  const { user, updateUserSession } = useContext(AuthenticationContext);
  const syncedUserIdRef = useRef(null);

  // The login response only carries the JWT claims, so contact data and
  // schedule may be stale. Refresh the profile once per session user so the
  // dashboard banners and profile stay in sync with the API.
  useEffect(() => {
    const userId = user?.id;
    if (!userId || syncedUserIdRef.current === userId) return undefined;

    syncedUserIdRef.current = userId;
    let active = true;

    const syncProfile = async () => {
      try {
        const fresh = await usersApi.getById(userId);
        if (!active || !fresh) return;

        const patch = {};

        ['name', 'dni', 'email', 'role', 'barNumber'].forEach((field) => {
          if (fresh[field] && fresh[field] !== user?.[field]) patch[field] = fresh[field];
        });

        if ((fresh.phone ?? '') !== (user?.phone ?? '')) patch.phone = fresh.phone ?? '';
        if ((fresh.address ?? '') !== (user?.address ?? '')) patch.address = fresh.address ?? '';
        if ((fresh.schedule ?? null) !== (user?.schedule ?? null)) {
          patch.schedule = fresh.schedule ?? null;
        }
        if (JSON.stringify(fresh.specialties ?? []) !== JSON.stringify(user?.specialties ?? [])) {
          patch.specialties = fresh.specialties ?? [];
        }

        if (Object.keys(patch).length > 0) updateUserSession?.(patch);
      } catch (_error) {
        // Keep the cached session if the API is unreachable.
      }
    };

    syncProfile();

    return () => {
      active = false;
    };
  }, [user, updateUserSession]);

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
