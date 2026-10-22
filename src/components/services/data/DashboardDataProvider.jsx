import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DashboardDataContext } from './dashboardData.context';
import { AuthenticationContext } from '../auth/authentication.context';
import { ROLES } from '../consts/roles';
import { usersApi } from '../api/usersApi';
import { casesApi } from '../api/casesApi';
import { appointmentsApi } from '../api/appointmentsApi';

export const DashboardDataProvider = ({ children }) => {
  const { token, user } = useContext(AuthenticationContext);
  const role = user?.role;

  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshCases = useCallback(async () => {
    setCases(await casesApi.getAll());
  }, []);

  const refreshAppointments = useCallback(async () => {
    setAppointments(await appointmentsApi.getAll());
  }, []);

  const refreshUsers = useCallback(async () => {
    setUsers(await usersApi.getAll());
  }, []);

  const refreshLawyers = useCallback(async () => {
    setLawyers(await usersApi.getLawyers());
  }, []);

  const refreshClients = useCallback(async () => {
    setClients(await usersApi.getClients());
  }, []);

  const refreshAll = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const tasks = [refreshCases(), refreshAppointments()];

      if (role === ROLES.SYSADMIN) {
        tasks.push(refreshUsers());
      }
      if (role === ROLES.CLIENTE || role === ROLES.SYSADMIN) {
        tasks.push(refreshLawyers());
      }
      if (role === ROLES.ABOGADO || role === ROLES.SYSADMIN) {
        tasks.push(refreshClients());
      }

      await Promise.all(tasks);
    } catch (refreshError) {
      setError(refreshError.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [
    token,
    role,
    refreshCases,
    refreshAppointments,
    refreshUsers,
    refreshLawyers,
    refreshClients,
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const contextValue = useMemo(
    () => ({
      cases,
      appointments,
      users,
      lawyers,
      clients,
      loading,
      error,
      setError,
      refreshAll,
      refreshCases,
      refreshAppointments,
      refreshUsers,
      refreshLawyers,
      refreshClients,
    }),
    [
      cases,
      appointments,
      users,
      lawyers,
      clients,
      loading,
      error,
      refreshAll,
      refreshCases,
      refreshAppointments,
      refreshUsers,
      refreshLawyers,
      refreshClients,
    ],
  );

  return <DashboardDataContext value={contextValue}>{children}</DashboardDataContext>;
};
