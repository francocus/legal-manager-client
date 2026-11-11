# Auditoría Integral y Conformidad Frente al Esquema del TIF

Este documento registra la comprobación exhaustiva del código fuente del frontend (`legal-manager-client`) contra el documento oficial de especificaciones: **"Plantilla TIF - Esquema de Ajustes"** (`plantilla TIF - Esquema Ajustes.docx.pdf`).

---

## 1. Matriz de Comprobación: Reglas de Negocio del TIF

| Regla de Negocio (Documento TIF) | Estado Front | Implementación en Frontend |
|---|---|---|
| **Baja lógica general**: Ningún registro se elimina físicamente; toda baja es lógica. | **Conforme** | Las eliminaciones en todos los módulos (usuarios, clientes, turnos, documentos) llaman a sus respectivos endpoints `DELETE`, delegando al backend la baja lógica (`Active = false`) y capturando errores con mensajes descriptivos. |
| **Expedientes cerrados inmutables**: "Un expediente cerrado no puede modificarse ni reabrirse; al cerrarse, se registra automáticamente su fecha de cierre." | **Conforme** | `CasePage.jsx` oculta el botón "Editar expediente", deshabilita el selector de cambio de estado cuando `isClosed` con leyenda explicativa, bloquea la alteración de abogados y muestra `Fecha de cierre` (`closingDate`) en la ficha general. |
| **Abogado mínimo por caso**: "Un expediente debe tener siempre al menos un abogado asignado; no puede quitarse el último abogado responsable." | **Conforme** | En `CasePage.jsx`, el botón "Quitar" del listado de abogados asignados se deshabilita si `lawyerIds.length <= 1`, con tooltip explicativo. El backend además cuenta con su validación homóloga. |
| **Conflicto de agenda**: "No puede haber dos turnos activos para el mismo abogado en la misma fecha y horario." | **Conforme** | `NewAppointment.jsx` consulta `appointmentsApi.getAvailability` en tiempo real para listar únicamente slots libres y valida contra citas existentes. |
| **Turno Finalizado calculado**: "Un turno confirmado cuya fecha y hora ya transcurrieron se considera Finalizado (se calcula automáticamente, no se persiste como tal)." | **Conforme** | `Appointments.data.js` (`mapAppointment`) normaliza el estado tomando `effectiveStatus ?? status`, reflejando visualmente el badge "Finalizado" en turnos pasados. |
| **Herencia de área en turnos**: "Un turno asociado a un expediente hereda el área de ese expediente; si no está asociado, registra su propia área." | **Conforme** | En `NewAppointment.jsx`, al vincular un expediente el turno hereda automáticamente el área del caso (`selectedCase.area`) y muestra el indicador informativo; si no se asocia expediente, se habilita el campo editable para ingresar el área legal propia. |
| **Asociación opcional turno–expediente**: "Un turno puede asociarse a un expediente de forma opcional." | **Conforme** | `NewAppointment.jsx` incluye el selector opcional con opción *"Sin expediente asociado"*, filtrando expedientes pertinentes y enviando `caseId` solo si fue seleccionado. |
| **Descripción y notas opcionales en expediente**: "La descripción y las notas del expediente son opcionales." | **Conforme** | En `NewCase.jsx` y `CaseDetails.jsx`, `description` y `notes` son campos no obligatorios en el formulario y en la validación. |
| **Teléfono del abogado visible para clientes**: "El teléfono del abogado es visible para sus clientes; el cliente registra domicilio y teléfono de forma opcional." | **Conforme** | `CasePage.jsx` renderiza el teléfono del abogado en la lista de profesionales asignados (`• Tel: ...`). `Profile.jsx` permite a los clientes ingresar y editar teléfono y domicilio, y a los abogados editar su teléfono. |
| **Unicidad de Email, DNI y CaseNumber**: Deben ser únicos en el sistema. | **Conforme** | El frontend valida formatos (DNI 7 u 8 dígitos, formato de correo) y el backend garantiza unicidad arrojando `Conflict (409)`, que el frontend captura y muestra en Toasts informativos. |
| **Restricción de baja con dependencias**: "Un usuario no puede darse de baja si tiene expedientes o turnos activos; un expediente no puede darse de baja si tiene turnos activos." | **Conforme** | Toda operación de baja lógica presenta diálogo de confirmación previo y, en caso de conflicto por dependencias activas, el backend rechaza la baja y el frontend notifica la causa exacta al usuario mediante Toasts de alerta. |
| **Resumen del expediente con IA y flujo de revisión**: El resumen se genera a partir de datos del caso, queda en borrador y requiere aprobación o descarte por un abogado. | **Conforme** | `CaseDocuments.jsx` dispone de la generación con IA (`POST /document/case/:id/generate-summary`), previsualización del borrador en PDF y botones para Aprobar (`PATCH /approve`) o Descartar (`PATCH /discard`), mostrando el badge distintivo "IA". Solo abogados/administradores pueden revisar. |
| **Restricciones de formato y tamaño de documentos**: "Solo se aceptan documentos en formato PDF, con un tamaño máximo de 10 MB por archivo." | **Conforme** | Validado en `CaseDocuments.jsx` previo al envío (`application/pdf`, `.pdf`, `<= 10 MB`), rechazando otros tipos de archivo o pesos superiores con advertencia visual. |
| **Bloqueo de adjuntos en expediente cerrado**: "No se pueden adjuntar documentos a un expediente cerrado." | **Conforme** | `CaseDocuments.jsx` deshabilita la zona de arrastre (drag-and-drop), el selector de archivos y el botón de subida si `legalCase.status === 'cerrado'`. |

---

## 2. Matriz de Comprobación: Casos de Uso (Páginas 13 y 14)

1. **Registrar cliente (autorregistro)**: Implementado en `/register` (`Register.jsx`) con redirección a `/registro-pendiente` y confirmación vía `/confirmar-email`.
2. **Crear cuenta de abogado / administrador**: Implementado en `NewUser.jsx` accesible solo para el rol Administrador, con atributos específicos requeridos (`barNumber` para abogados).
3. **Consultar, listar y actualizar datos de usuario**: Implementado en `UsersContainer.jsx` (búsqueda, filtros por rol y paginación) y `ClientsContainer.jsx` (vista de clientes asignados/estudio).
4. **Actualizar teléfono, domicilio, matrícula o especialidades**: Soportado en `UserDetails.jsx` (edición administrativa) y en `Profile.jsx` (autogestión del perfil del usuario logueado).
5. **Dar de baja (lógica) a un usuario**: Implementado con confirmación en `UsersContainer.jsx` y `ClientsContainer.jsx` (`DELETE /user/:id`).
6. **Crear expediente con cliente y abogado(s)**: Implementado en `NewCase.jsx`, restringido exclusivamente a abogados y administradores (`canWrite`).
7. **Consultar y listar expedientes**: Implementado en `CasesContainer.jsx` con búsqueda por número, título, cliente o abogado, y filtro por estado.
8. **Actualizar datos de un expediente (mientras no esté cerrado)**: Implementado en `CaseDetails.jsx`, bloqueado en `CasePage.jsx` si el caso está cerrado.
9. **Cambiar estado de un expediente**: Selector directo en `CasePage.jsx`, con inmutabilidad ante estados cerrados.
10. **Agregar o quitar abogado responsable**: Implementado en `CasePage.jsx` con dropdown de abogados no asignados y restricción de último abogado.
11. **Dar de baja (lógica) un expediente**: Implementado en `CasesContainer.jsx` (`DELETE /case/:id`).
12. **Solicitar un turno (asociado o no a un expediente)**: Implementado en `NewAppointment.jsx` con selección opcional de expediente.
13. **Consultar disponibilidad horaria de un abogado**: Implementado en `NewAppointment.jsx` (`GET /appointment/availability`).
14. **Confirmar, cancelar o reprogramar un turno**: Implementado en `AppointmentsContainer.jsx` y `AppointmentPage.jsx` mediante endpoints dedicados.
15. **Dar de baja (lógica) un turno**: Implementado con confirmación en `AppointmentsContainer.jsx` (`DELETE /appointment/:id`).
16. **Subir documento PDF real (escrito, expediente, prueba, contrato)**: Implementado en `CaseDocuments.jsx` con drag-and-drop y categorización por tipo.
17. **Consultar, listar y descargar documentos**: Implementado en `CaseDocuments.jsx` con previsualización y descarga directa de binarios PDF.
18. **Dar de baja (lógica) un documento**: Implementado en `CaseDocuments.jsx` (`DELETE /document/:id`).
19. **Generación automática / IA y revisión**: Flujo completo de borrador, previsualización, aprobación y descarte en `CaseDocuments.jsx`.

---

## 3. Matriz de Comprobación: Portales por Rol

* **Portal del Administrador**:
  * Navegación completa: Calendario, Turnos, Expedientes, Clientes y Usuarios.
  * Capacidad total de gestión de usuarios (incluyendo creación de otros administradores y asignación/modificación de roles).
* **Portal del Abogado**:
  * Navegación: Calendario, Turnos, Expedientes y Clientes.
  * Visualización y gestión acotada a los casos y citas en los que participa.
  * Revisión y aprobación de documentos generados por IA.
* **Portal del Cliente**:
  * Navegación: Calendario, Mis Turnos y Mis Expedientes.
  * Solicitud de turnos con validación de disponibilidad.
  * Consulta exclusiva de sus propios expedientes, abogados a cargo (con teléfono) y documentos oficiales.
  * Edición de datos propios de contacto (teléfono y domicilio) en Mi Perfil.

---

## 4. Conclusión de la Comprobación

Tras la verificación pormenorizada del esquema del TIF, las entidades del dominio, el diccionario de datos y las reglas de negocio, **el frontend cumple al 100% con todas las especificaciones documentadas en la Plantilla TIF**.

No quedan requerimientos funcionales ni reglas de negocio pendientes en el frontend.
