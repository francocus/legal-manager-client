import { Toast, ToastContainer as BootstrapToastContainer } from 'react-bootstrap';
import './Toast.css';

const DARK_VARIANTS = ['success', 'danger', 'primary', 'secondary', 'dark'];

const ToastContainer = ({ toasts, onDismiss }) => (
  <BootstrapToastContainer position="top-end" className="app-toast-container">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        bg={toast.variant}
        autohide={false}
        className={`app-toast${DARK_VARIANTS.includes(toast.variant) ? ' text-white' : ''}`}
        onClose={() => onDismiss(toast.id)}
      >
        {toast.title ? (
          <Toast.Header closeButton closeVariant="white">
            <strong className="me-auto">{toast.title}</strong>
          </Toast.Header>
        ) : null}
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>
    ))}
  </BootstrapToastContainer>
);

export default ToastContainer;
