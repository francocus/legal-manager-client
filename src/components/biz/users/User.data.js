import { ROLE_LABELS, ROLES, mapApiRole } from '../../services/consts/roles';

export const mapUser = (user = {}) => ({
  ...user,
  role: mapApiRole(user.type ?? user.role),
  name:
    user.name ?? user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
  active: user.active ?? true,
  phone: user.phone ?? '',
  address: user.address ?? '',
  barNumber: user.barNumber ?? '',
  specialties: Array.isArray(user.specialties)
    ? user.specialties
    : typeof user.specialties === 'string' && user.specialties.trim()
      ? user.specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
});

export const getRoleClass = (role) => {
  switch (role) {
    case ROLES.ADMIN:
    case 'sysadmin':
      return 'is-admin';
    case ROLES.ABOGADO:
      return 'is-abogado';
    case ROLES.CLIENTE:
      return 'is-cliente';
    default:
      return '';
  }
};

export const getActiveClass = (active) => (active ? 'is-active' : 'is-inactive');

export const getRoleLabel = (role) => ROLE_LABELS[role] ?? role;
