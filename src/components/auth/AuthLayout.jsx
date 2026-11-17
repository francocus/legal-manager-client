import { Outlet } from 'react-router';
import { Scale } from 'lucide-react';
import ToggleTheme from '../shared/toggleTheme/ToggleTheme.jsx';
import './auth.css';

const AuthLayout = () => (
  <main className="auth-page">
    <div className="auth-theme-toggle">
      <ToggleTheme />
    </div>
    <div className="auth-grid">
      <aside className="auth-aside">
        <div className="auth-brand">
          <span className="auth-mark">
            <Scale size={48} />
          </span>
          <strong>LEGAL MANAGER</strong>
        </div>
      </aside>

      <section className="auth-panel">
        <Outlet />
      </section>
    </div>
  </main>
);

export default AuthLayout;
