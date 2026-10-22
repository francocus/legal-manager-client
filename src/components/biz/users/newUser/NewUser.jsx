import { useMemo } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { initialUserForm } from './NewUser.data';
import { useForm } from '../../../services/hooks/useForm';
import { formatDni, isDni, isEmail, isRequired } from '../../../services/validators/validators';
import { ROLE_OPTIONS } from '../../../services/consts/roles';
import { useToast } from '../../../shared/toast/toast.context';

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const validateUserForm = (values) => {
  const errors = {};

  if (!isRequired(values.name)) errors.name = 'El nombre es obligatorio.';
  if (!isRequired(values.dni)) errors.dni = 'El DNI es obligatorio.';
  else if (!isDni(values.dni)) errors.dni = 'Ingresá un DNI válido (7 u 8 dígitos).';
  if (!isRequired(values.email)) errors.email = 'El correo es obligatorio.';
  else if (!isEmail(values.email)) errors.email = 'Ingresá un correo válido.';
  if (!isRequired(values.password)) errors.password = 'La contraseña es obligatoria.';

  return errors;
};

const NewUser = ({ onAddUser, onFormClosed, fixedRole, entityLabel = 'usuario' }) => {
  const { showToast } = useToast();
  const initialValues = useMemo(
    () => ({ ...initialUserForm, ...(fixedRole ? { role: fixedRole } : {}) }),
    [fixedRole],
  );

  const { values, errors, submitting, setValue, handleChange, handleSubmit } = useForm({
    initialValues,
    validate: validateUserForm,
    onSubmit: async (formValues) => {
      try {
        await onAddUser?.(formValues);
        showToast({
          variant: 'success',
          message: `${capitalize(entityLabel)} creado correctamente.`,
        });
        onFormClosed?.();
      } catch (error) {
        showToast({
          variant: 'danger',
          message: error.message || `No se pudo crear el ${entityLabel}.`,
        });
      }
    },
  });

  const handleGoBack = () => {
    onFormClosed?.();
  };

  return (
    <Modal
      show
      centered
      backdrop="static"
      onHide={handleGoBack}
      dialogClassName="users-modal__dialog"
      contentClassName="users-modal__content"
      backdropClassName="users-modal__backdrop"
    >
      <Modal.Header className="users-modal__header" closeButton closeVariant="white">
        <div>
          <p className="users-modal__eyebrow">Administración de usuarios</p>
          <Modal.Title>Nuevo {entityLabel}</Modal.Title>
        </div>
      </Modal.Header>

      <Form className="users-form text-white" autoComplete="off" onSubmit={handleSubmit} noValidate>
        <Modal.Body className="users-modal__body">
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3" controlId="name">
                <Form.Label>Nombre completo</Form.Label>
                <Form.Control
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.name)}
                  type="text"
                  placeholder="Ingresar nombre completo"
                />
                {errors.name ? <Form.Text className="text-danger">{errors.name}</Form.Text> : null}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="dni">
                <Form.Label>DNI</Form.Label>
                <Form.Control
                  name="dni"
                  value={values.dni}
                  onChange={(event) => setValue('dni', formatDni(event.target.value))}
                  isInvalid={Boolean(errors.dni)}
                  type="text"
                  inputMode="numeric"
                  placeholder="Ingresar DNI"
                />
                {errors.dni ? <Form.Text className="text-danger">{errors.dni}</Form.Text> : null}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Correo electrónico</Form.Label>
                <Form.Control
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.email)}
                  type="email"
                  placeholder="Ingresar correo"
                  autoComplete="off"
                />
                {errors.email ? (
                  <Form.Text className="text-danger">{errors.email}</Form.Text>
                ) : null}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={fixedRole ? 12 : 6}>
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  isInvalid={Boolean(errors.password)}
                  type="password"
                  placeholder="Ingresar contraseña"
                  autoComplete="off"
                />
                {errors.password ? (
                  <Form.Text className="text-danger">{errors.password}</Form.Text>
                ) : null}
              </Form.Group>
            </Col>
            {!fixedRole ? (
              <Col md={6}>
                <Form.Group className="mb-3" controlId="role">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select name="role" value={values.role} onChange={handleChange}>
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            ) : null}
          </Row>

          <Row>
            <Col md={12}>
              <Form.Check
                checked={values.active}
                onChange={handleChange}
                type="switch"
                id="active"
                name="active"
                label="Usuario activo"
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="users-modal__footer">
          <Button
            variant="secondary"
            onClick={handleGoBack}
            type="button"
            disabled={submitting}
            className="users-form__button users-form__button--secondary"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            className="users-form__button users-form__button--primary"
          >
            {submitting ? 'Agregando...' : `Agregar ${entityLabel}`}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewUser;
