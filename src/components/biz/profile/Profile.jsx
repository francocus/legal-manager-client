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

const WEEK_DAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
];

const STANDARD_SLOTS = [
  '09:00',
  '10:30',
  '12:00',
  '14:00',
  '15:30',
  '17:00',
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
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [selectedSlots, setSelectedSlots] = useState(STANDARD_SLOTS);
  const [customSlot, setCustomSlot] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

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

        if (data.schedule) {
          try {
            const parsed = typeof data.schedule === 'string' ? JSON.parse(data.schedule) : data.schedule;
            if (Array.isArray(parsed?.days) && parsed.days.length > 0) setSelectedDays(parsed.days);
            if (Array.isArray(parsed?.slots) && parsed.slots.length > 0) setSelectedSlots(parsed.slots);
          } catch (_e) {
            // keep defaults
          }
        }

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

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (selectedDays.length === 0) {
      showToast({ variant: 'danger', message: 'Debés seleccionar al menos un día de atención.' });
      return;
    }
    if (selectedSlots.length === 0) {
      showToast({ variant: 'danger', message: 'Debés seleccionar al menos un horario de atención.' });
      return;
    }
    try {
      setSavingSchedule(true);
      const schedulePayload = {
        days: [...selectedDays].sort((a, b) => a - b),
        slots: [...selectedSlots].sort(),
      };
      const scheduleJson = JSON.stringify(schedulePayload);
      await usersApi.updateLawyerSchedule(user.id, { schedule: scheduleJson });

      setProfileData((prev) => ({
        ...prev,
        schedule: scheduleJson,
      }));

      updateUserSession?.({
        schedule: scheduleJson,
      });

      showToast({ variant: 'success', message: 'Días y horarios de atención actualizados correctamente.' });
    } catch (err) {
      showToast({
        variant: 'danger',
        message: err.message || 'No se pudieron actualizar los horarios de atención.',
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAddCustomSlot = () => {
    if (!customSlot) return;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(customSlot)) {
      showToast({ variant: 'danger', message: 'Formato de hora inválido. Usá HH:mm (ej. 08:30).' });
      return;
    }
    if (selectedSlots.includes(customSlot)) {
      showToast({ variant: 'warning', message: 'El horario ya está agregado.' });
      return;
    }
    setSelectedSlots((prev) => [...prev, customSlot].sort());
    setCustomSlot('');
  };

  const handleRemoveSlot = (slotToRemove) => {
    setSelectedSlots((prev) => prev.filter((s) => s !== slotToRemove));
  };

  const handleLoadStandardSlots = () => {
    setSelectedSlots(STANDARD_SLOTS);
  };

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

      {user?.role === ROLES.ABOGADO && (
        <div className="app-panel" id="schedule">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="app-panel__title" style={{ margin: 0 }}>
              Días y horarios de atención
            </h3>
            {!profileData?.schedule ? (
              <span className="badge bg-warning text-dark" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                Sin configurar
              </span>
            ) : (
              <span className="badge bg-success" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
                Configurado
              </span>
            )}
          </div>
          <p className="app-text" style={{ marginBottom: 16 }}>
            Seleccioná los días de la semana y los horarios en los que tus clientes podrán solicitar turnos con vos.
          </p>
          <Form onSubmit={handleSaveSchedule}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#eef2f6' }}>
                Días de atención
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {WEEK_DAYS.map((day) => {
                  const isChecked = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      className={`app-button ${isChecked ? 'app-button--primary' : 'app-button--secondary'}`}
                      style={{ padding: '6px 14px', fontSize: '0.9rem' }}
                      onClick={() => {
                        setSelectedDays((prev) =>
                          isChecked ? prev.filter((d) => d !== day.id) : [...prev, day.id]
                        );
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <label style={{ fontWeight: 700, margin: 0, color: '#eef2f6' }}>
                  Horarios disponibles ({selectedSlots.length})
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="app-button app-button--secondary"
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={handleLoadStandardSlots}
                  >
                    Cargar horarios estándar
                  </button>
                  {selectedSlots.length > 0 && (
                    <button
                      type="button"
                      className="app-button app-button--secondary"
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      onClick={() => setSelectedSlots([])}
                    >
                      Limpiar todos
                    </button>
                  )}
                </div>
              </div>

              {/* Selector para agregar cualquier horario libre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <Form.Control
                  type="time"
                  value={customSlot}
                  onChange={(e) => setCustomSlot(e.target.value)}
                  style={{ maxWidth: '140px', height: '38px', borderRadius: '10px' }}
                />
                <button
                  type="button"
                  className="app-button app-button--primary"
                  style={{ padding: '6px 14px', fontSize: '0.88rem' }}
                  onClick={handleAddCustomSlot}
                  disabled={!customSlot}
                >
                  + Agregar horario
                </button>
                <span style={{ fontSize: '0.82rem', color: '#a0aec0' }}>
                  Podés configurar cualquier horario de atención libre (ej: 08:30, 11:00, 16:30).
                </span>
              </div>

              {/* Lista de horarios asignados como badges/chips interactivos */}
              {selectedSlots.length === 0 ? (
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontStyle: 'italic', margin: '8px 0' }}>
                  No tenés horarios seleccionados. Agregá uno con el selector o cargá los estándar.
                </p>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {selectedSlots.map((slot) => (
                    <div
                      key={slot}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: 'rgba(92, 138, 180, 0.22)',
                        border: '1px solid rgba(170, 195, 220, 0.4)',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>{slot} hs</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ff8585',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          lineHeight: 1,
                          padding: 0,
                          marginLeft: 2,
                        }}
                        title="Eliminar horario"
                        aria-label={`Eliminar horario ${slot}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="app-button app-button--primary"
              disabled={savingSchedule}
            >
              {savingSchedule ? 'Guardando horarios...' : 'Guardar horarios de atención'}
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
