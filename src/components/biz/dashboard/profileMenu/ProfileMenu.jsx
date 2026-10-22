import { useContext } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { LogOut, UserRound } from 'lucide-react';
import { AuthenticationContext } from '../../../services/auth/authentication.context';

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user, handleUserLogout } = useContext(AuthenticationContext);

  const handleLogout = () => {
    handleUserLogout();
    navigate('/login');
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        as="button"
        type="button"
        className="app-icon-button dashboard-profile-toggle"
        aria-label="Menú de usuario"
        title={user?.name ?? 'Mi cuenta'}
      >
        <UserRound size={20} />
      </Dropdown.Toggle>
      <Dropdown.Menu className="dashboard-profile-menu">
        <div className="dashboard-profile-menu__header">
          <strong>{user?.name ?? 'Mi cuenta'}</strong>
          <span>{user?.email ?? ''}</span>
        </div>
        <Dropdown.Divider />
        <Dropdown.Item
          onClick={() => navigate('/dashboard/profile')}
          className="dashboard-profile-menu__item"
        >
          <UserRound size={16} />
          <span>Perfil</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={handleLogout} className="dashboard-profile-menu__item">
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ProfileMenu;
