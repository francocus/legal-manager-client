import { useEffect, useMemo } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { casesApi } from '../../../services/api/casesApi';
import { initialCaseForm } from '../newCase/NewCase.data';
import { CASE_STATUS_OPTIONS } from '../Cases.data';
import { useForm } from '../../../services/hooks/useForm';
import { isRequired } from '../../../services/validators/validators';
import { ROLES } from '../../../services/consts/roles';
import { useToast } from '../../../shared/toast/toast.context';

const buildInitialValues = (legalCase, currentUser) => ({
  ...initialCaseForm,
  ...(legalCase ?? {}),
  lawyerId:
    currentUser?.role === ROLES.ABOGADO
      ? String(currentUser.id)
      : String(legalCase?.lawyerId ?? ''),
});

const CaseDetails = ({
  legalCase,
  onEditCase,
  onFormClosed,
  clients = [],
  lawyers = [],
  currentUser,
}) => {
  const { showToast } = useToast();
  const initialValues = useMemo(
    () => buildInitialValues(legalCase, currentUser),
    [legalCase, currentUser],
  );

  const validateCaseForm = (values) => {
    const errors = {};
    const requiredFields = [
      'caseNumber',
      'title',
      'area',
      'startDate',
      'lastUpdate',
      'description',
      'clientId',
    ];

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

  const { values, errors, submitting, handleChange, reset, handleSubmit } = useForm({
    initialValues,
    validate: validateCaseForm,
    onSubmit: async (formValues) => {
      // PUT /case/{id} accepts only title/area/description/notes and the
      // status select is separate: PATCH /case/{id}/status. Ids are Guid
      // strings and the select speaks lowercase, so status goes normalized.
      const statusChanged =
        String(formValues.status ?? '').toLowerCase() !==
        String(initialValues.status ?? '').toLowerCase();
      const payload = {
        ...formValues,
        lawyerId:
          currentUser?.role === ROLES.ABOGADO ? currentUser.id : formValues.lawyerId,
      };

      try {
        if (statusChanged) {
          await casesApi.setStatus(legalCase.id, String(formValues.status ?? '').toLowerCase());
        }
        await onEditCase?.(payload);
        showToast({ variant: 'success', message: 'Expediente actualizado correctamente.' });
        onFormClosed?.();
      } catch (error) {
        showToast({
          variant: 'danger',
          message: error.message || 'No se pudo actualizar el expediente.',
        });
      }
    },
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

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
          <Modal.Title>Editar expediente</Modal.Title>
        </div>
      </Modal.Header>

      <Form className="cases-form text-white" onSubmit={handleSubmit} noValidate>
        <Modal.Body className="cases-modal__body">
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3" controlId="caseNumber">
                <Form.Label>Número de expediente</Form.Label>
                <Form.Control
                  name="caseNumber"
                  value={values.caseNumber ?? ''}
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
                <Form.Label>Título</Form.Label>
                <Form.Control
                  name="title"
                  value={values.title ?? ''}
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
                <Form.Label>Área</Form.Label>
                <Form.Control
                  name="area"
                  value={values.area ?? ''}
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
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  name="status"
                  value={String(values.status ?? '').toLowerCase() || 'activo'}
                  onChange={handleChange}
                >
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
                  value={values.startDate ?? ''}
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
                  value={values.lastUpdate ?? ''}
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
                  value={values.description ?? ''}
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
                  value={values.notes ?? ''}
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
                <Form.Label>Cliente</Form.Label>
                <Form.Select
                  name="clientId"
                  value={values.clientId ? String(values.clientId) : ''}
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
                <Form.Label>Abogado</Form.Label>
                {currentUser?.role === ROLES.ABOGADO ? (
                  <Form.Control value={currentUser?.name ?? ''} readOnly />
                ) : (
                  <>
                    <Form.Select
                      name="lawyerId"
                      value={values.lawyerId ? String(values.lawyerId) : ''}
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
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CaseDetails;
