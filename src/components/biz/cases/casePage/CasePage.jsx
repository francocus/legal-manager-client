import { useContext, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { usePreferences } from '../../../services/preferences/preferences.context';
import { casesApi } from '../../../services/api/casesApi';
import { useToast } from '../../../shared/toast/toast.context';
import { formatDate } from '../../../services/utils/format';
import { ROLES } from '../../../services/consts/roles';
import CaseDetails from '../caseDetails/CaseDetails';
import { getStatusClass, getStatusLabel } from '../Cases.data';
import '../cases.css';

const CasePage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthenticationContext);
  const { cases, clients, lawyers, loading, refreshCases } = useDashboardData();
  const { preferences } = usePreferences();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);

  const legalCase = cases.find((entry) => String(entry.id) === String(caseId));
  const canWrite = user?.role === ROLES.SYSADMIN || user?.role === ROLES.ABOGADO;

  const handleEditCase = async (payload) => {
    await casesApi.update(payload.id, payload);
    await refreshCases();
    showToast({ variant: 'success', message: 'Expediente actualizado correctamente.' });
    setEditing(false);
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
            <dt>Abogado</dt>
            <dd>{legalCase.lawyerName}</dd>
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
        </dl>
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
