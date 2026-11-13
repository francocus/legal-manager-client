# LegalManager — Cliente Web (Frontend SPA)

> **Trabajo Integrador Final (TIF)**  
> **Institución:** Universidad Tecnológica Nacional — Facultad Regional Rosario (UTN FRR)  
> **Carrera:** Tecnicatura Universitaria en Programación (TUP)  
> **Año Académico:** 2026  
>
> **Equipo de Desarrollo:**  
> - **Agustín Angelini**  
> - **Franco Cuscianna**  
> - **Thiago Cuscianna**  
>
> **Tutor del Proyecto:**  
> - **Matias Kraier**  
>
> 🌐 **Despliegue en Producción (Microsoft Azure):**  
> - **Cliente Web (Frontend SPA):** [https://www.legalmanager.tech](https://www.legalmanager.tech)  
> - **API REST (Punto de acceso):** [https://legalmanager-api-f4gqhqfsejdshrcm.chilecentral-01.azurewebsites.net](https://legalmanager-api-f4gqhqfsejdshrcm.chilecentral-01.azurewebsites.net)  
> - **Repositorio del Backend:** [francocus/legal-manager-api](https://github.com/francocus/legal-manager-api)

---

## 1. Introducción y Planteo del Problema

El ejercicio profesional en estudios jurídicos modernos enfrenta desafíos organizativos críticos: dispersión de expedientes en papel, dificultad para realizar un seguimiento riguroso de etapas procesales y plazos de vencimiento, superposición de turnos de clientes por falta de sincronización horaria, y canales de comunicación lentos que generan incertidumbre en los justiciables.

**LegalManager** es una plataforma integral desarrollada como Single Page Application (SPA) para digitalizar y centralizar la operativa diaria de estudios de abogados. Proporciona una interfaz ágil, reactiva y accesible que conecta en un mismo entorno de trabajo a los tres actores fundamentales del ecosistema legal: los socios directores (**Administradores**), los profesionales a cargo de las causas (**Abogados**) y los titulares de los derechos en litigio (**Clientes**).

---

## 2. Objetivos del Proyecto

### Objetivo General
Diseñar, desarrollar e implementar una aplicación web cliente moderna (SPA) bajo altos estándares de usabilidad, seguridad y responsividad, que interactúe de forma desacoplada y resiliente con la API REST de **LegalManager** en Azure.

### Objetivos Específicos
- **Experiencia de Usuario Inmersiva:** Desarrollar interfaces reactivas con **React 19**, soporte nativo de modo oscuro/claro y componentes ergonómicos sin recarga de página.
- **Seguridad y Control de Acceso (RBAC):** Gestionar autenticación mediante tokens JWT, control estricto de rutas protegidas y renderizado condicional según el rol activo.
- **Gestión Integral de Expedientes:** Proporcionar visualización en tiempo real del estado de causas judiciales, carga de actuaciones, generación de carátulas oficiales en PDF y asistencia de redacción mediante **Inteligencia Artificial (LLM)**.
- **Seguridad en Operaciones Críticas:** Implementar un mecanismo de confirmación reforzado para el cierre definitivo de causas, exigiendo el tipeo manual del número de expediente para prevenir cierres involuntarios.
- **Agenda y Disponibilidad Dinámica:** Proveer a cada abogado la facultad de configurar de manera autónoma sus días y horarios libres de atención (cualquier hora a elección), sincronizando en tiempo real la disponibilidad al momento en que el cliente solicita su cita.
- **Segmentación Profesional de Clientes:** Garantizar la confidencialidad de la información permitiendo que los abogados visualicen únicamente los clientes con los que mantienen un vínculo activo (causas asignadas o turnos programados), mientras los administradores conservan el control global.
- **Papelera de Reciclaje y Auditoría:** Integrar un panel de recuperación con baja lógica (*soft delete*) para restaurar entidades inactivas.

---

## 3. Stack Tecnológico

| Capa / Herramienta | Tecnología | Justificación y Uso |
|---|---|---|
| **Librería UI Principal** | React 19 | Arquitectura modular basada en componentes declarativos, Hooks y ciclo de vida optimizado. |
| **Herramienta de Construcción** | Vite 8 + Rolldown | Entorno de desarrollo ultrarrápido con Hot Module Replacement (HMR) y empaquetado optimizado para producción. |
| **Enrutamiento** | React Router DOM v7 | Enrutamiento declarativo del lado del cliente, rutas protegidas con validación de roles y persistencia de historial. |
| **Framework de Estilos** | Bootstrap 5.3 + React-Bootstrap | Sistema de grillas flexible, controles accesibles y modales interactivos. |
| **Estilos Personalizados** | CSS3 Vanilla con Variables | Diseño con `clamp()`, fondos con efecto de desenfoque de cristal (*glassmorphism*) y tematización unificada claro/oscuro. |
| **Iconografía** | Lucide React + Bootstrap Icons | Íconos vectoriales SVG escalables y coherentes en todas las vistas del sistema. |
| **Gestión de Estado** | React Context API | Estado global ligero para autenticación, preferencias de usuario, notificaciones flotantes (*Toasts*) y tema. |
| **Cliente HTTP** | Axios | Peticiones asincrónicas a la API REST con interceptores automáticos de JWT y manejo centralizado de respuestas y errores. |
| **Calidad de Código** | ESLint | Análisis estático de código para garantizar buenas prácticas y coherencia sintáctica. |
| **Alojamiento en la Nube** | Azure Static Web Apps | Distribución global en CDN con certificado SSL/TLS automatizado y reglas de reescritura para rutas SPA. |

---

## 4. Arquitectura y Organización del Proyecto

El código fuente sigue una arquitectura modular y desacoplada organizada por dominios de negocio (`biz`), componentes transversales (`shared`), contextos (`context`) y servicios de comunicación (`services`):

```
legal-manager-client/
├── public/                     # Archivos estáticos públicos (favicon, manifest)
├── src/
│   ├── assets/                 # Recursos gráficos (logos, carátulas, fuentes)
│   ├── components/
│   │   ├── biz/                # Módulos centrales del dominio de negocio
│   │   │   ├── appointments/   # Gestión de turnos, reserva dinámica y reprogramación
│   │   │   ├── calendar/       # Calendario interactivo mensual y agenda
│   │   │   ├── cases/          # Gestión de expedientes, cierre seguro y resúmenes con IA
│   │   │   ├── clients/        # Gestión de clientes, filtros y segmentación por rol
│   │   │   ├── dashboard/      # Estructura base del panel, barras laterales y métricas
│   │   │   ├── home/           # Pantalla de bienvenida y alerta de agenda inicial
│   │   │   ├── profile/        # Perfil del usuario y configuración de horarios libres
│   │   │   ├── trash/          # Panel de Papelera de Reciclaje y restauración
│   │   │   └── users/          # Administración de abogados y directores (Admin)
│   │   ├── layout/             # Componentes estructurales de pantalla (Navbar, Footer)
│   │   ├── routes/             # Definición de rutas (`AppRoutes`) y guardia (`ProtectedRoute`)
│   │   └── shared/             # Componentes reutilizables (Modals, Toasts, Loaders, EmptyState)
│   ├── context/                # Proveedores de estado global (AuthContext, ToastContext)
│   ├── services/
│   │   ├── api/                # Clientes Axios tipados (authApi, casesApi, usersApi, appointmentsApi, trashApi)
│   │   ├── auth/               # Gestión de sesión, almacenamiento local y decodificación de tokens
│   │   ├── consts/             # Constantes maestras (roles, estados, formatos de fecha)
│   │   └── preferences/        # Preferencias de usuario (tema, formatos regionales)
│   ├── App.jsx                 # Componente raíz de la aplicación
│   ├── main.jsx                # Punto de entrada y montaje en el DOM
│   └── index.css               # Reglas y variables globales de estilo
├── staticwebapp.config.json    # Configuración de despliegue para Azure Static Web Apps
├── vite.config.js              # Configuración de Vite y plugins
└── package.json                # Dependencias y scripts del proyecto
```

---

## 5. Matriz de Roles y Control de Acceso

La aplicación implementa una matriz de permisos que adapta las barras de navegación, botones y rutas según la identidad del usuario logueado:

| Funcionalidad / Módulo | Administrador | Abogado | Cliente |
|---|:---:|:---:|:---:|
| **Acceso al Panel Principal (Dashboard)** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Gestión de Usuarios (Admins y Abogados)** | ✅ Total | ❌ No | ❌ No |
| **Gestión de Clientes** | ✅ Todos | 👁️ Solo vinculados | ❌ No |
| **Creación y Edición de Expedientes** | ✅ Sí | ✅ Sí | ❌ No |
| **Cierre Definitivo de Expedientes (con confirmación)** | ✅ Sí | ✅ Sí (asignados) | ❌ No |
| **Generación de Resumen con IA (Causas Abiertas/Cerradas)** | ✅ Sí | ✅ Sí | ❌ No |
| **Descarga de Carátulas y Constancias PDF** | ✅ Sí | ✅ Sí | 👁️ De causas propias |
| **Configuración de Días y Horarios Libres de Atención** | ❌ No | ✅ Sí (su agenda) | ❌ No |
| **Solicitud de Turnos** | ✅ Sí | ✅ Para sus clientes | ✅ Para sí mismo |
| **Visualización de Calendario de Citas** | ✅ Global | 👁️ Su agenda | 👁️ Sus turnos |
| **Acceso a Papelera de Reciclaje y Restauración** | ✅ Sí | ❌ No | ❌ No |
| **Edición de Perfil y Preferencias Visuales** | ✅ Sí | ✅ Sí | ✅ Sí |

---

## 6. Módulos y Funcionalidades Destacadas

### A. Gestión de Expedientes y Cierre Definitivo Seguro
- **Trazabilidad:** Cada expediente cuenta con título, número judicial único, cliente asignado, abogados participantes, fuero/área y estado (`Activo`, `Pendiente`, `Cerrado`).
- **Resúmenes Automáticos con Inteligencia Artificial:** Integración con la API de inferencia LLM para generar resúmenes ejecutivos a partir del historial procesal y notas de la causa. Esta funcionalidad se encuentra disponible tanto para expedientes en trámite como para expedientes archivados (`Cerrados`).
- **Confirmación Estricta de Cierre:** El cierre de una causa legal es una operación irreversible. Para prevenir pérdidas accidentales, el sistema despliega un modal de advertencia que bloquea la acción hasta que el usuario ingrese exactamente el **Número de Expediente**, habilitando únicamente tras dicha validación el botón de cierre definitivo.

### B. Agenda Profesional y Configuración de Horarios Libres
- **Autonomía del Abogado:** Los abogados pueden configurar desde su panel de perfil los días de la semana en los que atienden y definir **cualquier horario** que consideren conveniente mediante un selector de hora libre (`HH:mm`), sin estar limitados a turnos predeterminados.
- **Atajos Ergonómicos:** Incluye botones rápidos para cargar la grilla estándar sugerida (09:00, 10:30, 12:00, 14:00, 15:30, 17:00) o limpiar todos los horarios, visualizando cada turno como un chip interactivo con opción de eliminación puntual.
- **Alerta de Agenda Inicial:** Si un abogado recién registrado no ha establecido aún su disponibilidad, el sistema le muestra un banner informativo recomendándole configurar sus horarios para que los clientes puedan solicitar citas.
- **Reserva en Tiempo Real:** Al solicitar un turno, el cliente o abogado visualiza dinámicamente únicamente las fechas habilitadas y los horarios libres reales devueltos por el backend, previniendo solapamientos.

### C. Gestión de Clientes con Segmentación por Rol
- **Vista de Administrador:** Visualiza la totalidad de los clientes registrados en la base de datos, con opción de búsqueda en tiempo real por nombre, DNI o correo, y acceso a formularios de alta y modificación.
- **Vista de Abogado:** Filtra automáticamente el padrón de clientes mostrando exclusivamente aquellos que guardan relación profesional directa con el abogado autenticado (tenencia de expedientes o turnos en común). Al dar de alta un nuevo caso, se mantiene la posibilidad de seleccionar cualquier cliente registrado en el estudio.

### D. Gestión de Usuarios y Roles (Exclusivo Admin)
- Permite la creación, edición y asignación de contraseñas seguras para Administradores y Abogados.
- Se excluye expresamente a los clientes de esta vista para mantener separada la administración del personal del estudio de los justiciables.

### E. Papelera de Reciclaje (Baja Lógica y Restauración)
- Interfaz gráfica que lista los registros que fueron dados de baja lógica (`Active == false`) clasificados por entidad (usuarios, clientes, expedientes y citas).
- Permite a los administradores auditar la fecha de baja y restaurar inmediatamente el elemento a su estado activo anterior con un solo clic.

---

## 7. Puesta en Marcha en Entorno Local

### Requisitos Previos
- **Node.js:** Versión 18.0 o superior (recomendado 20.x LTS)
- **Gestor de paquetes:** npm 9.x o superior
- **Instancia del Backend:** API REST de `LegalManager` en ejecución local o accesible mediante URL de Azure.

### Instrucciones de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/francocus/legal-manager-client.git
   cd legal-manager-client
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configuración de Variables de Entorno:**
   Crear un archivo `.env` en la raíz del proyecto (basado en `.env.example`):
   ```env
   # URL base de la API REST de LegalManager
   VITE_API_URL=http://localhost:5000/api
   ```
   *(Para conectar con el entorno en la nube de Azure, utilizar `https://legalmanager-api-f4gqhqfsejdshrcm.chilecentral-01.azurewebsites.net/api`)*.

4. **Ejecutar el Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación levantará de forma predeterminada en `http://localhost:5173`.

5. **Verificación de Calidad y Linting:**
   ```bash
   npm run lint
   ```

6. **Compilación para Producción:**
   ```bash
   npm run build
   ```
   Genera los archivos estáticos optimizados en la carpeta `dist/`.

7. **Previsualización de la Compilación:**
   ```bash
   npm run preview
   ```

---

## 8. Despliegue en la Nube (Microsoft Azure)

La aplicación web se encuentra desplegada de forma continua en **Azure Static Web Apps**:
- **Dominio de Producción:** [https://www.legalmanager.tech](https://www.legalmanager.tech)
- **Pipeline de Integración y Despliegue Continuo (CI/CD):** Configurado a través de GitHub Actions en `.github/workflows/azure-static-web-apps-*.yml`. Ante cada `push` en la rama principal, el pipeline ejecuta `npm run build` y publica automáticamente el directorio `dist/`.
- **Ruteo de SPA (`staticwebapp.config.json`):**
  ```json
  {
    "navigationFallback": {
      "rewrite": "/index.html",
      "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
    },
    "responseOverrides": {
      "404": {
        "rewrite": "/index.html"
      }
    }
  }
  ```
  Garantiza que cualquier ruta solicitada directamente en el navegador (ej. `/cases`, `/appointments`, `/profile`) sea resuelta correctamente por React Router sin arrojar errores 404 del servidor web.
