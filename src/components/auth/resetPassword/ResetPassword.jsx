import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router';
import ToggleTheme from '../../shared/toggleTheme/ToggleTheme.jsx';
import { Scale } from 'lucide-react';
import { useForm } from '../../services/hooks/useForm';
import { isRequired } from '../../services/validators/validators';
import { accountApi } from '../../services/api/accountApi';
import { useToast } from '../../shared/toast/toast.context';
import '../auth.css';

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

const validateResetForm = (values) => {
  const errors = {};

  if (!isRequired(values.newPassword)) errors.newPassword = 'Este campo es obligatorio.';
  if (!isRequired(values.repeatPassword)) errors.repeatPassword = 'Este campo es obligatorio.';
  else if (values.repeatPassword !== values.newPassword)
    errors.repeatPassword = 'Las contraseñas no coinciden.';

  return errors;
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState('form'); // 'form' | 'success'
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    initialValues: { newPassword: '', repeatPassword: '' },
    validate: validateResetForm,
    onSubmit: async ({ newPassword }) => {
      try {
        await accountApi.resetPassword(token, newPassword);
        setStatus('success');
      } catch (error) {
        setApiError(error.message || 'No se pudo restablecer la contraseña.');
        showToast({
          variant: 'danger',
          message: error.message || 'No se pudo restablecer la contraseña.',
        });
      }
    },
  });

  // Success lingers four seconds before going back to login; the timer is
  // cancelled on unmount so a quick click does not double-navigate.
  useEffect(() => {
    if (status !== 'success') return undefined;

    const timer = setTimeout(() => navigate('/login', { replace: true }), 4000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const passwordInputType = showPassword ? 'text' : 'password';

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
          {!token ? (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Recuperar acceso</span>
                <h2>Enlace inválido</h2>
                <p>El enlace es inválido o expiró. Pedí uno nuevo.</p>
              </div>
              <Button className="auth-submit" onClick={() => navigate('/recuperar-contrasena')}>
                Ir a recuperar contraseña
              </Button>
            </div>
          ) : status === 'success' ? (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Recuperar acceso</span>
                <h2>Contraseña restablecida</h2>
                <p>Tu contraseña quedó restablecida. Ya podés iniciar sesión.</p>
              </div>
              <Button className="auth-submit" onClick={() => navigate('/login', { replace: true })}>
                Iniciar sesión
              </Button>
            </div>
          ) : (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Recuperar acceso</span>
                <h2>Restablecer contraseña</h2>
              </div>

              <Form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className={`auth-field ${errors.newPassword ? 'has-error' : ''}`}>
                  <label htmlFor="reset-password">Nueva contraseña</label>
                  <div className="auth-input">
                    <LockIcon />
                    <Form.Control
                      id="reset-password"
                      name="newPassword"
                      type={passwordInputType}
                      placeholder="••••••••"
                      value={values.newPassword}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.newPassword)}
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
                  {errors.newPassword && <span className="auth-error">{errors.newPassword}</span>}
                </div>

                <div className={`auth-field ${errors.repeatPassword ? 'has-error' : ''}`}>
                  <label htmlFor="reset-repeat-password">Repetir contraseña</label>
                  <div className="auth-input">
                    <LockIcon />
                    <Form.Control
                      id="reset-repeat-password"
                      name="repeatPassword"
                      type={passwordInputType}
                      placeholder="••••••••"
                      value={values.repeatPassword}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.repeatPassword)}
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
                  {errors.repeatPassword && (
                    <span className="auth-error">{errors.repeatPassword}</span>
                  )}
                </div>

                <Button className="auth-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Restableciendo…' : 'Restablecer contraseña'}
                </Button>
              </Form>

              {apiError && (
                <>
                  <p className="auth-error">{apiError}</p>
                  <p className="auth-switch-text">
                    <Link to="/recuperar-contrasena" className="auth-link">
                      Pedir otro correo
                    </Link>
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ResetPassword;
