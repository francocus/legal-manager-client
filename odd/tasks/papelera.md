# Papelera (admin trash) — legal-manager

Feature: papelera por página para el admin. Cada vista (Turnos, Expedientes,
Clientes, Usuarios) tiene su propia vista de papelera con la misma estética de
su página de origen; el botón de papelera de cada toolbar lleva a su papelera
(raíz `/dashboard/<pagina>/papelera`, admin-only). Reemplaza la papelera única
de dashboard (`/dashboard/papelera`) de la primera iteración.

## Decisiones cerradas (usuario, 2026-11-12)

1. **Restaurar**: sí, desde cada papelera.
2. **Purga**: **ambas** — borrado manual + purga automática a los 12 meses de
   la baja (lazy: corre al abrir cada papelera; nunca borra antes de 12 meses;
   si nadie abre, retiene más tiempo).
3. **Alcance**: expedientes + turnos + documentos + (ronda 2) **clientes y
   usuarios**. Los clientes son cuentas de usuario (TPC `Client`): la papelera
   de usuarios cubre clientes/abogados/admins de baja; la de clientes filtra
   `type: client`.
4. **FK borrado físico**: block-only, sin cascadas (elección "la más segura"):
   - Expediente: exige 0 turnos y 0 documentos asociados (de cualquier
     estado); limpia las filas join `CaseLawyer`.
   - Turno / documento: sin hijos, directo (documento borra el archivo
     físico vía `IFileStorage` primero; si falla, aborta y conserva la fila).
   - Cliente/usuario: exige 0 casos y 0 turnos que lo referencien y 0
     documentos subidos/revisados por él (de cualquier estado). Restauro de
     usuario puede chocar con los índices únicos filtrados `[Active] = 1`
     (email/DNI re-tomados) → 409 con mensaje.
5. **Purga**: chequeo lazy en el listado (no hosted service), por ser la opción
   con menos piezas en movimiento y retención mayor o igual a 12 meses.
6. Los **documentos** viven en la papelera de expedientes (sección propia),
   porque no tienen página propia y pertenecen a un expediente.

## Estado

- [x] Ronda 1 (backend + papelera única): commits backend `53c05d5`/`5e4eceb`
  en `feat/papelera`; front `64a1dc4` en `feat/cierre-gaps-tif-cliente`.
  Verificada E2E (baja → papelera → restaurar → borrado físico con archivo →
  purga 12 meses).
- [x] Ronda 2 (2026-11-12): papelera de usuarios en el backend
  (`12b1ba9` — User DeactivatedAt + Reactivate, migración
  `AddDeactivatedAtToUsers` sobre Admins/Clients/Lawyers, listing/restore/
  hard delete block-only en TrashService, UniqueViolationMessage de restore
  para email/DNI re-tomados) y **papeleras por página** en el front
  (`189d78f`): 4 vistas espejo de su página de origen
  (`/dashboard/{appointments,cases,clients,users}/papelera`, admin-only,
  botón Volver al módulo), botones de toolbar apuntando a su propia papelera,
  sin entrada en el nav (la papelera ya no es página de dashboard).
  Documentos como sección dentro de la papelera de expedientes.
  Fix de mapeo: el item de usuarios del backend anida `{ user, deactivatedAt,
  isAdmin }` → mapUser sobre item.user. Fix de layout: las tablas de papelera
  caen a table-layout auto y sueltan las anchuras porcentuales del módulo
  (scope `:has(.trash-row-actions)`) porque la columna ACCIONES fija (~12%)
  recortaba los botones de texto. Verificado CDP con datos reales (turno de
  baja, cliente de baja, caso de baja en 4 rutas, dark y light).

## Ronda 3 — giro del usuario (2026-11-12, posterior a la ronda 2)

El usuario cerró el modelo: **"no existe la baja física en nuestro sistema"**.
Todo lo físico de la papelera se revierte:

- **Sin borrado definitivo**: se quitan los endpoints DELETE de trash, los
  `HardDelete*` del servicio y los botones del front. La papelera queda como
  archivo de bajas lógicas con **Restaurar**.
- **Sin purga de 12 meses**: la purga borraba físicamente (fila + archivo) →
  fuera. Los ítems permanecen indefinidamente hasta que alguien los restaure.
- **Abogado con papelera**: los endpoints pasan de AdminsOnly a AdminOrLawyer
  con filtro por rol (el abogado solo ve SUS turnos, SUS expedientes y los
  documentos de SUS expedientes; la lista de usuarios queda vacía para él).
  Restore con chequeo de propiedad (Forbidden si no es suyo). Rutas de
  turnos/expedientes abiertas a ABOGADO; clientes/usuarios siguen solo admin.
- Columnas `DeactivatedAt` y `Reactivate()` se conservan (metadata + restore).

## Verificación ronda 3

- Admin: filas solo con Restaurar (sin borrado físico en ninguna sección).
- Abogado (`papelera.abogado@x.test`): botón papelera en Turnos → su papelera
  con su turno de baja y solo Restaurar; expedientes con su caso; clientes/
  usuarios bloqueados (Protected → login); nav sin Usuarios ni Papelera.
- API: abogado ve exactamente sus ítems (2 casos, 1 turno, 0 documentos,
  0 usuarios); admin ve todo.
- Nota: la cuenta del abogado de prueba nace sin confirmar (alta por API) →
  confirmar con el hatch admin antes de loguearla.

## Bugs/follow-ups conocidos

- Dar de baja un documento cuyo expediente está de baja → 500
  (`DocumentService.EnsureDocumentWriteAsync` valida el padre con filtro
  `Active`). Debería ser 409/400. Sigue para el backend (compañero).
- Los archivos huérfanos del storage viejo (`bin/**/DocumentStorage` de la
  base anterior) quedaron en disco; el purga no los conoce (no tienen fila).
