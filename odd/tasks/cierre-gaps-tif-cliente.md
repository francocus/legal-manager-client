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
- Corrección de cobertura (79f5c59): el primer opt-in a (0,1,1) perdía por
  especificidad contra `.users-form .form-select` y `.cases-form .form-select`
  (0,2,0, edit/crear usuario y expedientes) → esos forms seguían con popup
  nativo; `select[class]` (0,2,1) y los pins de option a (0,2,2) le ganan a
  todos los módulos. Además el control cerrado en base mode estira un wrapper
  de shadow UA con el texto pegado arriba → geometría normalizada dentro de
  `@supports (appearance: base-select)`: height/min-height 46px, padding-block
  11px y line-height 22px (= alto del wrapper estirado), nowrap + clip para
  valores largos; no-supporting browsers conservan el centrado nativo.
  Verificado E2E con CDP contra la API real (login admin en Azure): appearance
  base-select en toolbar users, modal editar usuario, expedientes y cases, dark
  y light; capturas del picker abierto y del valor centrado en todos los
  shapes (harness + app real).
- Botón de período del calendario (e675278): el centro decía siempre "Hoy" →
  ahora nombra el scope mientras el calendario está en el período actual
  ("Esta semana" en semana, "Este mes" en mes) y cambia a "Volver" cuando la
  navegación sale de él (flechas o click en otra fecha); siempre vuelve a
  hoy. Min-width 96px para que las flechas no salten entre labels. Verificado
  con CDP leyendo los 4 estados.
- Hallazgo E2E: el toast de bienvenida ("¡Bienvenido...") tapa los controles
  del hero del calendario ~4-5s tras loguear (contenedor tipo modal con
  pointer-events); transitorio, no se tocó.
- Barra de scroll del picker (8257255): los popups con listas largas mostraban
  la barra nativa clásica (ancha, con flechitas) — el `::-webkit-scrollbar`
  global de index.css no alcanza un pseudo-elemento de top layer. Estilizado
  con `scrollbar-width: thin` + `scrollbar-color` (thumb 0.18 sobre track
  transparente, por tema) sobre `::picker(select)`. Trampa de build: apilar
  `::picker(select)::-webkit-scrollbar` parsea en Chromium pero viola la
  gramática de selectores (un solo pseudo-elemento al final) y lightningcss
  rechaza el minify → se usan las propiedades estándar. Trampa de revelado:
  los scroll del picker nunca llegan al listener capture de document, así que
  `is-scrolling` no lo maneja → thumb silenciosamente visible (el mismo color
  que usa la barra de página mientras scrolleá).
  Verificado con CDP en harness con 40 opciones: scroll del picker, thumb en
  reposo y light/dark.
- Placeholders light unificados al valor de "Buscar turno"
  (rgba(60,71,84,0.55) weight 400): el global `[data-bs-theme='light']
  .form-control::placeholder` de dashboard.css llevaba #5b6675 sólido con
  !important y dejaba "Buscar expediente/cliente/usuario" más presentes que
  la referencia. Borrado además el selector muerto de users.css (`input
  .users-search...`, inputs no anidan). Dark sin cambios (auditoría: 0.5 vs
  0.44 preexistente, el usuario lo considera bien). Verificado con CDP
  midiendo getComputedStyle(el,'::placeholder') en las 4 vistas.
- Flujo registro → promoción a abogado desbloqueado: UsersContainer filtraba
  FUERA a los clientes (`staffUsers`), así que el admin no veía a los
  autoregistrados en ningún lado y el backend PATCH /user/{id}/role (creado
  justo para eso, comenta el controlador) quedaba inaccesible. Ahora la
  lista muestra a todos (clientes incluidos, chip CLIENTE ya estilizado), el
  filtro de rol suma Cliente, y el edit modal ya no recibe allowedRoles:
  UserDetails arma las opciones dinámicamente (target admin → solo su rol
  bloqueado, porque el backend rechaza cambios de rol de admins; resto →
  Abogado + Cliente, mostrando el rol actual, que antes quedaba vacío al
  editar un cliente). Democión abogado→cliente habilitada con los guards del
  backend (exige matrícula al promover; bloquea si tiene expedientes/turnos
  como cliente o como abogado).
  Verificado E2E con CDP (cuenta cliente QA registrada y confirmada por API):
  fila visible con chip CLIENTE, modal con Rol "Cliente", pick Abogado →
  matrícula obligatoria, save → chip ABOGADO, democión → chip CLIENTE.
  Nota: el modal de bienvenida y los modales tapaban clicks de CDP → en los
  scripts se cierran y se hace scrollIntoView de la fila antes de clickear.
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
