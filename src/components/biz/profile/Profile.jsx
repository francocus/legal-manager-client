import { useContext, useEffect, useMemo, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { BriefcaseBusiness, Check, CircleAlert, Pencil, Phone, UserRound, X } from 'lucide-react';
import { AuthenticationContext } from '../../services/auth/authentication.context';
import { usersApi } from '../../services/api/usersApi';
import { useToast } from '../../shared/toast/toast.context';
import { getRoleLabel } from '../users/User.data';
import { ROLES } from '../../services/consts/roles';
import { getProfileMissingFields, isProfileComplete } from '../../services/consts/profile';
import { normalizeSpecialties } from '../../services/consts/specialties';
import SpecialtiesSelector from '../../shared/specialtiesSelector/SpecialtiesSelector';
import './Profile.css';

const PROFILE_FIELD_LABELS = {
  phone: 'teléfono',
  address: 'dirección',
  schedule: 'horarios de atención',
};

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

const DAY_IDS_BY_NAME = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

// Older schedules stored day names while the current editor uses numeric ids.
// Normalizing on read prevents duplicates such as "Lunes" + 1 counting twice.
const normalizeDayId = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6) {
    return value;
  }
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 6) return numeric;
  return DAY_IDS_BY_NAME[raw] ?? null;
};

const normalizeDays = (days) =>
  [...new Set((Array.isArray(days) ? days : []).map(normalizeDayId).filter(Boolean))].sort(
    (a, b) => a - b,
  );

const normalizeSlots = (slots) =>
  [...new Set((Array.isArray(slots) ? slots : []).map((slot) => String(slot ?? '').trim().slice(0, 5)).filter(Boolean))].sort();

const parseSchedule = (schedule) => {
  if (!schedule) return null;
  try {
    const parsed = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    return {
      days: normalizeDays(parsed?.days),
      slots: normalizeSlots(parsed?.slots),
    };
  } catch (_e) {
    return null;
  }
};

const describeDays = (days) => {
  if (days.length === 0) return 'Sin días';
  const labels = days.map((id) => WEEK_DAYS.find((day) => day.id === id)?.label).filter(Boolean);
  if (labels.length === 0) return 'Sin días';
  if (days.length > 1 && days.every((day, index) => day === days[0] + index)) {
    return `${labels[0]} a ${labels[labels.length - 1]}`;
  }
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
};

const Profile = () => {
  const { user, updateUserSession } = useContext(AuthenticationContext);
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [selectedSlots, setSelectedSlots] = useState(STANDARD_SLOTS);
  const [customSlot, setCustomSlot] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [savingField, setSavingField] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isClient = user?.role === ROLES.CLIENTE;
  const isLawyer = user?.role === ROLES.ABOGADO;

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

        // Legacy or differently-cased values are mapped to the curated list;
        // anything outside it is dropped before it reaches the selector.
        if (data.specialties) {
          setSpecialties(normalizeSpecialties(data.specialties));
        }

        const savedSchedule = parseSchedule(data.schedule);
        if (savedSchedule) {
          if (savedSchedule.days.length > 0) setSelectedDays(savedSchedule.days);
          if (savedSchedule.slots.length > 0) setSelectedSlots(savedSchedule.slots);
        }

        if (data.name && data.name !== user.name) {
          updateUserSession?.({ name: data.name, dni: data.dni });
        }
      } catch (_err) {
        // Fallback to existing session user if getById fails (e.g. offline/mock)
        setProfileData(user);
        setPhone(user?.phone || '');
        setAddress(user?.address || '');
        if (user?.specialties) {
          setSpecialties(normalizeSpecialties(user.specialties));
        }
        const fallbackSchedule = parseSchedule(user?.schedule);
        if (fallbackSchedule) {
          if (fallbackSchedule.days.length > 0) setSelectedDays(fallbackSchedule.days);
          if (fallbackSchedule.slots.length > 0) setSelectedSlots(fallbackSchedule.slots);
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user, updateUserSession]);

  const cancelEdit = () => {
    setEditingField(null);
    setDraftValue('');
  };

  const startEdit = (field, value) => {
    setDraftValue(value ?? '');
    setEditingField(field);
  };

  const handleSaveSimpleField = async (field) => {
    const value = (draftValue || '').trim();

    if (['name', 'dni', 'email'].includes(field) && !value) {
      showToast({ variant: 'danger', message: 'Este dato no puede quedar vacío.' });
      return;
    }
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showToast({ variant: 'danger', message: 'Ingresá un correo electrónico válido.' });
      return;
    }

    try {
      setSavingField(field);

      if (['name', 'dni', 'email'].includes(field)) {
        const payload = {
          name: field === 'name' ? value : profileData?.name || user?.name,
          dni: field === 'dni' ? value : profileData?.dni || user?.dni,
          email: field === 'email' ? value : profileData?.email || user?.email,
        };
        const updated = await usersApi.update(user.id, payload);
        setProfileData((prev) => ({ ...prev, ...updated }));
        updateUserSession?.({
          name: updated?.name ?? payload.name,
          dni: updated?.dni ?? payload.dni,
          email: updated?.email ?? payload.email,
        });
      } else if (field === 'phone') {
        const nextPhone = value || null;
        if (isClient) {
          await usersApi.updateClientPhone(user.id, nextPhone);
        } else {
          await usersApi.updateLawyerPhone(user.id, nextPhone);
        }
        setPhone(value);
        setProfileData((prev) => ({ ...prev, phone: nextPhone }));
        updateUserSession?.({ phone: nextPhone });
      } else if (field === 'address') {
        const nextAddress = value || null;
        await usersApi.updateClientAddress(user.id, nextAddress);
        setAddress(value);
        setProfileData((prev) => ({ ...prev, address: nextAddress }));
        updateUserSession?.({ address: nextAddress });
      }

      cancelEdit();
      showToast({ variant: 'success', message: 'Dato actualizado correctamente.' });
    } catch (err) {
      showToast({
        variant: 'danger',
        message: err.message || 'No se pudo actualizar el dato.',
      });
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveSpecialties = async () => {
    if (!user?.id) return;
    const payload = normalizeSpecialties(specialties);
    if (payload.length === 0) {
      showToast({ variant: 'danger', message: 'Debés seleccionar al menos una especialidad.' });
      return;
    }
    try {
      setSavingField('specialties');
      const updated = await usersApi.updateSpecialties(user.id, payload);
      const saved = normalizeSpecialties(updated?.specialties ?? payload);
      setSpecialties(saved);
      setProfileData((prev) => ({ ...prev, specialties: saved }));
      updateUserSession?.({ specialties: saved });
      cancelEdit();
      showToast({ variant: 'success', message: 'Especialidades actualizadas correctamente.' });
    } catch (err) {
      showToast({
        variant: 'danger',
        message: err.message || 'No se pudieron actualizar las especialidades.',
      });
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveSchedule = async () => {
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
      setSavingField('schedule');
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
      updateUserSession?.({ schedule: scheduleJson });
      cancelEdit();
      showToast({ variant: 'success', message: 'Días y horarios de atención actualizados correctamente.' });
    } catch (err) {
      showToast({
        variant: 'danger',
        message: err.message || 'No se pudieron actualizar los horarios de atención.',
      });
    } finally {
      setSavingField(null);
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

  const renderSimpleEditor = (field, { type = 'text', placeholder } = {}) => (
    <div className="profile-inline-editor">
      <Form.Control
        size="sm"
        type={type}
        value={draftValue}
        placeholder={placeholder}
        autoFocus
        onChange={(event) => setDraftValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleSaveSimpleField(field);
          }
          if (event.key === 'Escape') cancelEdit();
        }}
      />
      <button
        type="button"
        className="profile-inline-action profile-inline-action--save"
        onClick={() => handleSaveSimpleField(field)}
        disabled={savingField === field}
        aria-label="Guardar"
        title="Guardar"
      >
        {savingField === field ? <Spinner animation="border" size="sm" /> : <Check size={16} />}
      </button>
      <button
        type="button"
        className="profile-inline-action"
        onClick={cancelEdit}
        aria-label="Cancelar"
        title="Cancelar"
      >
        <X size={16} />
      </button>
    </div>
  );

  const renderSpecialtiesEditor = () => (
    <div className="profile-inline-editor profile-inline-editor--block">
      <SpecialtiesSelector selected={specialties} onChange={setSpecialties} />
      <div className="profile-inline-actions">
        <button
          type="button"
          className="app-button app-button--primary"
          onClick={handleSaveSpecialties}
          disabled={savingField === 'specialties'}
        >
          {savingField === 'specialties' ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="app-button app-button--secondary" onClick={cancelEdit}>
          Cancelar
        </button>
      </div>
    </div>
  );

  const renderScheduleEditor = () => (
    <div className="profile-inline-editor profile-inline-editor--block">
      <label className="profile-field-label">Días de atención</label>
      <div className="profile-inline-chips">
        {WEEK_DAYS.map((day) => {
          const isChecked = selectedDays.includes(day.id);
          return (
            <button
              key={day.id}
              type="button"
              className={`app-button ${isChecked ? 'app-button--primary' : 'app-button--secondary'}`}
              onClick={() =>
                setSelectedDays((prev) =>
                  isChecked ? prev.filter((d) => d !== day.id) : [...prev, day.id],
                )
              }
            >
              {day.label}
            </button>
          );
        })}
      </div>

      <label className="profile-field-label">Horarios disponibles ({selectedSlots.length})</label>
      <div className="profile-inline-chips">
        <button
          type="button"
          className="app-button app-button--secondary"
          onClick={handleLoadStandardSlots}
        >
          Cargar horarios estándar
        </button>
        {selectedSlots.length > 0 && (
          <button
            type="button"
            className="app-button app-button--secondary"
            onClick={() => setSelectedSlots([])}
          >
            Limpiar todos
          </button>
        )}
      </div>

      <div className="profile-inline-chips">
        <Form.Control
          type="time"
          value={customSlot}
          onChange={(e) => setCustomSlot(e.target.value)}
          className="profile-inline-time"
        />
        <button
          type="button"
          className="app-button app-button--primary"
          onClick={handleAddCustomSlot}
          disabled={!customSlot}
        >
          + Agregar horario
        </button>
      </div>

      {selectedSlots.length === 0 ? (
        <p className="profile-empty">
          No tenés horarios seleccionados. Agregá uno con el selector o cargá los estándar.
        </p>
      ) : (
        <div className="profile-inline-chips">
          {selectedSlots.map((slot) => (
            <div key={slot} className="profile-slot">
              <span>{slot} hs</span>
              <button
                type="button"
                className="profile-slot__remove"
                onClick={() => handleRemoveSlot(slot)}
                title="Eliminar horario"
                aria-label={`Eliminar horario ${slot}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="profile-inline-actions">
        <button
          type="button"
          className="app-button app-button--primary"
          onClick={handleSaveSchedule}
          disabled={savingField === 'schedule'}
        >
          {savingField === 'schedule' ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="app-button app-button--secondary" onClick={cancelEdit}>
          Cancelar
        </button>
      </div>
    </div>
  );

  const renderDatum = ({
    label,
    value,
    field,
    editable = false,
    rawValue,
    editor,
    type = 'text',
    placeholder,
  }) => {
    const isEditing = editingField === field;
    return (
      <div className={`profile-datum${isEditing ? ' profile-datum--editing' : ''}`}>
        <dt>{label}</dt>
        <dd>
          {isEditing ? (
            editor ? editor() : renderSimpleEditor(field, { type, placeholder })
          ) : (
            <span className="profile-datum__row">
              <span className="profile-datum__value">{value}</span>
              {editable && (
                <button
                  type="button"
                  className="profile-edit-button"
                  onClick={() => startEdit(field, rawValue ?? value)}
                  aria-label={`Editar ${label}`}
                  title={`Editar ${label}`}
                >
                  <Pencil size={14} />
                </button>
              )}
            </span>
          )}
        </dd>
      </div>
    );
  };

  const displayName = profileData?.name || user?.name || '—';
  const displayDni = profileData?.dni || user?.dni || '—';
  const displayEmail = profileData?.email || user?.email || '—';
  const displayRole = getRoleLabel(profileData?.role || user?.role);
  const displayBarNumber = profileData?.barNumber || user?.barNumber || '—';
  const displaySpecialties = specialties.length > 0 ? specialties.join(', ') : '—';
  const displayPhone = profileData?.phone || 'Sin teléfono registrado';
  const displayAddress = profileData?.address || 'Sin dirección registrada';
  const savedSchedule = useMemo(() => parseSchedule(profileData?.schedule), [profileData?.schedule]);
  const displaySchedule = savedSchedule
    ? `${describeDays(savedSchedule.days)} · ${savedSchedule.slots.length} horarios`
    : 'Sin configurar';

  // profileData is refreshed from the API on mount; the session user is the
  // fallback while that request is in flight.
  const profileOwner = profileData ?? user;
  const profileIsComplete = isProfileComplete(profileOwner);
  const missingProfileFields = getProfileMissingFields(profileOwner);
  const missingProfileLabels = missingProfileFields
    .map((field) => PROFILE_FIELD_LABELS[field])
    .filter(Boolean);

  return (
    <section className="app-page">
      <header className="app-page__header">
        <div>
          <p className="app-page__eyebrow">Mi cuenta</p>
          <h2 className="app-page__title">Mi perfil</h2>
        </div>
      </header>

      {!profileIsComplete && (
        <div className="profile-completeness-alert" role="status">
          <CircleAlert size={18} aria-hidden="true" />
          <span>Completá tu perfil: falta {missingProfileLabels.join(' y ')}.</span>
        </div>
      )}

      <div className="app-panel">
        <div className="profile-panel-header">
          <div>
            <h3 className="app-panel__title">Datos de la cuenta</h3>
            <p className="profile-hint">
              Tocá el lápiz junto a un dato para editarlo. Solo los campos habilitados para tu rol se
              pueden modificar.
            </p>
          </div>
          {loadingProfile ? <Spinner animation="border" size="sm" variant="secondary" /> : null}
        </div>

        <section className="profile-section" id="profile-identity">
          <h4 className="profile-section__title">
            <UserRound size={16} aria-hidden="true" />
            Identidad
          </h4>
          <dl className="app-detail-grid profile-detail-grid">
            {renderDatum({
              label: 'Nombre',
              value: displayName,
              field: 'name',
              editable: isAdmin,
            })}
            {renderDatum({
              label: 'DNI',
              value: displayDni,
              field: 'dni',
              editable: isAdmin,
            })}
            {renderDatum({
              label: 'Correo electrónico',
              value: displayEmail,
              field: 'email',
              editable: isAdmin,
              type: 'email',
            })}
            {renderDatum({ label: 'Rol', value: displayRole, field: 'role' })}
          </dl>
        </section>

        {(isClient || isLawyer) && (
          <section className="profile-section" id="profile-contact">
            <h4 className="profile-section__title">
              <Phone size={16} aria-hidden="true" />
              Contacto
            </h4>
            <dl className="app-detail-grid profile-detail-grid">
              {renderDatum({
                label: 'Teléfono',
                value: displayPhone,
                field: 'phone',
                editable: true,
                rawValue: phone,
                type: 'tel',
                placeholder: 'Ej. +54 9 11 1234-5678',
              })}
              {isClient &&
                renderDatum({
                  label: 'Dirección',
                  value: displayAddress,
                  field: 'address',
                  editable: true,
                  rawValue: address,
                  placeholder: 'Ej. San Martín 123, Piso 4',
                })}
            </dl>
          </section>
        )}

        {isLawyer && (
          <section className="profile-section" id="profile-professional">
            <h4 className="profile-section__title">
              <BriefcaseBusiness size={16} aria-hidden="true" />
              Perfil profesional
            </h4>
            <dl className="app-detail-grid profile-detail-grid">
              {renderDatum({
                label: 'Matrícula',
                value: displayBarNumber,
                field: 'barNumber',
              })}
              {renderDatum({
                label: 'Especialidades',
                value: displaySpecialties,
                field: 'specialties',
                editable: true,
                editor: renderSpecialtiesEditor,
              })}
              {renderDatum({
                label: 'Horarios de atención',
                value: displaySchedule,
                field: 'schedule',
                editable: true,
                editor: renderScheduleEditor,
              })}
            </dl>
          </section>
        )}
      </div>
    </section>
  );
};

export default Profile;
