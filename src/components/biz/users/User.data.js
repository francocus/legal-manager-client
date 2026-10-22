import { ROLE_LABELS, ROLES } from '../../services/consts/roles';

export const mapUser = (user = {}) => ({
  ...user,
  name: user.name ?? [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
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
