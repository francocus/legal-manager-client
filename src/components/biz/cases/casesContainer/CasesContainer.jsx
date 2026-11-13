import { useContext, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { casesApi } from '../../../services/api/casesApi';
import { useToast } from '../../../shared/toast/toast.context';
import ConfirmDialog from '../../../shared/confirmDialog/ConfirmDialog';
import { SkeletonRows } from '../../../shared/skeleton/Skeleton';
import EmptyState from '../../../shared/emptyState/EmptyState';
import CaseDetails from '../caseDetails/CaseDetails';
import NewCase from '../newCase/NewCase';
import CasesItem from '../casesItem/CasesItem';
import CasesSearch from '../casesSearch/CasesSearch';
import { CASE_STATUS_OPTIONS, getStatusLabel } from '../Cases.data';
import { ROLES, isAdmin, isLawyer } from '../../../services/consts/roles';
import '../cases.css';
import '../../trash/trash.css';

const CasesContainer = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthenticationContext);
  const { cases, clients, lawyers, loading, error, refreshCases } = useDashboardData();
  const { showToast } = useToast();

  const [searchCase, setSearchCase] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewCase, setShowNewCase] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState(null);
  const [caseToDelete, setCaseToDelete] = useState(null);

  const handleOpenNewCase = () => {
    setCaseToEdit(null);
    setCaseToDelete(null);
    setShowNewCase(true);
  };

  const handleCloseForms = () => {
    setShowNewCase(false);
    setCaseToEdit(null);
    setCaseToDelete(null);
  };

  const handleAddCase = async (payload) => {
    await casesApi.create(payload);
    await refreshCases();
  };

  const handleEditCase = async (payload) => {
    await casesApi.update(payload.id, payload);
    await refreshCases();
  };

  const handleDeleteCase = async (id) => {
    try {
      await casesApi.remove(id);
      await refreshCases();
      setCaseToDelete(null);
      showToast({ variant: 'success', message: 'Expediente eliminado correctamente.' });
    } catch (deleteError) {
      showToast({
        variant: 'danger',
        message: deleteError.message || 'No se pudo eliminar el expediente.',
      });
      throw deleteError;
    }
  };

  const query = searchCase.trim().toLowerCase();

  const filteredCases = cases.filter((legalCase) => {
    const matchesSearch = [
      legalCase.caseNumber,
      legalCase.title,
      legalCase.area,
      legalCase.clientName,
      legalCase.lawyerName,
      legalCase.status,
      legalCase.description,
      legalCase.notes,
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query),
    );

    const matchesStatus =
      statusFilter === 'all' || legalCase.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const hasScrollableContent = !loading && filteredCases.length > 0;
  const userIsAdmin = isAdmin(currentUser?.role);
  const canWrite = userIsAdmin || currentUser?.role === ROLES.ABOGADO;

  return (
    <section className={`cases-panel${hasScrollableContent ? ' has-scroll-content' : ''}`}>
      <header className="cases-header">
        <div className="cases-header__copy">
          <p>
            {userIsAdmin
              ? 'Gestión de expedientes'
              : 'Visualizá y gestioná el estado de los expedientes'}
          </p>
          <h2>{userIsAdmin ? 'Gestión de expedientes' : 'Expedientes asignados'}</h2>
        </div>

        <div className="cases-header__controls">
          <div className="cases-filter-wrap">
            <select
              className="cases-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              {CASE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="cases-search-wrap">
            <CasesSearch onSearch={setSearchCase} />
          </div>

          {userIsAdmin || isLawyer(currentUser?.role) ? (
            <button
              type="button"
              className="trash-entry-button"
              title="Papelera"
              aria-label="Papelera"
              onClick={() => navigate('/dashboard/cases/papelera')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 3.75h6l1 1.5H20v1.5H4v-1.5h4l1-1.5Zm1.5 5.25h1.5v7.5h-1.5v-7.5Zm4.5 0h1.5v7.5H15v-7.5Zm-8.25 0h1.5v7.5h-1.5v-7.5Zm1.5 11.25h9A1.75 1.75 0 0 0 19 18v-8.25H5V18c0 .97.78 1.75 1.75 1.75Z" />
              </svg>
            </button>
          ) : null}

          {canWrite ? (
            <Button
              type="button"
              className="cases-create"
              title="Crear expediente"
              aria-label="Crear expediente"
              onClick={handleOpenNewCase}
            >
              <span className="cases-create__text">Crear expediente</span>
            </Button>
          ) : null}
        </div>
      </header>

      {error ? (
        <Alert className="cases-alert" variant="danger">
          {error}
        </Alert>
      ) : null}

      {showNewCase ? (
        <NewCase
          currentUser={currentUser}
          clients={clients}
          lawyers={lawyers}
          onAddCase={handleAddCase}
          onFormClosed={handleCloseForms}
        />
      ) : null}

      {caseToEdit ? (
        <CaseDetails
          legalCase={caseToEdit}
          currentUser={currentUser}
          clients={clients}
          lawyers={lawyers}
          onEditCase={handleEditCase}
          onFormClosed={handleCloseForms}
        />
      ) : null}

      <ConfirmDialog
        show={Boolean(caseToDelete)}
        onHide={() => setCaseToDelete(null)}
        onConfirm={() => handleDeleteCase(caseToDelete?.id)}
        title="Dar de baja"
        message="El registro queda desactivado y no se elimina físicamente. ¿Estás seguro que deseas dar de baja el expediente"
        itemName={caseToDelete?.caseNumber}
        confirmLabel="Sí, dar de baja"
      />

      {loading ? (
        <SkeletonRows rows={5} />
      ) : filteredCases.length > 0 ? (
        <>
          {userIsAdmin ? (
            <div className="cases-table-wrap">
              <table className="cases-table">
                <thead>
                  <tr>
                    <th>Expediente / Título</th>
                    <th>Cliente / Abogado</th>
                    <th>Área</th>
                    <th>Estado</th>
                    <th className="cases-table__actions-head">Acciones Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((legalCase) => (
                    <tr
                      key={legalCase.id}
                      className="case-admin-row is-clickable"
                      onClick={() => navigate(`/dashboard/cases/${legalCase.id}`)}
                    >
                      <td className="case-admin-cell case-admin-cell--main">
                        <div className="case-admin-main">
                          <span className="case-admin-main__name">{legalCase.caseNumber}</span>
                          <span className="case-admin-main__sub">{legalCase.title}</span>
                        </div>
                      </td>
                      <td className="case-admin-cell case-admin-cell--main">
                        <div className="case-admin-main">
                          <span className="case-admin-main__name">{legalCase.clientName}</span>
                          <span className="case-admin-main__sub">{legalCase.lawyerName}</span>
                        </div>
                      </td>
                      <td className="case-admin-cell case-admin-cell--muted">{legalCase.area}</td>
                      <td className="case-admin-cell" style={{ textAlign: 'center' }}>
                        <span className={`cases-item__status is-${legalCase.status.toLowerCase()}`}>
                          {getStatusLabel(legalCase.status)}
                        </span>
                      </td>
                      <td className="case-admin-cell case-admin-cell--actions">
                        <div className="case-actions">
                          <button
                            type="button"
                            className="case-action case-action--edit"
                            title="Editar expediente"
                            aria-label="Editar expediente"
                            onClick={(event) => {
                              event.stopPropagation();
                              setShowNewCase(false);
                              setCaseToDelete(null);
                              setCaseToEdit(legalCase);
                            }}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <path d="M4 17.25V20h2.75L18.81 7.94l-2.75-2.75L4 17.25Zm14.71-9.54a.996.996 0 0 0 0-1.41l-1.01-1.01a.996.996 0 1 0-1.41 1.41l1.01 1.01c.39.39 1.03.39 1.41 0Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="case-action case-action--delete"
                            title="Eliminar expediente"
                            aria-label="Eliminar expediente"
                            onClick={(event) => {
                              event.stopPropagation();
                              setShowNewCase(false);
                              setCaseToEdit(null);
                              setCaseToDelete(legalCase);
                            }}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <path d="M9 3.75h6l1 1.5H20v1.5H4v-1.5h4l1-1.5Zm1.5 5.25h1.5v7.5h-1.5v-7.5Zm4.5 0h1.5v7.5H15v-7.5Zm-8.25 0h1.5v7.5h-1.5v-7.5Zm1.5 11.25h9A1.75 1.75 0 0 0 19 18v-8.25H5V18c0 .97.78 1.75 1.75 1.75Z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cases-list">
              {filteredCases.map((legalCase) => (
                <CasesItem
                  key={legalCase.id}
                  id={legalCase.id}
                  caseNumber={legalCase.caseNumber}
                  title={legalCase.title}
                  clientName={legalCase.clientName}
                  lawyerName={legalCase.lawyerName}
                  area={legalCase.area}
                  status={legalCase.status}
                  currentUser={currentUser}
                  onEdit={(id) => {
                    const selectedCase = cases.find((entry) => entry.id === id);
                    if (selectedCase) {
                      setShowNewCase(false);
                      setCaseToDelete(null);
                      setCaseToEdit(selectedCase);
                    }
                  }}
                  onDelete={(id) => {
                    const selectedCase = filteredCases.find((entry) => entry.id === id);
                    if (selectedCase) {
                      setShowNewCase(false);
                      setCaseToEdit(null);
                      setCaseToDelete(selectedCase);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No se encontraron expedientes"
          message="Probá con otro término de búsqueda o cambiá el filtro de estado."
        />
      )}
    </section>
  );
};

export default CasesContainer;
