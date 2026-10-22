import { useContext, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { Mail, UserRound } from 'lucide-react';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usersApi } from '../../../services/api/usersApi';
import { useToast } from '../../../shared/toast/toast.context';
import { usePagination } from '../../../services/hooks/usePagination';
import ConfirmDialog from '../../../shared/confirmDialog/ConfirmDialog';
import { SkeletonRows } from '../../../shared/skeleton/Skeleton';
import EmptyState from '../../../shared/emptyState/EmptyState';
import Pagination from '../../../shared/pagination/Pagination';
import NewUser from '../../users/newUser/NewUser';
import UserDetails from '../../users/userDetails/UserDetails.jsx';
import UserItem from '../../users/userItem/UserItem';
import UsersSearch from '../../users/usersSearch/UsersSearch';
import { ROLES } from '../../../services/consts/roles';
import '../../users/users.css';
import '../clients.css';

const PAGE_SIZE = 10;

const ClientsContainer = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthenticationContext);
  const { clients, loading, error, refreshClients } = useDashboardData();
  const { showToast } = useToast();

  const [searchClient, setSearchClient] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  const isAdmin = currentUser?.role === ROLES.SYSADMIN;

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
    await refreshClients();
  };

  const handleEditClient = async (form) => {
    await usersApi.update(form.id, { ...form, role: ROLES.CLIENTE });
    await refreshClients();
  };

  const handleDeleteClient = async (id) => {
    try {
      await usersApi.remove(id);
      await refreshClients();
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

  const { page, setPage, totalPages, pageItems } = usePagination(filteredClients, PAGE_SIZE);

  return (
    <section className="clients-panel">
      <header className="clients-header">
        <div>
          <p className="app-page__eyebrow">Clientes</p>
          <h2>{isAdmin ? 'Gestión de clientes' : 'Mis clientes'}</h2>
        </div>

        <div className="clients-header__controls">
          <div className="users-search-wrap">
            <UsersSearch onSearch={setSearchClient} />
          </div>
          {isAdmin ? (
            <Button type="button" className="app-button app-button--primary" onClick={handleOpenNewClient}>
              Crear cliente
            </Button>
          ) : null}
        </div>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {isAdmin && showNewClient ? (
        <NewUser
          onAddUser={handleAddClient}
          onFormClosed={handleCloseForms}
          fixedRole={ROLES.CLIENTE}
          entityLabel="cliente"
        />
      ) : null}

      {isAdmin && clientToEdit ? (
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
        title="Eliminar cliente"
        message="¿Estás seguro que deseas eliminar al cliente"
        itemName={clientToDelete?.name}
        confirmLabel="Sí, deseo eliminarlo"
      />

      {loading ? (
        <SkeletonRows rows={5} />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          title="No se encontraron clientes"
          message="Probá con otro término de búsqueda."
        />
      ) : isAdmin ? (
        <>
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
                {pageItems.map((client) => (
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
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <>
          <div className="app-grid-cards">
            {pageItems.map((client) => (
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
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
};

export default ClientsContainer;
