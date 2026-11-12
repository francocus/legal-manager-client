import { useNavigate } from 'react-router';
import { Alert } from 'react-bootstrap';
import { useTrash } from '../shared/useTrash';
import { getDaysMeta } from '../shared/trash.helpers';
import TrashActions from '../shared/TrashActions';
import ConfirmDialog from '../../../../shared/confirmDialog/ConfirmDialog';
import { SkeletonRows } from '../../../../shared/skeleton/Skeleton';
import EmptyState from '../../../../shared/emptyState/EmptyState';
import { getRoleClass, getRoleLabel } from '../../../users/User.data';
import '../../../users/users.css';
import '../../trash.css';

// Admin papelera for usuarios: mirrors the UsersContainer header and table
// chrome while listing every trashed user with its role chip.
const UsuariosPapelera = () => {
  const navigate = useNavigate();
  const { trash, loading, error, restore, itemToDelete, setItemToDelete, confirmDelete } =
    useTrash();
  const users = trash.users;

  return (
    <section className="users-panel">
      <header className="users-header">
        <div className="users-header__copy">
          <p>Papelera de usuarios</p>
          <h2>Papelera de usuarios</h2>
        </div>

        <div className="users-header__controls">
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate('/dashboard/users')}
          >
            Volver
          </button>
        </div>
      </header>

      {error ? (
        <Alert className="users-alert" variant="danger">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? null : users.length === 0 ? (
        <EmptyState
          title="La papelera está vacía."
          message="No hay elementos eliminados por ahora."
        />
      ) : (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Contacto</th>
                <th>En la papelera</th>
                <th className="users-table__actions-head">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry.user.id}>
                  <td className="user-cell user-cell--main">
                    <div className="user-main">
                      <span className="user-main__name">{entry.user.name}</span>
                    </div>
                  </td>
                  <td className="user-cell">
                    <span className={`user-chip user-chip--role ${getRoleClass(entry.user.role)}`}>
                      {getRoleLabel(entry.user.role)}
                    </span>
                  </td>
                  <td className="user-cell user-cell--muted">{entry.user.email}</td>
                  <td className="user-cell user-cell--muted">
                    <span className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</span>
                  </td>
                  <td className="user-cell user-cell--actions">
                    <TrashActions
                      onRestore={() => restore('user', entry.user.id)}
                      onDelete={() =>
                        setItemToDelete({
                          kind: 'user',
                          id: entry.user.id,
                          label: entry.user.name,
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ConfirmDialog always appends the item name plus a question mark, so
          the required irreversible statement is followed by the confirmation
          question ending on the bolded item label. */}
      <ConfirmDialog
        show={Boolean(itemToDelete)}
        onHide={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Borrar definitivamente"
        message="Esta acción es irreversible: el registro y sus archivos se eliminan para siempre. ¿Estás seguro que deseas borrar definitivamente"
        itemName={itemToDelete?.label}
        confirmLabel="Sí, borrar para siempre"
      />
    </section>
  );
};

export default UsuariosPapelera;
