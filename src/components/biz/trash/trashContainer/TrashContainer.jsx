import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { trashApi } from '../../../services/api/trashApi';
import { useToast } from '../../../shared/toast/toast.context';
import ConfirmDialog from '../../../shared/confirmDialog/ConfirmDialog';
import { SkeletonRows } from '../../../shared/skeleton/Skeleton';
import EmptyState from '../../../shared/emptyState/EmptyState';
import { formatDate } from '../../../services/utils/format';
import { getStatusClass } from '../../appointments/Appointments.data';
import { formatFileSize, getTypeLabel } from '../../documents/Documents.data';
import '../trash.css';

const DAY_MS = 86400000;

// deactivatedAt is 'yyyy-mm-dd' or null for legacy rows; null (or anything
// the browser cannot parse) falls back to the placeholder dash.
const daysInTrash = (deactivatedAt) => {
  if (!deactivatedAt) {
    return null;
  }
  const deactivated = new Date(deactivatedAt);
  if (Number.isNaN(deactivated.getTime())) {
    return null;
  }
  return Math.floor((Date.now() - deactivated.getTime()) / DAY_MS);
};

const getDaysMeta = (deactivatedAt) => {
  const days = daysInTrash(deactivatedAt);
  if (days === null) {
    return '—';
  }
  if (days <= 0) {
    return 'En la papelera desde hoy';
  }
  return `En la papelera hace ${days} ${days === 1 ? 'día' : 'días'}`;
};

// caseNumber/caseTitle are null when the parent case is inactive; the dash
// between number and title is skipped when the title is missing.
const getDocumentCaseLabel = (entry = {}) => {
  if (!entry.caseNumber) {
    return '—';
  }
  return entry.caseTitle ? `${entry.caseNumber} - ${entry.caseTitle}` : entry.caseNumber;
};

const TrashActions = ({ onRestore, onDelete, deleteDisabled = false, deleteTitle }) => (
  <div className="trash-row-actions">
    <button type="button" className="trash-row-button trash-row-button--secondary" onClick={onRestore}>
      Restaurar
    </button>
    <button
      type="button"
      className="trash-row-button trash-row-button--danger"
      onClick={onDelete}
      disabled={deleteDisabled}
      title={deleteTitle}
    >
      Borrar definitivamente
    </button>
  </div>
);

const TrashContainer = () => {
  const { showToast } = useToast();
  const [trash, setTrash] = useState({ cases: [], appointments: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // fetchTrash starts with an await, so the effect body never calls setState
  // synchronously (loading already starts true); refetches go through
  // loadTrash, which shows the skeletons again while it runs.
  const fetchTrash = useCallback(async () => {
    try {
      const data = await trashApi.getTrash();
      setTrash(data);
      setError(null);
    } catch (loadError) {
      // The /trash endpoints may not be deployed yet: keep the page standing
      // with a clear inline error instead of an empty-looking papelera.
      setTrash({ cases: [], appointments: [], documents: [] });
      setError(loadError.message || 'No se pudo cargar la papelera.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      // Yield to a callback frame so every setState in this fetch is async
      // (same pattern as DashboardDataProvider).
      await Promise.resolve();
      if (!active) return;
      await fetchTrash();
    })();

    return () => {
      active = false;
    };
  }, [fetchTrash]);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    await fetchTrash();
  }, [fetchTrash]);

  // Restore needs no confirmation: it is the reversible action here.
  const handleRestore = async (type, id) => {
    try {
      if (type === 'case') await trashApi.restoreCase(id);
      if (type === 'appointment') await trashApi.restoreAppointment(id);
      if (type === 'document') await trashApi.restoreDocument(id);
      showToast({ variant: 'success', message: 'Restaurado correctamente.' });
      await loadTrash();
    } catch (restoreError) {
      showToast({
        variant: 'danger',
        message: restoreError.message || 'No se pudo restaurar el registro.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    const { type, id } = itemToDelete ?? {};
    try {
      if (type === 'case') await trashApi.hardDeleteCase(id);
      if (type === 'appointment') await trashApi.hardDeleteAppointment(id);
      if (type === 'document') await trashApi.hardDeleteDocument(id);
      setItemToDelete(null);
      showToast({ variant: 'success', message: 'Eliminado definitivamente.' });
      await loadTrash();
    } catch (deleteError) {
      showToast({
        variant: 'danger',
        message: deleteError.message || 'No se pudo eliminar el registro.',
      });
      throw deleteError;
    }
  };

  const emptyState = (
    <EmptyState
      title="La papelera está vacía."
      message="No hay elementos eliminados por ahora."
    />
  );

  return (
    <section className="trash-panel">
      <header className="trash-header">
        <div className="trash-header__copy">
          <p className="app-page__eyebrow">Papelera</p>
          <h2>Papelera</h2>
        </div>
      </header>

      {error ? (
        <Alert className="users-alert" variant="danger">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? null : (
        <div className="trash-sections">
          <section className="trash-section">
            <h3 className="trash-section__title">Expedientes</h3>
            {trash.cases.length === 0 ? (
              emptyState
            ) : (
              <div className="trash-table-wrap">
                <table className="trash-table">
                  <thead>
                    <tr>
                      <th>Expediente / Título</th>
                      <th>En la papelera</th>
                      <th className="trash-table__cell--actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trash.cases.map((entry) => {
                      const linkedChildren = entry.totalAppointments + entry.totalDocuments;
                      return (
                        <tr key={entry.id}>
                          <td>
                            <div className="trash-main">
                              <span className="trash-main__name">{entry.caseNumber}</span>
                              <span className="trash-main__sub">{entry.title}</span>
                            </div>
                          </td>
                          <td>
                            <div className="trash-main">
                              <span className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</span>
                              {linkedChildren > 0 ? (
                                <span className="trash-meta trash-meta--muted">
                                  {entry.totalAppointments}{' '}
                                  {entry.totalAppointments === 1 ? 'turno' : 'turnos'} ·{' '}
                                  {entry.totalDocuments}{' '}
                                  {entry.totalDocuments === 1 ? 'documento' : 'documentos'} asociados
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="trash-table__cell--actions">
                            <TrashActions
                              onRestore={() => handleRestore('case', entry.id)}
                              onDelete={() =>
                                setItemToDelete({
                                  type: 'case',
                                  id: entry.id,
                                  label: entry.caseNumber,
                                })
                              }
                              deleteDisabled={linkedChildren > 0}
                              deleteTitle={
                                linkedChildren > 0
                                  ? 'Eliminá primero sus turnos y documentos de la papelera'
                                  : undefined
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="trash-section">
            <h3 className="trash-section__title">Turnos</h3>
            {trash.appointments.length === 0 ? (
              emptyState
            ) : (
              <div className="trash-table-wrap">
                <table className="trash-table">
                  <thead>
                    <tr>
                      <th>Turno</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>En la papelera</th>
                      <th className="trash-table__cell--actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trash.appointments.map((entry) => (
                      <tr key={entry.appointment?.id ?? entry.appointment?.date}>
                        <td>
                          <div className="trash-main">
                            <span className="trash-main__name">{entry.appointment?.title || '—'}</span>
                          </div>
                        </td>
                        <td className="trash-table__cell--muted">
                          {formatDate(entry.appointment?.date)} {entry.appointment?.time}
                        </td>
                        <td>
                          <span className={`trash-chip ${getStatusClass(entry.appointment?.status)}`}>
                            {entry.appointment?.status}
                          </span>
                        </td>
                        <td className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</td>
                        <td className="trash-table__cell--actions">
                          <TrashActions
                            onRestore={() => handleRestore('appointment', entry.appointment?.id)}
                            onDelete={() =>
                              setItemToDelete({
                                type: 'appointment',
                                id: entry.appointment?.id,
                                label:
                                  entry.appointment?.title ||
                                  formatDate(entry.appointment?.date),
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
          </section>

          <section className="trash-section">
            <h3 className="trash-section__title">Documentos</h3>
            {trash.documents.length === 0 ? (
              emptyState
            ) : (
              <div className="trash-table-wrap">
                <table className="trash-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Expediente</th>
                      <th>Tamaño</th>
                      <th>En la papelera</th>
                      <th className="trash-table__cell--actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trash.documents.map((entry) => (
                      <tr key={entry.document?.id}>
                        <td>
                          <div className="trash-main">
                            <span className="trash-main__name">{entry.document?.fileName}</span>
                            <span className="trash-main__sub">{getTypeLabel(entry.document?.type)}</span>
                          </div>
                        </td>
                        <td className="trash-table__cell--muted">{getDocumentCaseLabel(entry)}</td>
                        <td className="trash-table__cell--muted">
                          {formatFileSize(entry.document?.sizeBytes)}
                        </td>
                        <td className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</td>
                        <td className="trash-table__cell--actions">
                          <TrashActions
                            onRestore={() => handleRestore('document', entry.document?.id)}
                            onDelete={() =>
                              setItemToDelete({
                                type: 'document',
                                id: entry.document?.id,
                                label: entry.document?.fileName,
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
          </section>
        </div>
      )}

      {/* ConfirmDialog always appends the item name plus a question mark, so
          the required irreversible statement is followed by the confirmation
          question ending on the bolded item label. */}
      <ConfirmDialog
        show={Boolean(itemToDelete)}
        onHide={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Borrar definitivamente"
        message="Esta acción es irreversible: el registro y sus archivos se eliminan para siempre. ¿Estás seguro que deseas borrar definitivamente"
        itemName={itemToDelete?.label}
        confirmLabel="Sí, borrar para siempre"
      />
    </section>
  );
};

export default TrashContainer;
