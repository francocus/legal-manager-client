import { useContext, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usersApi } from '../../../services/api/usersApi';
import { useToast } from '../../../shared/toast/toast.context';
import ConfirmDialog from '../../../shared/confirmDialog/ConfirmDialog';
import { SkeletonRows } from '../../../shared/skeleton/Skeleton';
import EmptyState from '../../../shared/emptyState/EmptyState';
import NewUser from '../newUser/NewUser';
import UserDetails from '../userDetails/UserDetails.jsx';
import UserItem from '../userItem/UserItem';
import UsersSearch from '../usersSearch/UsersSearch';
import { ROLES } from '../../../services/consts/roles';
import '../users.css';
import '../../trash/trash.css';

const STAFF_ROLES = [ROLES.ADMIN, ROLES.ABOGADO];

// Self-registered clients are promoted to lawyer from this view (backend
// /user/{id}/role), so they stay listed and filterable alongside the staff.
const USER_ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: 'Administrador' },
  { value: ROLES.ABOGADO, label: 'Abogado' },
  { value: ROLES.CLIENTE, label: 'Cliente' },
];

const UsersContainer = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthenticationContext);
  const { users, loading, error, refreshUsers, refreshLawyers, refreshClients } =
    useDashboardData();
  const { showToast } = useToast();

  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showNewUser, setShowNewUser] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleOpenNewUser = () => {
    setUserToEdit(null);
    setUserToDelete(null);
    setShowNewUser(true);
  };

  const handleCloseForms = () => {
    setShowNewUser(false);
    setUserToEdit(null);
    setUserToDelete(null);
  };

  const handleAddUser = async (form) => {
    await usersApi.create(form);
    // User mutations also feed the lawyer/client selects in NewCase and
    // NewAppointment: refresh both resolver lists alongside the table (this
    // page is admin-only, so both calls are allowed for the session role).
    await refreshUsers();
    await refreshLawyers();
    await refreshClients();
  };

  const handleEditUser = async (form) => {
    await usersApi.updateWithRoleFields(form.id, form, userToEdit);
    await refreshUsers();
    await refreshLawyers();
    await refreshClients();
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser?.id) {
      showToast({ variant: 'warning', message: 'No podés dar de baja tu propia cuenta.' });
      return;
    }

    try {
      await usersApi.remove(id);
      await refreshUsers();
      await refreshLawyers();
      await refreshClients();
      setUserToDelete(null);
      showToast({ variant: 'success', message: 'Usuario eliminado correctamente.' });
    } catch (deleteError) {
      showToast({
        variant: 'danger',
        message: deleteError.message || 'No se pudo eliminar el usuario.',
      });
      throw deleteError;
    }
  };

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    const lowerSearch = searchUser.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(lowerSearch)) ||
      (user.email && user.email.toLowerCase().includes(lowerSearch)) ||
      (user.dni && String(user.dni).toLowerCase().includes(lowerSearch))
    );
  });

  return (
    <section className="users-panel">
      <header className="users-header">
        <div className="users-header__copy">
          <p>Gestión de usuarios</p>
          <h2>Gestión de usuarios</h2>
        </div>

        <div className="users-header__controls">
          <select
            className="users-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="all">Todos los roles</option>
            {USER_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="users-search-wrap">
            <UsersSearch onSearch={setSearchUser} />
          </div>

          <button
            type="button"
            className="trash-entry-button"
            title="Papelera"
            aria-label="Papelera"
            onClick={() => navigate('/dashboard/papelera')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 3.75h6l1 1.5H20v1.5H4v-1.5h4l1-1.5Zm1.5 5.25h1.5v7.5h-1.5v-7.5Zm4.5 0h1.5v7.5H15v-7.5Zm-8.25 0h1.5v7.5h-1.5v-7.5Zm1.5 11.25h9A1.75 1.75 0 0 0 19 18v-8.25H5V18c0 .97.78 1.75 1.75 1.75Z" />
            </svg>
          </button>

          <Button
            type="button"
            className="users-create"
            title="Crear usuario"
            aria-label="Crear usuario"
            onClick={handleOpenNewUser}
          >
            <span className="users-create__text">Crear usuario</span>
          </Button>
        </div>
      </header>

      {error && (
        <Alert className="users-alert" variant="danger">
          {error}
        </Alert>
      )}

      {showNewUser && (
        <NewUser
          onAddUser={handleAddUser}
          onFormClosed={handleCloseForms}
          allowedRoles={STAFF_ROLES}
        />
      )}

      {userToEdit && (
        <UserDetails
          user={userToEdit}
          onEditUser={handleEditUser}
          onFormClosed={handleCloseForms}
        />
      )}

      <ConfirmDialog
        show={Boolean(userToDelete)}
        onHide={() => setUserToDelete(null)}
        onConfirm={() => handleDeleteUser(userToDelete?.id)}
        title="Dar de baja"
        message="El registro queda desactivado y no se elimina físicamente. ¿Estás seguro que deseas dar de baja al usuario"
        itemName={userToDelete?.name}
        confirmLabel="Sí, dar de baja"
      />

      {loading ? (
        <SkeletonRows rows={5} />
      ) : filteredUsers.length > 0 ? (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario / DNI</th>
                <th>Rol</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th className="users-table__actions-head">Acciones Admin</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userEntry) => (
                <UserItem
                  key={userEntry.id}
                  id={userEntry.id}
                  name={userEntry.name}
                  dni={userEntry.dni}
                  email={userEntry.email}
                  role={userEntry.role}
                  active={userEntry.active}
                  isCurrentUser={userEntry.id === currentUser?.id}
                  onEdit={(selectedUser) => {
                    setShowNewUser(false);
                    setUserToDelete(null);
                    setUserToEdit(selectedUser);
                  }}
                  onDelete={(id) => {
                    const selectedUser = filteredUsers.find((entry) => entry.id === id);
                    if (selectedUser) {
                      setShowNewUser(false);
                      setUserToEdit(null);
                      setUserToDelete(selectedUser);
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No se encontraron usuarios"
          message="Probá con otro término de búsqueda o cambiá el filtro de rol."
        />
      )}
    </section>
  );
};

export default UsersContainer;
