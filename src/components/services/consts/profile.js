import { isAdmin, isClient, isLawyer, mapApiRole } from './roles';

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

const normalizeRole = (user) => mapApiRole(user?.role || user?.type);

/**
 * Devuelve los campos que faltan para considerar completo el perfil.
 * Los roles se normalizan con los helpers de ./roles: admin siempre está
 * completo, abogado necesita teléfono y horarios, cliente teléfono y dirección.
 */
export const getProfileMissingFields = (user) => {
  const role = normalizeRole(user);

  if (isAdmin(role)) return [];

  if (isLawyer(role)) {
    return [!hasValue(user?.phone) && 'phone', !hasValue(user?.schedule) && 'schedule'].filter(
      Boolean,
    );
  }

  if (isClient(role)) {
    return [!hasValue(user?.phone) && 'phone', !hasValue(user?.address) && 'address'].filter(
      Boolean,
    );
  }

  return [];
};

export const isProfileComplete = (user) => getProfileMissingFields(user).length === 0;
