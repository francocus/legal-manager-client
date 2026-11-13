import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Login from './components/auth/login/Login.jsx';
import Register from './components/auth/register/Register.jsx';
import ForgotPassword from './components/auth/forgotPassword/ForgotPassword.jsx';
import ResetPassword from './components/auth/resetPassword/ResetPassword.jsx';
import ConfirmEmail from './components/auth/confirmEmail/ConfirmEmail.jsx';
import RegisterPending from './components/auth/registerPending/RegisterPending.jsx';
import Protected from './components/routes/protected/Protected.jsx';
import NotFound from './components/routes/notFound/NotFound.jsx';
import { DashboardDataProvider } from './components/services/data/DashboardDataProvider.jsx';
import { ROLES } from './components/services/consts/roles';
import OnboardingModal from './components/shared/onboarding/OnboardingModal.jsx';
import DashboardLayout from './components/biz/dashboard/layout/DashboardLayout.jsx';
import Home from './components/biz/dashboard/home/Home.jsx';
import AppointmentsContainer from './components/biz/appointments/appointmentsContainer/AppointmentsContainer.jsx';
import AppointmentPage from './components/biz/appointments/appointmentPage/AppointmentPage.jsx';
import CasesContainer from './components/biz/cases/casesContainer/CasesContainer.jsx';
import CasePage from './components/biz/cases/casePage/CasePage.jsx';
import ClientsContainer from './components/biz/clients/clientsContainer/ClientsContainer.jsx';
import ClientPage from './components/biz/clients/clientPage/ClientPage.jsx';
import UsersContainer from './components/biz/users/usersContainer/UsersContainer.jsx';
import TurnosPapelera from './components/biz/trash/papeleras/turnosPapelera/TurnosPapelera.jsx';
import ExpedientesPapelera from './components/biz/trash/papeleras/expedientesPapelera/ExpedientesPapelera.jsx';
import ClientesPapelera from './components/biz/trash/papeleras/clientesPapelera/ClientesPapelera.jsx';
import UsuariosPapelera from './components/biz/trash/papeleras/usuariosPapelera/UsuariosPapelera.jsx';
import Profile from './components/biz/profile/Profile.jsx';
import CalendarContainer from './components/biz/calendar/calendarContainer/CalendarContainer.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />
        <Route path="/confirmar-email" element={<ConfirmEmail />} />
        <Route path="/registro-pendiente" element={<RegisterPending />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <DashboardDataProvider>
                <OnboardingModal />
                <DashboardLayout />
              </DashboardDataProvider>
            </Protected>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="calendar" element={<CalendarContainer />} />
          <Route path="appointments" element={<AppointmentsContainer />} />
          <Route path="appointments/:appointmentId" element={<AppointmentPage />} />
          <Route
            path="appointments/papelera"
            element={
              <Protected allowedRoles={[ROLES.ADMIN, ROLES.ABOGADO]}>
                <TurnosPapelera />
              </Protected>
            }
          />
          <Route path="cases" element={<CasesContainer />} />
          <Route path="cases/:caseId" element={<CasePage />} />
          <Route
            path="cases/papelera"
            element={
              <Protected allowedRoles={[ROLES.ADMIN, ROLES.ABOGADO]}>
                <ExpedientesPapelera />
              </Protected>
            }
          />
          <Route
            path="clients"
            element={
              <Protected allowedRoles={[ROLES.ADMIN, ROLES.ABOGADO]}>
                <ClientsContainer />
              </Protected>
            }
          />
          <Route
            path="clients/:clientId"
            element={
              <Protected allowedRoles={[ROLES.ADMIN, ROLES.ABOGADO]}>
                <ClientPage />
              </Protected>
            }
          />
          <Route
            path="clients/papelera"
            element={
              <Protected allowedRoles={[ROLES.ADMIN]}>
                <ClientesPapelera />
              </Protected>
            }
          />
          <Route path="profile" element={<Profile />} />
          <Route
            path="users"
            element={
              <Protected allowedRoles={[ROLES.ADMIN]}>
                <UsersContainer />
              </Protected>
            }
          />
          <Route
            path="users/papelera"
            element={
              <Protected allowedRoles={[ROLES.ADMIN]}>
                <UsuariosPapelera />
              </Protected>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
