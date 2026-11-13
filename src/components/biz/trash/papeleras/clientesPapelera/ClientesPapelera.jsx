import { useNavigate } from 'react-router';
import { Alert } from 'react-bootstrap';
import { ROLES } from '../../../../services/consts/roles';
import { useTrash } from '../shared/useTrash';
import { getDaysMeta } from '../shared/trash.helpers';
import TrashActions from '../shared/TrashActions';
import { SkeletonRows } from '../../../../shared/skeleton/Skeleton';
import EmptyState from '../../../../shared/emptyState/EmptyState';
import '../../../users/users.css';
import '../../../clients/clients.css';
import '../../trash.css';

// Admin papelera for clientes: mirrors the ClientsContainer header and table
// chrome (it reuses the users-table family) while listing only trashed users
// whose role resolves to 'cliente'.
const ClientesPapelera = () => {
  const navigate = useNavigate();
  const { trash, loading, error, restore } = useTrash();
  const clients = trash.users.filter((entry) => entry.user?.role === ROLES.CLIENTE);

  return (
    <section className="clients-panel">
      <header className="clients-header">
        <div className="clients-header__copy">
          <p className="app-page__eyebrow">Papelera de clientes</p>
          <h2>Papelera de clientes</h2>
        </div>

        <div className="clients-header__controls">
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate('/dashboard/clients')}
          >
            Volver
          </button>
        </div>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? null : clients.length === 0 ? (
        <EmptyState
          title="La papelera está vacía."
          message="No hay elementos eliminados por ahora."
        />
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>DNI</th>
                <th>Contacto</th>
                <th>En la papelera</th>
                <th className="users-table__actions-head">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((entry) => (
                <tr key={entry.user.id}>
                  <td className="user-cell user-cell--main">
                    <div className="user-main">
                      <span className="user-main__name">{entry.user.name}</span>
                    </div>
                  </td>
                  <td className="user-cell user-cell--muted">{entry.user.dni}</td>
                  <td className="user-cell user-cell--muted">{entry.user.email}</td>
                  <td className="user-cell user-cell--muted">
                    <span className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</span>
                  </td>
                  <td className="user-cell user-cell--actions">
                    <TrashActions onRestore={() => restore('user', entry.user.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ClientesPapelera;
