import { useContext, useEffect, useMemo } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { initialUserForm } from '../newUser/NewUser.data';
import { useForm } from '../../../services/hooks/useForm';
import { formatDni, isDni, isEmail, isRequired } from '../../../services/validators/validators';
import { ROLE_OPTIONS, ROLES } from '../../../services/consts/roles';
import { AuthenticationContext } from '../../../services/auth/authentication.context';
import { usersApi } from '../../../services/api/usersApi';
import { useToast } from '../../../shared/toast/toast.context';

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const specialtiesToText = (value) =>
  Array.isArray(value) ? value.join(', ') : String(value ?? '');

const textToSpecialties = (text) => {
  const list = String(text ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return list.length > 0 ? list : undefined;
};

const validateUserForm = (values) => {
  const errors = {};

  if (!isRequired(values.name)) errors.name = 'El nombre es obligatorio.';
  if (!isRequired(values.dni)) errors.dni = 'El DNI es obligatorio.';
  else if (!isDni(values.dni)) errors.dni = 'Ingresá un DNI válido (7 u 8 dígitos).';
  if (!isRequired(values.email)) errors.email = 'El correo es obligatorio.';
  else if (!isEmail(values.email)) errors.email = 'Ingresá un correo válido.';

  return errors;
};

const UserDetails = ({ user, onEditUser, onFormClosed, fixedRole, entityLabel = 'usuario' }) => {
  const { showToast } = useToast();
  const { user: currentUser } = useContext(AuthenticationContext);

  const canEditRole =
    !fixedRole && user?.role !== ROLES.SYSADMIN && currentUser?.role === ROLES.SYSADMIN;

  const initialValues = useMemo(
    () => ({
      ...initialUserForm,
      ...(user ?? {}),
      specialties: specialtiesToText(user?.specialties),
      ...(fixedRole ? { role: fixedRole } : {}),
    }),
    [user, fixedRole],
  );

  const validateForm = (formValues) => {
    const nextErrors = validateUserForm(formValues);

    if (
      canEditRole &&
      formValues.role !== user?.role &&
      formValues.role === ROLES.ABOGADO &&
      !isRequired(formValues.barNumber)
    ) {
      nextErrors.barNumber = 'Este campo es obligatorio.';
    }

    return nextErrors;
  };

  const { values, errors, submitting, setValue, handleChange, reset, handleSubmit } = useForm({
    initialValues,
    validate: validateForm,
    onSubmit: async (formValues) => {
      try {
        if (canEditRole && formValues.role !== user?.role) {
          await usersApi.changeRole(formValues.id, {
            role: formValues.role,
            barNumber: formValues.barNumber || null,
            specialties: textToSpecialties(formValues.specialties) ?? null,
          });
        }

        await onEditUser?.(formValues);
        showToast({
          variant: 'success',
          message: `${capitalize(entityLabel)} actualizado correctamente.`,
        });
        onFormClosed?.();
      } catch (error) {
        showToast({
          variant: 'danger',
          message: error.message || `No se pudo actualizar el ${entityLabel}.`,
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
          <Modal.Title>Editar {entityLabel}</Modal.Title>
        </div>
      </Modal.Header>

      <Form className="users-form text-white" onSubmit={handleSubmit} noValidate>
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
                  type="password"
                  placeholder="Dejar vacío si no cambia"
                />
              </Form.Group>
            </Col>
            {!fixedRole ? (
              <Col md={6}>
                <Form.Group className="mb-3" controlId="role">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="role"
                    value={values.role}
                    onChange={handleChange}
                    disabled={!canEditRole}
                  >
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

          {values.role === ROLES.ABOGADO ? (
            <>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="barNumber">
                    <Form.Label>Matrícula</Form.Label>
                    <Form.Control
                      name="barNumber"
                      value={values.barNumber}
                      onChange={handleChange}
                      isInvalid={Boolean(errors.barNumber)}
                      type="text"
                      placeholder="Ingresar matrícula"
                    />
                    {errors.barNumber ? (
                      <Form.Text className="text-danger">{errors.barNumber}</Form.Text>
                    ) : null}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="phone">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control
                      name="phone"
                      value={values.phone}
                      onChange={handleChange}
                      type="tel"
                      placeholder="Ej. +54 9 11 1234-5678"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3" controlId="specialties">
                    <Form.Label>Especialidades (separadas por coma)</Form.Label>
                    <Form.Control
                      name="specialties"
                      value={values.specialties}
                      onChange={handleChange}
                      type="text"
                      placeholder="Ej. Civil, Comercial, Laboral"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          ) : null}

          {values.role === ROLES.CLIENTE ? (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="phone">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    type="tel"
                    placeholder="Ej. +54 9 11 1234-5678"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="address">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control
                    name="address"
                    value={values.address}
                    onChange={handleChange}
                    type="text"
                    placeholder="Ej. San Martín 123"
                  />
                </Form.Group>
              </Col>
            </Row>
          ) : null}
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
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UserDetails;
