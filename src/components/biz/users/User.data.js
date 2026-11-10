import { ROLE_LABELS, ROLES, mapApiRole } from '../../services/consts/roles';

export const mapUser = (user = {}) => ({
  ...user,
  role: mapApiRole(user.type ?? user.role),
  name:
    user.name ??
    user.fullName ??
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
  active: user.active ?? true,
});

export const getRoleClass = (role) => {
  switch (role) {
    case ROLES.SYSADMIN:
      return 'is-sysadmin';
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
