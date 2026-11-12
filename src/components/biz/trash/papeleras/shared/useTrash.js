import { useCallback, useEffect, useState } from 'react';
import { trashApi } from '../../../../services/api/trashApi';
import { useToast } from '../../../../shared/toast/toast.context';

export const EMPTY_TRASH = { cases: [], appointments: [], documents: [], users: [] };

const RESTORE_BY_KIND = {
  case: trashApi.restoreCase,
  appointment: trashApi.restoreAppointment,
  document: trashApi.restoreDocument,
  user: trashApi.restoreUser,
};

const DELETE_BY_KIND = {
  case: trashApi.hardDeleteCase,
  appointment: trashApi.hardDeleteAppointment,
  document: trashApi.hardDeleteDocument,
  user: trashApi.hardDeleteUser,
};

// Shared state for the four per-module papelera views: one GET /trash feeds
// every page, and each container picks the lists it renders. Restore needs no
// confirmation; the delete errors are rethrown so the shared ConfirmDialog
// stays open while the toast reports the API message.
export const useTrash = () => {
  const { showToast } = useToast();
  const [trash, setTrash] = useState(EMPTY_TRASH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTrash = useCallback(async () => {
    try {
      const data = await trashApi.getTrash();
      setTrash(data);
      setError(null);
    } catch (loadError) {
      // Keep the page standing with a clear inline error instead of an
      // empty-looking papelera.
      setTrash(EMPTY_TRASH);
      setError(loadError.message || 'No se pudo cargar la papelera.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Yield to a callback frame so every setState in this fetch is async (same
  // pattern as DashboardDataProvider); refetches go through reload, which
  // shows the skeletons again while it runs.
  useEffect(() => {
    let active = true;

    (async () => {
      await Promise.resolve();
      if (!active) return;
      await fetchTrash();
    })();

    return () => {
      active = false;
    };
  }, [fetchTrash]);

  const reload = useCallback(async () => {
    setLoading(true);
    await fetchTrash();
  }, [fetchTrash]);

  const restore = useCallback(
    async (kind, id) => {
      const restoreByKind = RESTORE_BY_KIND[kind];
      if (!restoreByKind || id == null || id === '') {
        return;
      }
      try {
        await restoreByKind(id);
        showToast({ variant: 'success', message: 'Restaurado correctamente.' });
        await reload();
      } catch (restoreError) {
        showToast({
          variant: 'danger',
          message: restoreError.message || 'No se pudo restaurar el registro.',
        });
      }
    },
    [reload, showToast],
  );

  const confirmDelete = useCallback(async () => {
    const { kind, id } = itemToDelete ?? {};
    try {
      await DELETE_BY_KIND[kind]?.(id);
      setItemToDelete(null);
      showToast({ variant: 'success', message: 'Eliminado definitivamente.' });
      await reload();
    } catch (deleteError) {
      showToast({
        variant: 'danger',
        message: deleteError.message || 'No se pudo eliminar el registro.',
      });
      throw deleteError;
    }
  }, [itemToDelete, reload, showToast]);

  return { trash, loading, error, reload, restore, itemToDelete, setItemToDelete, confirmDelete };
};
