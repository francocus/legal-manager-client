import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Link, Navigate, useLocation } from 'react-router';
import { accountApi } from '../../services/api/accountApi';
import { useToast } from '../../shared/toast/toast.context';

const RegisterPending = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);

  const email = location.state?.email;

  const handleResend = async () => {
    try {
      setResending(true);
      const response = await accountApi.resendConfirmation(email);
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

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="auth-box auth-box--register">
      <div className="auth-box__head">
        <span className="auth-eyebrow">Crear cuenta</span>
        <h2>Confirmá tu email</h2>
        <p>
          Te registramos en Legal Manager. Te enviamos un correo a <strong>{email}</strong> para
          confirmar tu cuenta. El enlace vence en 24 horas.
        </p>
        <p>(Revisá también la carpeta de spam.)</p>
      </div>

      <Form className="auth-form" onSubmit={handleResend} noValidate>
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
  );
};

export default RegisterPending;
