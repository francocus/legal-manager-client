import { useEffect, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router';
import ToggleTheme from '../../shared/toggleTheme/ToggleTheme.jsx';
import { Scale } from 'lucide-react';
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

const INVALID_LINK_TEXT = 'El enlace es inválido o expiró. Pedí uno nuevo.';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [status, setStatus] = useState(token ? 'confirming' : 'invalid'); // 'confirming' | 'success' | 'invalid'
  const [apiError, setApiError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendError, setResendError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return undefined;

    // Ignore late responses after unmount so this effect never sets state
    // on a screen the user already left.
    let active = true;

    accountApi
      .confirmEmail(token)
      .then(() => {
        if (active) setStatus('success');
      })
      .catch((error) => {
        if (!active) return;
        setApiError(error.message || INVALID_LINK_TEXT);
        setStatus('invalid');
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Success lingers four seconds before going back to login; the timer is
  // cancelled on unmount so a quick click does not double-navigate.
  useEffect(() => {
    if (status !== 'success') return undefined;

    const timer = setTimeout(() => navigate('/login', { replace: true }), 4000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const handleResend = async (event) => {
    event.preventDefault();

    if (!isRequired(resendEmail) || !isEmail(resendEmail)) {
      setResendError('Ingresá un email válido.');
      return;
    }

    setResendError('');

    try {
      setResending(true);
      const response = await accountApi.resendConfirmation(resendEmail.trim());
      showToast({
        variant: 'success',
        message: response?.message ?? 'Si tu cuenta sigue pendiente, te enviamos uno nuevo.',
      });
    } catch (error) {
      showToast({
        variant: 'danger',
        message: error.message || 'No se pudo enviar el correo.',
      });
    } finally {
      setResending(false);
    }
  };

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
          {status === 'confirming' ? (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Activar cuenta</span>
                <h2>Confirmar email</h2>
                <p>Confirmando tu email…</p>
              </div>
              <div className="d-flex justify-content-center">
                <Spinner animation="border" size="sm">
                  <span className="visually-hidden">Cargando…</span>
                </Spinner>
              </div>
            </div>
          ) : status === 'success' ? (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Activar cuenta</span>
                <h2>Email confirmado</h2>
                <p>Tu email quedó confirmado. Ya podés iniciar sesión.</p>
              </div>
              <Button className="auth-submit" onClick={() => navigate('/login', { replace: true })}>
                Iniciar sesión
              </Button>
            </div>
          ) : (
            <div className="auth-box">
              <div className="auth-box__head">
                <span className="auth-eyebrow">Activar cuenta</span>
                <h2>Enlace inválido</h2>
                <p>{apiError || INVALID_LINK_TEXT}</p>
              </div>

              <Form className="auth-form" onSubmit={handleResend} noValidate>
                <div className={`auth-field ${resendError ? 'has-error' : ''}`}>
                  <label htmlFor="confirm-resend-email">Email</label>
                  <div className="auth-input">
                    <MailIcon />
                    <Form.Control
                      id="confirm-resend-email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={resendEmail}
                      onChange={(event) => setResendEmail(event.target.value)}
                      aria-invalid={Boolean(resendError)}
                    />
                  </div>
                  {resendError && <span className="auth-error">{resendError}</span>}
                </div>

                <Button className="auth-submit" type="submit" disabled={resending}>
                  {resending ? 'Enviando…' : 'Reenviar email'}
                </Button>
              </Form>

              <p className="auth-switch-text">
                <Link to="/login" className="auth-link">
                  Ir al inicio de sesión
                </Link>
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ConfirmEmail;
