import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

const ConfirmDialog = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  itemName,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  confirmClassName,
}) => {
  const [working, setWorking] = useState(false);

  const handleConfirm = async () => {
    try {
      setWorking(true);
      await onConfirm?.();
      onHide?.();
    } catch (_error) {
      // El llamador es responsable de informar el error (por ejemplo, con un toast).
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal
      show={show}
      centered
      backdrop="static"
      onHide={working ? undefined : onHide}
      dialogClassName="delete-modal__dialog"
      contentClassName="delete-modal__content"
    >
      <Modal.Header className="delete-modal__header" closeButton closeVariant="white">
        <Modal.Title className="delete-modal__title">{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body className="delete-modal__body">
        {message} <b>{itemName}</b>?
      </Modal.Body>

      <Modal.Footer className="delete-modal__footer">
        <Button
          variant="secondary"
          className="btn btn-secondary"
          onClick={onHide}
          disabled={working}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          className={confirmClassName ?? 'btn delete-modal__danger'}
          onClick={handleConfirm}
          disabled={working}
        >
          {working ? 'Procesando...' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDialog;
