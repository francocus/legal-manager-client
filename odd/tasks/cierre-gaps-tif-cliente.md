# Feature: Cierre de gaps TIF en el frontend (cierre-gaps-tif-cliente)

Base: auditoría TIF del 12/11/2026 sobre `main` `e894b9b` (después del pull de
`feat/ajustes-especificaciones-tif` del compañero, que ya resolvió: lawyers en
expediente, perfil editable, caseId+área en turnos, closingDate, guard de cerrado,
renombrado sysadmin→admin). Rama de trabajo: `feat/cierre-gaps-tif-cliente`.

## Alcance (lo que queda del reporte de auditoría)

1. **Migración a Axios** (divergencia de stack con el TIF/minuta): `httpClient.js`
   reescrito sobre una instancia de axios manteniendo las firmas exportadas
   (`apiRequest`, `apiDownload`, `getErrorMessage` usos solo internos). Preservar:
   base URL `VITE_API_URL`, 401 → `clearExpiredSession()` + redirect `/login`,
   parseo de error (`message`/`title`/`detail`), FormData multipart sin header
   manual, descarga blob con filename de `Content-Disposition`, 204 → `null`.
   Agregar `axios` a `package.json`.
2. **Guard de rol por URL**: `/dashboard/clients` solo `admin`/`abogado`
   (`Protected allowedRoles` en `App.jsx`; nav ya lo oculta para cliente).
3. **Guard de auto-baja audible**: en `UsersContainer.jsx`, intentar darse de baja
   a sí mismo debe mostrar toast explicativo (hoy es silencioso).
4. **Mapping de chips de documentos** (`Documents.data.js`): alinear al contrato
   confirm-first (IA guardada llega `Approved = true`; constancia `approved = null`
   sin chip de revisión; `isPendingReview` queda solo como legado defensivo).
5. **Copy de baja lógica**: labels de ConfirmDialog "Eliminar" → "Dar de baja"
   (users, clients, cases, appointments, documents), coherente con la baja lógica
   del TIF. Sentence case en todo el copy.
6. **THEME_KEY muerta**: `ThemeContextProvider.jsx` usa la constante de
   `storageKeys.js` en lugar del literal `'theme'`.
7. **Doc del equipo**: corregir en `docs/cambios-implementados-tif.md` las filas
   que describen `PATCH /approve` / `PATCH /discard` (endpoints eliminados del
   backend): describir el flujo confirm-first real (generar → preview → Guardar
   en `POST /document/generated`; Descartar es local, nada persiste).

## Fuera de alcance (decisiones ya tomadas por el equipo o no exigidas por el TIF)

- Paginación de vistas: removida por decisión documentada del compañero
  (listados continuos; la API soporta paginación opcional server-side, que es lo
  que el TIF exige como estrategia de crecimiento). No se re-agrega.
- Cambio de contraseña: el TIF no lo exige.
- Field-mapping de 409 a inputs: mejora UX no exigida por el TIF.

## Tareas

| # | Tarea | Estado | Commit (evidencia) |
|---|-------|--------|--------------------|
| 1 | Migración httpClient → axios + dependencia | done | `951f8c2` |
| 2 | Guard de rol en /clients y /clients/:id (App.jsx) | done | `ca872ea` |
| 3 | Toast de auto-baja (UsersContainer) | done | `ca872ea` |
| 4 | Chips + labels de documentos al contrato confirm-first | done | `7360cfe` |
| 5 | Copy "Dar de baja" en ConfirmDialogs | done | `5cccbf8` |
| 6 | THEME_KEY usada por ThemeContextProvider | done | `519f312` |
| 7 | Corrección doc confirm-first (+ sección 3) | done | `ffe5f47` |

## Extras de la implementación

- UX reportada por el usuario: la pantalla Recuperar contraseña (vista del
  formulario) no tenía salida al login. Agregado el enlace "Volver al inicio de
  sesión" con el patrón auth-switch-text/auth-link (commit `45918c9`).

- Bug encontrado al verificar contra el backend (`master`, `JsonStringEnumConverter`):
  los dtos de documentos llegan con `type` como **string** ("Escrito"/"Generado") y el
  cliente mapeaba ints (0-4), así que el listado mostraba tipo "—" para todos.
  Corregido en `getTypeLabel` + predicado del chip (compatible con ambos shapes;
  la subida sigue enviando ints, aceptados por el converter).
- Verificación: `npm install` OK, `npm run lint` limpio, `npm run build` OK
  (warnings preexistentes de chunk size). Smoke contra la API de Azure no pudo
  ejecutarse (cold start / timeout); pendiente probar login + documentos desde el
  navegador con la API levantada.

Verificación del padre: `npm install`, `npm run lint`, `npm run build`, y spot-read
del diff de `httpClient.js`. Commits por unidad de trabajo (Conventional Commits en
español, paths explícitos). Push: solo si el usuario lo pide.
