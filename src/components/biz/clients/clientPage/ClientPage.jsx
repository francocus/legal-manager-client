import { useMemo } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import { Mail, Phone, UserRound } from 'lucide-react';
import { useDashboardData } from '../../../services/data/dashboardData.context';
import { getStatusClass, getStatusLabel } from '../../cases/Cases.data';
import '../clients.css';

const ClientPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, cases, loading } = useDashboardData();

  const client = clients.find((entry) => String(entry.id) === String(clientId));

  const clientCases = useMemo(
    () => cases.filter((legalCase) => String(legalCase.clientId) === String(clientId)),
    [cases, clientId],
  );

  if (loading) {
    return (
      <section className="app-page">
        <p className="app-page__subtitle">Cargando cliente...</p>
      </section>
    );
  }

  if (!client) {
    return (
      <section className="app-page">
        <Alert variant="danger">No se encontró el cliente solicitado.</Alert>
        <Link className="app-button app-button--secondary" to="/dashboard/clients">
          Volver a clientes
        </Link>
      </section>
    );
  }

  return (
    <section className="app-page">
      <div className="app-page__header">
        <div className="client-page__identity">
          <span className="client-card__avatar">
            <UserRound size={24} />
          </span>
          <div>
            <p className="app-page__eyebrow">Cliente</p>
            <h2 className="app-page__title">{client.name}</h2>
            <p className="app-page__subtitle">DNI: {client.dni || 'Sin DNI'}</p>
          </div>
        </div>
        <Button
          type="button"
          className="app-button app-button--secondary"
          onClick={() => navigate('/dashboard/clients')}
        >
          Volver
        </Button>
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Datos de contacto</h3>
        <p className="client-page__contact">
          <Mail size={16} /> {client.email || 'Sin correo registrado'}
        </p>
        <p className="client-page__contact" style={{ marginTop: '8px' }}>
          <Phone size={16} /> {client.phone || 'Sin teléfono registrado'}
        </p>
      </div>

      <div className="app-panel">
        <h3 className="app-panel__title">Expedientes ({clientCases.length})</h3>
        {clientCases.length > 0 ? (
          <ul className="client-page__cases">
            {clientCases.map((legalCase) => (
              <li key={legalCase.id}>
                <Link to={`/dashboard/cases/${legalCase.id}`}>
                  <span className="client-page__case-main">
                    <strong>{legalCase.caseNumber}</strong>
                    <span>{legalCase.title}</span>
                  </span>
                  <span className={`cases-item__status ${getStatusClass(legalCase.status)}`}>
                    {getStatusLabel(legalCase.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="app-page__subtitle">Este cliente no tiene expedientes registrados.</p>
        )}
      </div>
    </section>
  );
};

export default ClientPage;
