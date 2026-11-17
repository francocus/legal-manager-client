import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { ONBOARDING_KEY } from '../../services/consts/storageKeys';
import './OnboardingModal.css';

const STEPS = [
  'Usá el menú superior para moverte entre Calendario, Turnos, Expedientes y Clientes.',
  'En el Calendario ves la agenda en vista semanal o mensual; desde Turnos podés pedir una cita o gestionar las existentes.',
  'Cada expediente guarda los datos de la causa, sus notas y los documentos asociados.',
  'Desde Mi perfil podés actualizar tus datos de contacto y, si sos abogado, tus especialidades y horarios de atención.',
  'Si diste de baja algo por error, recuperalo desde la Papelera sin perder su información.',
];

const readShouldShow = () => {
  try {
    return !localStorage.getItem(ONBOARDING_KEY);
  } catch (_error) {
    return false;
  }
};

const OnboardingModal = () => {
  const [show, setShow] = useState(readShouldShow);

  const handleClose = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (_error) {
      // Si no se puede persistir, se cierra igual para no bloquear al usuario.
    }
    setShow(false);
  };

  return (
    <Modal
      show={show}
      centered
      onHide={handleClose}
      dialogClassName="onboarding-modal__dialog"
      contentClassName="onboarding-modal__content"
    >
      <Modal.Header className="onboarding-modal__header" closeButton closeVariant="white">
        <Modal.Title>¡Bienvenido a Legal Manager!</Modal.Title>
      </Modal.Header>
      <Modal.Body className="onboarding-modal__body">
        <p>Estos son algunos puntos para empezar:</p>
        <ul>
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer className="onboarding-modal__footer">
        <Button type="button" className="cases-create" onClick={handleClose}>
          Empezar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OnboardingModal;
