import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { AuthenticationContext } from '../../services/auth/authentication.context';
import { usePreferences } from '../../services/preferences/preferences.context';
import { ThemeContext } from '../../services/theme/theme.context';
import { usersApi } from '../../services/api/usersApi';
import { useToast } from '../../shared/toast/toast.context';
import { getRoleLabel } from '../users/User.data';
import { ROLES } from '../../services/consts/roles';
import './Profile.css';

const DATE_FORMAT_OPTIONS = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/AAAA' },
  { value: 'yyyy-mm-dd', label: 'AAAA-MM-DD' },
];

const Profile = () => {
  const { user, updateUserSession } = useContext(AuthenticationContext);
  const { preferences, updatePreference } = usePreferences();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        setLoadingProfile(true);
        const data = await usersApi.getById(user.id);
        if (!active) return;
        setProfileData(data);
        setPhone(data.phone || '');
        setAddress(data.address || '');

        if (data.name && data.name !== user.name) {
          updateUserSession?.({ name: data.name, dni: data.dni });
        }
      } catch (_err) {
        // Fallback to existing session user if getById fails (e.g. offline/mock)
        setProfileData(user);
        setPhone(user?.phone || '');
        setAddress(user?.address || '');
      } finally {
        if (active) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user, updateUserSession]);

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      setSavingContact(true);
      const isClient = user.role === ROLES.CLIENTE;
      const isLawyer = user.role === ROLES.ABOGADO;

      if (isClient) {
        await Promise.all([
          usersApi.updateClientPhone(user.id, phone || null),
          usersApi.updateClientAddress(user.id, address || null),
        ]);
      } else if (isLawyer) {
        await usersApi.updateLawyerPhone(user.id, phone || null);
      }

      setProfileData((prev) => ({
        ...prev,
        phone,
        ...(isClient ? { address } : {}),
      }));

      updateUserSession?.({
        phone,
        ...(isClient ? { address } : {}),
      });

      showToast({ variant: 'success', message: 'Datos de contacto actualizados correctamente.' });
    } catch (err) {
      showToast({
        variant: 'danger',
        message: err.message || 'No se pudieron actualizar los datos de contacto.',
      });
    } finally {
      setSavingContact(false);
    }
  };

  const displayName = profileData?.name || user?.name || '—';
  const displayDni = profileData?.dni || user?.dni || '—';
  const displayEmail = profileData?.email || user?.email || '—';
  const displayRole = getRoleLabel(profileData?.role || user?.role);
  const displayBarNumber = profileData?.barNumber || user?.barNumber || '—';
  const displaySpecialties = Array.isArray(profileData?.specialties)
    ? profileData.specialties.join(', ')
    : profileData?.specialties || '—';

  return (
    <section className="app-page">
      <header className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Mi cuenta</p>
          <h2 className="app-page__title">Perfil y preferencias</h2>
        </div>
      </header>

      <div className="app-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="app-panel__title" style={{ margin: 0 }}>
            Datos de la cuenta
          </h3>
          {loadingProfile ? <Spinner animation="border" size="sm" variant="light" /> : null}
        </div>
        <dl className="app-detail-grid" style={{ marginTop: 16 }}>
          <div>
            <dt>Nombre</dt>
            <dd>{displayName}</dd>
          </div>
          <div>
            <dt>DNI</dt>
            <dd>{displayDni}</dd>
          </div>
          <div>
            <dt>Correo electrónico</dt>
            <dd>{displayEmail}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{displayRole}</dd>
          </div>
          {user?.role === ROLES.ABOGADO ? (
            <>
              <div>
                <dt>Matrícula</dt>
                <dd>{displayBarNumber}</dd>
              </div>
              <div>
                <dt>Especialidades</dt>
                <dd>{displaySpecialties}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </div>

      {(user?.role === ROLES.CLIENTE || user?.role === ROLES.ABOGADO) && (
        <div className="app-panel">
          <h3 className="app-panel__title">Información de contacto</h3>
          <p className="app-text" style={{ marginBottom: 16 }}>
            {user.role === ROLES.ABOGADO
              ? 'Mantené tu teléfono actualizado para que el estudio y tus clientes puedan contactarte.'
              : 'Información de contacto para la gestión de tus causas y citas.'}
          </p>
          <Form onSubmit={handleSaveContact}>
            <Row>
              <Col md={user?.role === ROLES.CLIENTE ? 6 : 12}>
                <Form.Group className="mb-3" controlId="profilePhone">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    value={phone}
                    placeholder="Ej. +54 9 11 1234-5678"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
              {user?.role === ROLES.CLIENTE ? (
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="profileAddress">
                    <Form.Label>Dirección</Form.Label>
                    <Form.Control
                      type="text"
                      value={address}
                      placeholder="Ej. San Martín 123, Piso 4"
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              ) : null}
            </Row>
            <Button
              type="submit"
              className="app-button app-button--primary"
              disabled={savingContact}
            >
              {savingContact ? 'Guardando...' : 'Guardar información de contacto'}
            </Button>
          </Form>
        </div>
      )}

      <div className="app-panel">
        <h3 className="app-panel__title">Preferencias</h3>
        <div className="profile-preferences">
          <Form.Group controlId="dateFormat">
            <Form.Label>Formato de fecha</Form.Label>
            <Form.Select
              value={preferences.dateFormat}
              onChange={(event) => updatePreference('dateFormat', event.target.value)}
            >
              {DATE_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="profile-theme">
            <span className="app-text">Tema actual: {theme === 'light' ? 'Claro' : 'Oscuro'}</span>
            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={toggleTheme}
            >
              Cambiar tema
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
