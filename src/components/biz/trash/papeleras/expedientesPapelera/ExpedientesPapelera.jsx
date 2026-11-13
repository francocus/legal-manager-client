import { useNavigate } from 'react-router';
import { Alert } from 'react-bootstrap';
import { useTrash } from '../shared/useTrash';
import { getChildrenMeta, getDaysMeta, getDocumentCaseLabel } from '../shared/trash.helpers';
import TrashActions from '../shared/TrashActions';
import { SkeletonRows } from '../../../../shared/skeleton/Skeleton';
import EmptyState from '../../../../shared/emptyState/EmptyState';
import { formatFileSize, getTypeLabel } from '../../../documents/Documents.data';
import '../../../cases/cases.css';
import '../../trash.css';

const EMPTY_SECTION = (
  <EmptyState
    title="La papelera está vacía."
    message="No hay elementos eliminados por ahora."
  />
);

// Papelera for expedientes (admins and lawyers): mirrors the CasesContainer
// header and table chrome while listing trashed expedientes and, in a second
// stacked section, their trashed documentos. The backend already filters
// lawyer items server-side, so both roles see exactly the rows they may
// restore.
const ExpedientesPapelera = () => {
  const navigate = useNavigate();
  const { trash, loading, error, restore } = useTrash();

  return (
    <section className="cases-panel">
      <header className="cases-header">
        <div className="cases-header__copy">
          <p>Papelera de expedientes</p>
          <h2>Papelera de expedientes</h2>
        </div>

        <div className="cases-header__controls">
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate('/dashboard/cases')}
          >
            Volver
          </button>
        </div>
      </header>

      {error ? (
        <Alert className="cases-alert" variant="danger">
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
              EMPTY_SECTION
            ) : (
              <div className="cases-table-wrap">
                <table className="cases-table cases-table--trash-cases">
                  <thead>
                    <tr>
                      <th>Expediente / Título</th>
                      <th>En la papelera</th>
                      <th className="cases-table__actions-head">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trash.cases.map((entry) => {
                      // The children meta is informational only: it points
                      // out linked turnos/documentos that live in the
                      // papelera too, since restore is the only action.
                      const childrenMeta = getChildrenMeta(entry);
                      return (
                        <tr key={entry.id}>
                          <td className="case-admin-cell case-admin-cell--main">
                            <div className="case-admin-main">
                              <span className="case-admin-main__name">{entry.caseNumber}</span>
                              <span className="case-admin-main__sub">{entry.title}</span>
                            </div>
                          </td>
                          <td className="case-admin-cell case-admin-cell--muted">
                            <div className="trash-main">
                              <span className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</span>
                              {childrenMeta ? (
                                <span className="trash-meta trash-meta--muted">{childrenMeta}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="case-admin-cell case-admin-cell--actions">
                            <TrashActions onRestore={() => restore('case', entry.id)} />
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
            <h3 className="trash-section__title">Documentos</h3>
            {trash.documents.length === 0 ? (
              EMPTY_SECTION
            ) : (
              <div className="cases-table-wrap">
                <table className="cases-table cases-table--trash-documents">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Expediente</th>
                      <th>Tamaño</th>
                      <th>En la papelera</th>
                      <th className="cases-table__actions-head">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trash.documents.map((entry) => {
                      const document = entry.document ?? {};
                      return (
                        <tr key={document.id}>
                          <td className="case-admin-cell case-admin-cell--main">
                            <div className="case-admin-main">
                              <span className="case-admin-main__name">{document.fileName}</span>
                              <span className="case-admin-main__sub">
                                {getTypeLabel(document.type)}
                              </span>
                            </div>
                          </td>
                          <td className="case-admin-cell case-admin-cell--muted">
                            {getDocumentCaseLabel(entry)}
                          </td>
                          <td className="case-admin-cell case-admin-cell--muted">
                            {formatFileSize(document.sizeBytes)}
                          </td>
                          <td className="case-admin-cell case-admin-cell--muted">
                            <span className="trash-meta">{getDaysMeta(entry.deactivatedAt)}</span>
                          </td>
                          <td className="case-admin-cell case-admin-cell--actions">
                            <TrashActions onRestore={() => restore('document', document.id)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
};

export default ExpedientesPapelera;
