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
- Botón "Crear cliente" alineado a la familia crear (`.clients-create`, sombra
  18/30/0.4, weight 800, hover con color declarado) (commit `1cb0d7c`).
- Skin global de `.form-select` en `ui.css` (toolbar, perfil, tipo de documento)
  (commit `7a29d1c`).
- Auto-ocultado de scrollbars: `.is-scrolling` en `<html>` vía listener único
  capture+passive, thumb transparente en reposo con gutter reservado (sin CLS),
  hover revela para agarrar (commit `d368e50`); idle bajado a 0.5s a pedido del
  usuario y verificado con inyección de overflow (commit `6bb01aa`).
- Avatar compartido `.app-avatar` en detalle de expediente/turno + fix light del
  avatar de cliente; overrides light para `--primary`/`--danger` (commit
  `0efe578`).
- Congruencia dark de botones: sombra 18/30/0.4 y weight 800 unificados, lift
  -2px global, vidrio secundario estándar en modales, alturas 46px, sombra de
  auth por var de tema (commit `a91954e`).
- Bug del status: el backend manda el nombre del enum capitalizado ("Cerrado")
  y `mapCase` lo pasaba crudo → guard de cerrado inoperante, select mostrando
  "Activo" y filtro roto. Normalizado a minúsculas en `mapCase` (commit
  `2ae50bf`). Los turnos ya normalizaban.
- Placeholder de búsqueda por vista (UsersSearch parametrizado) (commit
  `5134f86`).
- Letras sin cambio de color en hover (los "Volver" eran `<Link>` y Bootstrap
  los pintaba azul al hover; color declarado en todos los hovers de
  `app-button`, ambos temas) (commit `c750736`).
- Menú desplegado de los select por tema: `color-scheme` en `:root` estaba
  hardcodeado dark en `index.css` → agregado flip `[data-bs-theme='light'] { color-scheme: light }`;
  opciones pineadas por tema en `ui.css` (oscuro #0a0d12, claro blanco)
  (commit `c750736`).
- Dropdown de los select como DOM real in-page (customizable select,
  Chromium/Edge 135+): `appearance: base-select` en `[data-bs-theme] select` +
  `select::picker(select)` (el picker necesita su propio opt-in, sin eso queda
  el look default blanco con esquinas cuadradas), popup con radio 16px, borde y
  sombra por tema, opciones con radio 10px y estados hover/checked pineados,
  `::picker-icon` y `::checkmark` ocultos. Cubre los 3 selects crudos de
  toolbars y todos los `Form.Select` de una vez (quedan cubiertos los futuros);
  verificado con CDP (apariencia base-select + capturas del picker abierto con
  hover y checked en dark y light). Browsers sin soporte ignoran estas reglas y
  conservan el popup nativo pineado de `c750736`. Alternativa descartada por
  ahora: componente `AppSelect` propio (reescribiría ~13 usages perdiendo
  teclado/a11y/móvil nativos).
- Idle de scrollbars a 0.5s a pedido del usuario (commit `6bb01aa`).

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
