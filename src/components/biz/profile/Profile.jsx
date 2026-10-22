import { useContext } from 'react';
import { Form } from 'react-bootstrap';
import { AuthenticationContext } from '../../services/auth/authentication.context';
import { usePreferences } from '../../services/preferences/preferences.context';
import { ThemeContext } from '../../services/theme/theme.context';
import { getRoleLabel } from '../users/User.data';
import './Profile.css';

const DATE_FORMAT_OPTIONS = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/AAAA' },
  { value: 'yyyy-mm-dd', label: 'AAAA-MM-DD' },
];

const Profile = () => {
  const { user } = useContext(AuthenticationContext);
  const { preferences, updatePreference } = usePreferences();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <section className="app-page">
      <header className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Mi cuenta</p>
          <h2 className="app-page__title">Perfil y preferencias</h2>
        </div>
      </header>

      <div className="app-panel">
        <h3 className="app-panel__title">Datos de la cuenta</h3>
        <dl className="app-detail-grid">
          <div>
            <dt>Nombre</dt>
            <dd>{user?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>DNI</dt>
            <dd>{user?.dni ?? '—'}</dd>
          </div>
          <div>
            <dt>Correo electrónico</dt>
            <dd>{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{getRoleLabel(user?.role)}</dd>
          </div>
        </dl>
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Preferencias</h3>
        <div className="profile-preferences">
          <Form.Group controlId="dateFormat">
            <Form.Label>Formato de fecha</Form.Label>
            <Form.Select
              value={preferences.dateFormat}
              onChange={(event) => updatePreference('dateFormat', event.target.value)}
            >
              {DATE_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="profile-theme">
            <span className="app-text">Tema actual: {theme === 'light' ? 'Claro' : 'Oscuro'}</span>
            <button type="button" className="app-button app-button--secondary" onClick={toggleTheme}>
              Cambiar tema
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
