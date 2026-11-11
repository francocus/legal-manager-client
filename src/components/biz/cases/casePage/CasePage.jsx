import { useContext, useState } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usePreferences } from '../../../services/preferences/preferences.context';
import { casesApi } from '../../../services/api/casesApi';
import { useToast } from '../../../shared/toast/toast.context';
import { formatDate } from '../../../services/utils/format';
import { ROLES } from '../../../services/consts/roles';
import CaseDetails from '../caseDetails/CaseDetails';
import CaseDocuments from '../caseDocuments/CaseDocuments';
import { getStatusClass, getStatusLabel, CASE_STATUS_OPTIONS } from '../Cases.data';
import '../cases.css';

// Sub-component: dropdown + button to add a lawyer to the case.
const AddLawyerRow = ({ caseId, assignedIds, lawyers, onAdded, onError }) => {
  const available = lawyers.filter((l) => !assignedIds.includes(l.id));
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  if (available.length === 0) return null;

  const handleAdd = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      await casesApi.addLawyer(caseId, selectedId);
      setSelectedId('');
      await onAdded?.();
    } catch (err) {
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Form.Select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{ flex: 1 }}
        aria-label="Seleccionar abogado para agregar"
      >
        <option value="">Seleccionar abogado...</option>
        {available.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Form.Select>
      <button
        type="button"
        className="app-button app-button--primary"
        disabled={!selectedId || loading}
        onClick={handleAdd}
      >
        {loading ? 'Agregando...' : 'Agregar'}
      </button>
    </div>
  );
};

const CasePage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthenticationContext);
  const { cases, clients, lawyers, loading, refreshCases } = useDashboardData();
  const { preferences } = usePreferences();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const legalCase = cases.find((entry) => String(entry.id) === String(caseId));
  const canWrite = user?.role === ROLES.SYSADMIN || user?.role === ROLES.ABOGADO;
  const isClosed = legalCase?.status === 'cerrado';

  const handleEditCase = async (payload) => {
    await casesApi.update(payload.id, payload);
    await refreshCases();
    showToast({ variant: 'success', message: 'Expediente actualizado correctamente.' });
    setEditing(false);
  };

  const handleChangeStatus = async (newStatus) => {
    if (!newStatus || newStatus === legalCase.status) return;
    try {
      setChangingStatus(true);
      await casesApi.setStatus(legalCase.id, newStatus);
      await refreshCases();
      showToast({ variant: 'success', message: 'Estado del expediente actualizado.' });
    } catch (err) {
      showToast({ variant: 'danger', message: err.message || 'No se pudo cambiar el estado.' });
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <section className="app-page">
        <p className="app-page__subtitle">Cargando expediente...</p>
      </section>
    );
  }

  if (!legalCase) {
    return (
      <section className="app-page">
        <Alert variant="danger">No se encontró el expediente solicitado.</Alert>
        <Link className="app-button app-button--secondary" to="/dashboard/cases">
          Volver a expedientes
        </Link>
      </section>
    );
  }

  return (
    <section className="app-page">
      <div className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Expediente</p>
          <h2 className="app-page__title">{legalCase.caseNumber}</h2>
          <p className="app-page__subtitle">{legalCase.title}</p>
        </div>
        <div className="app-page__toolbar">
          <span className={`cases-item__status ${getStatusClass(legalCase.status)}`}>
            {getStatusLabel(legalCase.status)}
          </span>
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => navigate('/dashboard/cases')}
          >
            Volver
          </button>
          {canWrite ? (
            <Form.Select
              aria-label="Cambiar estado del expediente"
              value={legalCase.status}
              disabled={changingStatus || isClosed}
              title={isClosed ? 'Un expediente cerrado no puede reabrirse' : 'Cambiar estado'}
              onChange={(e) => handleChangeStatus(e.target.value)}
              style={{ width: 'auto' }}
            >
              {CASE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          ) : null}
          {canWrite && !isClosed ? (
            <button
              type="button"
              className="app-button app-button--primary"
              onClick={() => setEditing(true)}
            >
              Editar expediente
            </button>
          ) : null}
        </div>
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Datos generales</h3>
        <dl className="app-detail-grid">
          <div>
            <dt>Cliente</dt>
            <dd>{legalCase.clientName}</dd>
          </div>
          <div>
            <dt>Área</dt>
            <dd>{legalCase.area || '—'}</dd>
          </div>
          <div>
            <dt>Fecha de inicio</dt>
            <dd>{formatDate(legalCase.startDate, preferences.dateFormat)}</dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{formatDate(legalCase.lastUpdate, preferences.dateFormat)}</dd>
          </div>
          {legalCase.closingDate ? (
            <div>
              <dt>Fecha de cierre</dt>
              <dd>{formatDate(legalCase.closingDate, preferences.dateFormat)}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Abogados asignados</h3>
        {(legalCase.lawyerIds ?? []).length === 0 ? (
          <p style={{ color: 'var(--app-text-muted, #9fb8cc)', margin: '0 0 12px' }}>
            Sin abogados asignados.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
            {(legalCase.lawyerIds ?? []).map((lid) => {
              const lawyer = lawyers.find((l) => l.id === lid);
              return (
                <li
                  key={lid}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                >
                  <span>
                    {lawyer?.name ?? lid}
                    {lawyer?.phone ? ` • Tel: ${lawyer.phone}` : ''}
                  </span>
                  {canWrite && !isClosed && (
                    <button
                      type="button"
                      className="app-button app-button--secondary"
                      style={{ padding: '2px 10px', fontSize: '0.8rem' }}
                      disabled={(legalCase.lawyerIds ?? []).length <= 1}
                      title={
                        (legalCase.lawyerIds ?? []).length <= 1
                          ? 'No se puede quitar el único abogado responsable del expediente'
                          : 'Quitar abogado'
                      }
                      onClick={async () => {
                        try {
                          await casesApi.removeLawyer(legalCase.id, lid);
                          await refreshCases();
                          showToast({
                            variant: 'success',
                            message: 'Abogado quitado del expediente.',
                          });
                        } catch (err) {
                          showToast({
                            variant: 'danger',
                            message: err.message || 'No se pudo quitar el abogado.',
                          });
                        }
                      }}
                    >
                      Quitar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {canWrite && !isClosed && (
          <AddLawyerRow
            caseId={legalCase.id}
            assignedIds={legalCase.lawyerIds ?? []}
            lawyers={lawyers}
            onAdded={async () => {
              await refreshCases();
              showToast({ variant: 'success', message: 'Abogado agregado al expediente.' });
            }}
            onError={(err) =>
              showToast({
                variant: 'danger',
                message: err.message || 'No se pudo agregar el abogado.',
              })
            }
          />
        )}
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Descripción</h3>
        <p className="app-text">{legalCase.description || 'Sin descripción.'}</p>
      </div>

      {legalCase.notes ? (
        <div className="app-panel">
          <h3 className="app-panel__title">Notas</h3>
          <p className="app-text">{legalCase.notes}</p>
        </div>
      ) : null}

      <CaseDocuments legalCase={legalCase} currentUser={user} />

      {editing ? (
        <CaseDetails
          legalCase={legalCase}
          currentUser={user}
          clients={clients}
          lawyers={lawyers}
          onEditCase={handleEditCase}
          onFormClosed={() => setEditing(false)}
        />
      ) : null}
    </section>
  );
};

export default CasePage;
