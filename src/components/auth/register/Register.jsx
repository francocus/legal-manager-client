import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { usersApi } from '../../services/api/usersApi';
import ToggleTheme from '../../shared/toggleTheme/ToggleTheme.jsx';
import { Scale } from 'lucide-react';
import { useForm } from '../../services/hooks/useForm';
import { formatDni, isDni, isEmail, isRequired } from '../../services/validators/validators';
import { ROLES } from '../../services/consts/roles';
import { useToast } from '../../shared/toast/toast.context';
import '../auth.css';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c1.4-3.8 4.3-5.8 7.5-5.8s6.1 2 7.5 5.8" />
  </svg>
);
const IdIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="5.5" width="18" height="13" rx="2.4" />
    <circle cx="8.6" cy="11.5" r="1.8" />
    <path d="M5.6 16c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M13.5 10h5M13.5 13h5" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 6.5h18v11H3z" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
  </svg>
);
const EyeIcon = ({ off }) =>
  off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c5 0 8.7 3.4 10 7-.5 1.4-1.3 2.7-2.4 3.8M6.3 6.3C4 7.7 2.4 9.6 1 12c1.3 3.6 5 7 11 7 1.4 0 2.7-.2 3.9-.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 12c1.3-3.6 5-7 11-7s9.7 3.4 11 7c-1.3 3.6-5 7-11 7S2.3 15.6 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const validateRegisterForm = (values) => {
  const errors = {};

  if (!isRequired(values.name)) errors.name = 'El nombre es obligatorio.';
  if (!isRequired(values.dni)) errors.dni = 'El DNI es obligatorio.';
  else if (!isDni(values.dni)) errors.dni = 'Ingresá un DNI válido (7 u 8 dígitos).';
  if (!isRequired(values.email)) errors.email = 'El correo es obligatorio.';
  else if (!isEmail(values.email)) errors.email = 'Ingresá un correo válido.';
  if (!isRequired(values.password)) errors.password = 'La contraseña es obligatoria.';
  if (values.confirmPassword !== values.password)
    errors.confirmPassword = 'Las contraseñas deben coincidir.';

  return errors;
};

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { values, errors, submitting, setValue, handleChange, handleSubmit } = useForm({
    initialValues: { name: '', dni: '', email: '', password: '', confirmPassword: '' },
    validate: validateRegisterForm,
    onSubmit: async ({ name, dni, email, password }) => {
      try {
        // Registration no longer signs the user in: the account starts as
        // email-pending, so no session is persisted for unconfirmed users.
        await usersApi.register({
          name: name.trim(),
          dni,
          email: email.trim(),
          password,
          role: ROLES.CLIENTE,
        });
        navigate('/registro-pendiente', { state: { email }, replace: true });
      } catch (error) {
        showToast({
          variant: 'danger',
          message: error.message || 'No se pudo crear la cuenta.',
        });
      }
    },
  });

  return (
    <main className="auth-page">
      <div className="auth-theme-toggle">
        <ToggleTheme />
      </div>
      <div className="auth-grid">
        <aside className="auth-aside">
          <div className="auth-brand">
            <span className="auth-mark">
              <Scale size={48} />
            </span>
            <strong>LEGAL MANAGER</strong>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-box">
            <div className="auth-box__head">
              <span className="auth-eyebrow">Crear cuenta</span>
              <h1>Registro de usuario</h1>
              <p>Completá tus datos para empezar.</p>
            </div>

            <Form className="auth-form auth-form--register" onSubmit={handleSubmit} noValidate>
              <div className={`auth-field auth-field--wide ${errors.name ? 'has-error' : ''}`}>
                <label htmlFor="register-name">Nombre completo <span className="text-danger">*</span></label>
                <div className="auth-input">
                  <UserIcon />
                  <Form.Control
                    id="register-name"
                    name="name"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={values.name}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.name)}
                  />
                </div>
                {errors.name && <span className="auth-error">{errors.name}</span>}
              </div>

              <div className={`auth-field ${errors.dni ? 'has-error' : ''}`}>
                <label htmlFor="register-dni">DNI <span className="text-danger">*</span></label>
                <div className="auth-input">
                  <IdIcon />
                  <Form.Control
                    id="register-dni"
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 30123123"
                    value={values.dni}
                    onChange={(event) => setValue('dni', formatDni(event.target.value))}
                    aria-invalid={Boolean(errors.dni)}
                  />
                </div>
                {errors.dni && <span className="auth-error">{errors.dni}</span>}
              </div>

              <div className={`auth-field ${errors.email ? 'has-error' : ''}`}>
                <label htmlFor="register-email">Correo electrónico <span className="text-danger">*</span></label>
                <div className="auth-input">
                  <MailIcon />
                  <Form.Control
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="correo@gmail.com"
                    value={values.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                  />
                </div>
                {errors.email && <span className="auth-error">{errors.email}</span>}
              </div>

              <div className={`auth-field ${errors.password ? 'has-error' : ''}`}>
                <label htmlFor="register-password">Crear contraseña <span className="text-danger">*</span></label>
                <div className="auth-input">
                  <LockIcon />
                  <Form.Control
                    id="register-password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.password)}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label="Mostrar contraseña"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
                {errors.password && <span className="auth-error">{errors.password}</span>}
              </div>

              <div className={`auth-field ${errors.confirmPassword ? 'has-error' : ''}`}>
                <label htmlFor="register-confirm-password">Confirmar contraseña <span className="text-danger">*</span></label>
                <div className="auth-input">
                  <LockIcon />
                  <Form.Control
                    id="register-confirm-password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    type={showConfirm ? 'text' : 'password'}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowConfirm((previous) => !previous)}
                    aria-label="Mostrar contraseña"
                  >
                    <EyeIcon off={showConfirm} />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="auth-error">{errors.confirmPassword}</span>
                )}
              </div>

              <Button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? 'Creando…' : 'Crear usuario'}
              </Button>
            </Form>

            <p className="auth-switch-text">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="auth-link">
                Volver al acceso
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Register;
