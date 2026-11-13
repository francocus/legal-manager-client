import { useContext, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { Mail, UserRound } from 'lucide-react';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usersApi } from '../../../services/api/usersApi';
import { useToast } from '../../../shared/toast/toast.context';
import ConfirmDialog from '../../../shared/confirmDialog/ConfirmDialog';
import { SkeletonRows } from '../../../shared/skeleton/Skeleton';
import EmptyState from '../../../shared/emptyState/EmptyState';
import NewUser from '../../users/newUser/NewUser';
import UserDetails from '../../users/userDetails/UserDetails.jsx';
import UserItem from '../../users/userItem/UserItem';
import UsersSearch from '../../users/usersSearch/UsersSearch';
import { ROLES, isAdmin } from '../../../services/consts/roles';
import '../../users/users.css';
import '../clients.css';
import '../../trash/trash.css';

const ClientsContainer = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthenticationContext);
  const { clients, loading, error, refreshClients, refreshUsers } = useDashboardData();
  const { showToast } = useToast();

  const [searchClient, setSearchClient] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  const userIsAdmin = isAdmin(currentUser?.role);

  const handleOpenNewClient = () => {
    setClientToEdit(null);
    setClientToDelete(null);
    setShowNewClient(true);
  };

  const handleCloseForms = () => {
    setShowNewClient(false);
    setClientToEdit(null);
    setClientToDelete(null);
  };

  const handleAddClient = async (form) => {
    await usersApi.create({ ...form, role: ROLES.CLIENTE });
    // GET /user is admins-only and this view is reachable by every role, so
    // only the admin can afford the users refresh (lawyers would 403).
    await refreshClients();
    if (userIsAdmin) {
      await refreshUsers();
    }
  };

  const handleEditClient = async (form) => {
    await usersApi.updateWithRoleFields(form.id, { ...form, role: ROLES.CLIENTE }, clientToEdit);
    await refreshClients();
    if (userIsAdmin) {
      await refreshUsers();
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await usersApi.remove(id);
      await refreshClients();
      if (userIsAdmin) {
        await refreshUsers();
      }
      setClientToDelete(null);
      showToast({ variant: 'success', message: 'Cliente eliminado correctamente.' });
    } catch (deleteError) {
      showToast({
        variant: 'danger',
        message: deleteError.message || 'No se pudo eliminar el cliente.',
      });
      throw deleteError;
    }
  };

  const lowerSearch = searchClient.toLowerCase();
  const filteredClients = clients.filter(
    (client) =>
      (client.name && client.name.toLowerCase().includes(lowerSearch)) ||
      (client.email && client.email.toLowerCase().includes(lowerSearch)) ||
      (client.dni && String(client.dni).toLowerCase().includes(lowerSearch)),
  );

  return (
    <section className="clients-panel">
      <header className="clients-header">
        <div>
          <p className="app-page__eyebrow">Clientes</p>
          <h2>{userIsAdmin ? 'Gestión de clientes' : 'Mis clientes'}</h2>
        </div>

        <div className="clients-header__controls">
          <div className="users-search-wrap">
            <UsersSearch
              onSearch={setSearchClient}
              placeholder="Buscar cliente..."
              ariaLabel="Buscar cliente"
            />
          </div>
          {userIsAdmin ? (
            <button
              type="button"
              className="trash-entry-button"
              title="Papelera"
              aria-label="Papelera"
              onClick={() => navigate('/dashboard/clients/papelera')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 3.75h6l1 1.5H20v1.5H4v-1.5h4l1-1.5Zm1.5 5.25h1.5v7.5h-1.5v-7.5Zm4.5 0h1.5v7.5H15v-7.5Zm-8.25 0h1.5v7.5h-1.5v-7.5Zm1.5 11.25h9A1.75 1.75 0 0 0 19 18v-8.25H5V18c0 .97.78 1.75 1.75 1.75Z" />
              </svg>
            </button>
          ) : null}
          {userIsAdmin ? (
            <Button
              type="button"
              className="clients-create"
              title="Crear cliente"
              aria-label="Crear cliente"
              onClick={handleOpenNewClient}
            >
              <span className="clients-create__text">Crear cliente</span>
            </Button>
          ) : null}
        </div>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {userIsAdmin && showNewClient ? (
        <NewUser
          onAddUser={handleAddClient}
          onFormClosed={handleCloseForms}
          fixedRole={ROLES.CLIENTE}
          entityLabel="cliente"
        />
      ) : null}

      {userIsAdmin && clientToEdit ? (
        <UserDetails
          user={clientToEdit}
          onEditUser={handleEditClient}
          onFormClosed={handleCloseForms}
          fixedRole={ROLES.CLIENTE}
          entityLabel="cliente"
        />
      ) : null}

      <ConfirmDialog
        show={Boolean(clientToDelete)}
        onHide={() => setClientToDelete(null)}
        onConfirm={() => handleDeleteClient(clientToDelete?.id)}
        title="Dar de baja"
        message="El registro queda desactivado y no se elimina físicamente. ¿Estás seguro que deseas dar de baja al cliente"
        itemName={clientToDelete?.name}
        confirmLabel="Sí, dar de baja"
      />

      {loading ? (
        <SkeletonRows rows={5} />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          title="No se encontraron clientes"
          message="Probá con otro término de búsqueda."
        />
      ) : userIsAdmin ? (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Cliente / DNI</th>
                <th>Rol</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th className="users-table__actions-head">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <UserItem
                  key={client.id}
                  id={client.id}
                  name={client.name}
                  dni={client.dni}
                  email={client.email}
                  role={client.role}
                  active={client.active}
                  onSelect={() => navigate(`/dashboard/clients/${client.id}`)}
                  onEdit={(selectedClient) => {
                    setShowNewClient(false);
                    setClientToDelete(null);
                    setClientToEdit(selectedClient);
                  }}
                  onDelete={(id) => {
                    const selectedClient = filteredClients.find((entry) => entry.id === id);
                    if (selectedClient) {
                      setShowNewClient(false);
                      setClientToEdit(null);
                      setClientToDelete(selectedClient);
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="app-grid-cards">
          {filteredClients.map((client) => (
            <Link key={client.id} to={`/dashboard/clients/${client.id}`} className="client-card">
              <span className="client-card__avatar">
                <UserRound size={22} />
              </span>
              <span className="client-card__name">{client.name}</span>
              <span className="client-card__meta">DNI {client.dni}</span>
              <span className="client-card__meta">
                <Mail size={14} /> {client.email}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default ClientsContainer;
