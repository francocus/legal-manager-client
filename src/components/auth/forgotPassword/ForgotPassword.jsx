import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import ToggleTheme from '../../shared/toggleTheme/ToggleTheme.jsx';
import { Scale } from 'lucide-react';
import { useForm } from '../../services/hooks/useForm';
import { isEmail, isRequired } from '../../services/validators/validators';
import { accountApi } from '../../services/api/accountApi';
import { useToast } from '../../shared/toast/toast.context';
import '../auth.css';

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 6.5h18v11H3z" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const validateForgotForm = (values) => {
  const errors = {};

  if (!isRequired(values.email)) errors.email = 'Este campo es obligatorio.';
  else if (!isEmail(values.email)) errors.email = 'Ingresá un email válido.';

  return errors;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [view, setView] = useState('form'); // 'form' | 'sent'

  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    initialValues: { email: '' },
    validate: validateForgotForm,
    onSubmit: async ({ email }) => {
      try {
        await accountApi.forgotPassword(email.trim());
        setView('sent');
      } catch (error) {
        showToast({
          variant: 'danger',
          message: error.message || 'No se pudo enviar el correo de recuperación.',
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
          {view === 'sent' ? (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Recuperar acceso</span>
                <h2>Revisá tu correo</h2>
                <p>
                  Te enviamos el enlace para restablecer tu contraseña. El enlace vence en 1 hora.
                </p>
                <p>(Revisá también la carpeta de spam.)</p>
              </div>
              <Button className="auth-submit" onClick={() => navigate('/login')}>
                Volver al inicio de sesión
              </Button>
            </div>
          ) : (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Recuperar acceso</span>
                <h2>Recuperar contraseña</h2>
                <p>Ingresá el email de tu cuenta y te enviamos un enlace para restablecerla.</p>
              </div>

              <Form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className={`auth-field ${errors.email ? 'has-error' : ''}`}>
                  <label htmlFor="forgot-email">Email</label>
                  <div className="auth-input">
                    <MailIcon />
                    <Form.Control
                      id="forgot-email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={values.email}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.email)}
                    />
                  </div>
                  {errors.email && <span className="auth-error">{errors.email}</span>}
                </div>

                <Button className="auth-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Enviando…' : 'Enviar correo de recuperación'}
                </Button>
              </Form>

              <p className="auth-switch-text">
                ¿Recordaste tu contraseña?{' '}
                <Link to="/login" className="auth-link">
                  Volver al inicio de sesión
                </Link>
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ForgotPassword;
