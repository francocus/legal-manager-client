import { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { AuthenticationContext } from '../../services/auth/authentication.context.jsx';
import ToggleTheme from '../../shared/toggleTheme/ToggleTheme.jsx';
import { Scale } from 'lucide-react';
import { useForm } from '../../services/hooks/useForm';
import { isEmail, isRequired } from '../../services/validators/validators';
import { SESSION_EXPIRED_KEY } from '../../services/consts/storageKeys';
import { useToast } from '../../shared/toast/toast.context';
import '../auth.css';

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

const validateLoginForm = (values) => {
  const errors = {};

  if (!isRequired(values.email)) errors.email = 'El correo es obligatorio.';
  else if (!isEmail(values.email)) errors.email = 'Ingresá un correo válido.';
  if (!isRequired(values.password)) errors.password = 'La contraseña es obligatoria.';

  return errors;
};

const Login = () => {
  const { handleUserLogin } = useContext(AuthenticationContext);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Arrived here after a session-expiry redirect: show the notice once and
  // clear the flag so it does not replay on regular navigation.
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_EXPIRED_KEY)) {
      sessionStorage.removeItem(SESSION_EXPIRED_KEY);
      showToast({
        variant: 'warning',
        message: 'Tu sesión expiró. Iniciá sesión de nuevo.',
      });
    }
  }, [showToast]);

  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    validate: validateLoginForm,
    onSubmit: async ({ email, password }) => {
      try {
        await handleUserLogin({ email: email.trim(), password });
        navigate('/dashboard', { replace: true });
      } catch (error) {
        showToast({
          variant: 'danger',
          message: error.message || 'No se pudo iniciar sesión.',
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
              <span className="auth-eyebrow">Bienvenido</span>
              <h1>Iniciar sesión</h1>
              <p>Ingresá tus credenciales para continuar.</p>
            </div>

            <Form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className={`auth-field ${errors.email ? 'has-error' : ''}`}>
                <label htmlFor="login-email">Correo electrónico <span className="text-danger">*</span></label>
                <div className="auth-input">
                  <MailIcon />
                  <Form.Control
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="nombre@estudio.com"
                    value={values.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                  />
                </div>
                {errors.email && <span className="auth-error">{errors.email}</span>}
              </div>

              <div className={`auth-field ${errors.password ? 'has-error' : ''}`}>
                <label htmlFor="login-password">Contraseña <span className="text-danger">*</span></label>
                <div className="auth-input">
                  <LockIcon />
                  <Form.Control
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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

              <Button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? 'Ingresando…' : 'Iniciar sesión'}
              </Button>
            </Form>

            <p className="auth-switch-text">
              ¿Olvidaste tu contraseña?{' '}
              <Link to="/recuperar-contrasena" className="auth-link">
                Recuperar contraseña
              </Link>
            </p>

            <p className="auth-switch-text">
              ¿No tenés cuenta?{' '}
              <Link to="/register" className="auth-link">
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
