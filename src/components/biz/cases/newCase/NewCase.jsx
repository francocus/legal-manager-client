import { useMemo } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { initialCaseForm } from './NewCase.data';
import { CASE_STATUS_OPTIONS } from '../Cases.data';
import { useForm } from '../../../services/hooks/useForm';
import { isRequired } from '../../../services/validators/validators';
import { ROLES } from '../../../services/consts/roles';
import { useToast } from '../../../shared/toast/toast.context';

const buildInitialValues = (currentUser) => ({
  ...initialCaseForm,
  lawyerId: currentUser?.role === ROLES.ABOGADO ? String(currentUser.id) : '',
});

const NewCase = ({ onAddCase, onFormClosed, clients = [], lawyers = [], currentUser }) => {
  const { showToast } = useToast();
  const initialValues = useMemo(() => buildInitialValues(currentUser), [currentUser]);

  const validateCaseForm = (values) => {
    const errors = {};
    const requiredFields = ['caseNumber', 'title', 'area', 'startDate', 'lastUpdate', 'clientId'];

    if (currentUser?.role !== ROLES.ABOGADO) {
      requiredFields.push('lawyerId');
    }

    requiredFields.forEach((field) => {
      if (!isRequired(values[field])) {
        errors[field] = 'Este campo es obligatorio.';
      }
    });

    return errors;
  };

  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    initialValues,
    validate: validateCaseForm,
    onSubmit: async (formValues) => {
      // Ids are Guid strings: clientId/lawyerId travel as strings.
      const payload = {
        ...formValues,
        lawyerId: currentUser?.role === ROLES.ABOGADO ? currentUser.id : formValues.lawyerId,
      };

      try {
        await onAddCase?.(payload);
        showToast({ variant: 'success', message: 'Expediente creado correctamente.' });
        onFormClosed?.();
      } catch (error) {
        showToast({
          variant: 'danger',
          message: error.message || 'No se pudo crear el expediente.',
        });
      }
    },
  });

  const handleGoBack = () => {
    onFormClosed?.();
  };

  const fieldError = (field) =>
    errors[field] ? <Form.Text className="text-danger">{errors[field]}</Form.Text> : null;

  return (
    <Modal
      show
      centered
      backdrop="static"
      onHide={handleGoBack}
      dialogClassName="cases-modal__dialog"
      contentClassName="cases-modal__content"
      backdropClassName="cases-modal__backdrop"
    >
      <Modal.Header className="cases-modal__header" closeButton closeVariant="white">
        <div>
          <p className="cases-modal__eyebrow">Administración de expedientes</p>
          <Modal.Title>Nuevo expediente</Modal.Title>
        </div>
      </Modal.Header>

      <Form className="cases-form text-white" onSubmit={handleSubmit} noValidate>
        <Modal.Body className="cases-modal__body">
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3" controlId="caseNumber">
                <Form.Label>Número de expediente <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="caseNumber"
                  value={values.caseNumber}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.caseNumber)}
                  type="text"
                  placeholder="Ingresar número de expediente"
                />
                {fieldError('caseNumber')}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3" controlId="title">
                <Form.Label>Título <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="title"
                  value={values.title}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.title)}
                  type="text"
                  placeholder="Ingresar título"
                />
                {fieldError('title')}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="area">
                <Form.Label>Área <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="area"
                  value={values.area}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.area)}
                  type="text"
                  placeholder="Ingresar área"
                />
                {fieldError('area')}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="status">
                <Form.Label>Estado <span className="text-danger">*</span></Form.Label>
                <Form.Select name="status" value={values.status} onChange={handleChange}>
                  {CASE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="startDate">
                <Form.Label>Fecha de inicio</Form.Label>
                <Form.Control
                  name="startDate"
                  value={values.startDate}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.startDate)}
                  type="date"
                />
                {fieldError('startDate')}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="lastUpdate">
                <Form.Label>Última actualización</Form.Label>
                <Form.Control
                  name="lastUpdate"
                  value={values.lastUpdate}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.lastUpdate)}
                  type="date"
                />
                {fieldError('lastUpdate')}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3" controlId="description">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.description)}
                  as="textarea"
                  rows={3}
                  placeholder="Ingresar descripción"
                />
                {fieldError('description')}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3" controlId="notes">
                <Form.Label>Notas</Form.Label>
                <Form.Control
                  name="notes"
                  value={values.notes}
                  onChange={handleChange}
                  as="textarea"
                  rows={2}
                  placeholder="Ingresar notas opcionales"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="clientId">
                <Form.Label>Cliente <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="clientId"
                  value={values.clientId}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.clientId)}
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.dni}
                    </option>
                  ))}
                </Form.Select>
                {fieldError('clientId')}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3" controlId="lawyerId">
                <Form.Label>Abogado <span className="text-danger">*</span></Form.Label>
                {currentUser?.role === ROLES.ABOGADO ? (
                  <Form.Control value={currentUser?.name ?? ''} readOnly />
                ) : (
                  <>
                    <Form.Select
                      name="lawyerId"
                      value={values.lawyerId}
                      onChange={handleChange}
                      isInvalid={Boolean(errors.lawyerId)}
                    >
                      <option value="">Seleccionar abogado</option>
                      {lawyers.map((lawyer) => (
                        <option key={lawyer.id} value={lawyer.id}>
                          {lawyer.name} - {lawyer.dni}
                        </option>
                      ))}
                    </Form.Select>
                    {fieldError('lawyerId')}
                  </>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="cases-modal__footer">
          <Button
            variant="secondary"
            onClick={handleGoBack}
            type="button"
            disabled={submitting}
            className="cases-form__button cases-form__button--secondary"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            className="cases-form__button cases-form__button--primary"
          >
            {submitting ? 'Agregando...' : 'Agregar expediente'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewCase;
