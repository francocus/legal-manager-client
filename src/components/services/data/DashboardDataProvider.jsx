import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DashboardDataContext } from './dashboardData.context';
import { AuthenticationContext } from '../auth/authentication.context';
import { ROLES } from '../consts/roles';
import { usersApi } from '../api/usersApi';
import { casesApi } from '../api/casesApi';
import { appointmentsApi, sortAppointments } from '../api/appointmentsApi';
import { mapCase } from '../../biz/cases/Cases.data';
import { mapAppointment } from '../../biz/appointments/Appointments.data';

// Backend authorization (UserController): /user/lawyers is open to every
// authenticated role, /user/clients requires admin-or-lawyer and /user is
// admin-only, so the bulk load fetches clients only for those roles.
const canFetchClients = (role) => role === ROLES.SYSADMIN || role === ROLES.ABOGADO;

// Resolver maps keyed by Guid ids: userNames[id] -> display name and
// caseNumberById[caseId] -> case number. The session user is always included
// so records owned by the session user never lose their display name.
const buildNameById = (peopleLists, currentUser = null) => {
  const nameById = {};

  peopleLists.forEach((people) => {
    (people ?? []).forEach((person) => {
      if (person?.id) {
        nameById[person.id] = person.name ?? '';
      }
    });
  });

  if (currentUser?.id) {
    nameById[currentUser.id] = currentUser.name ?? '';
  }

  return nameById;
};

const buildCaseNumberById = (caseSource) => {
  const caseNumberById = {};

  (caseSource ?? []).forEach((legalCase) => {
    if (legalCase?.id) {
      caseNumberById[legalCase.id] = legalCase.caseNumber ?? '';
    }
  });

  return caseNumberById;
};

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

  // Resolver maps derived from the current state so every refresh remaps
  // against the latest known people and case numbers.
  const nameById = useMemo(
    () => buildNameById([lawyers, clients, users], user),
    [lawyers, clients, users, user],
  );
  const caseNumberById = useMemo(() => buildCaseNumberById(cases), [cases]);

  const refreshCases = useCallback(async () => {
    const rawCases = await casesApi.getAllRaw();
    setCases(rawCases.map((legalCase) => mapCase(legalCase, nameById)));
  }, [nameById]);

  const refreshAppointments = useCallback(async () => {
    const rawAppointments = await appointmentsApi.getAllRaw();
    setAppointments(
      sortAppointments(
        rawAppointments.map((appointment) =>
          mapAppointment(appointment, nameById, caseNumberById),
        ),
      ),
    );
  }, [nameById, caseNumberById]);

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
      // Fetch the raw dto arrays for every role-fetchable resource in one
      // parallel batch (users only for sysadmin), build the resolver maps from
      // those lists, then map each resource exactly once.
      const [rawCases, rawAppointments, fetchedLawyers, fetchedClients, fetchedUsers] =
        await Promise.all([
          casesApi.getAllRaw(),
          appointmentsApi.getAllRaw(),
          usersApi.getLawyers(),
          canFetchClients(role) ? usersApi.getClients() : [],
          role === ROLES.SYSADMIN ? usersApi.getAll() : [],
        ]);

      const bulkNameById = buildNameById([fetchedLawyers, fetchedClients, fetchedUsers], user);
      const bulkCaseNumberById = buildCaseNumberById(rawCases);

      setUsers(fetchedUsers);
      setLawyers(fetchedLawyers);
      setClients(fetchedClients);
      setCases(rawCases.map((legalCase) => mapCase(legalCase, bulkNameById)));
      setAppointments(
        sortAppointments(
          rawAppointments.map((appointment) =>
            mapAppointment(appointment, bulkNameById, bulkCaseNumberById),
          ),
        ),
      );
    } catch (refreshError) {
      setError(refreshError.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [token, role, user]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;

    (async () => {
      // Yield to a callback frame so every setState in this refetch is async.
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      setError('');
      await refreshAll();
    })();

    return () => {
      active = false;
    };
  }, [refreshAll, token]);

  const contextValue = useMemo(
    () => ({
      cases,
      appointments,
      users,
      lawyers,
      clients,
      nameById,
      caseNumberById,
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
      nameById,
      caseNumberById,
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
