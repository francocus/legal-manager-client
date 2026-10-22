export const ROLES = {
  CLIENTE: 'cliente',
  ABOGADO: 'abogado',
  SYSADMIN: 'sysadmin',
};

export const ROLE_OPTIONS = [
  { value: ROLES.CLIENTE, label: 'Cliente' },
  { value: ROLES.ABOGADO, label: 'Abogado' },
  { value: ROLES.SYSADMIN, label: 'Sys Admin' },
];

export const ROLE_LABELS = {
  [ROLES.CLIENTE]: 'Cliente',
  [ROLES.ABOGADO]: 'Abogado',
  [ROLES.SYSADMIN]: 'Sys Admin',
};

export const isClient = (role) => role === ROLES.CLIENTE;
export const isLawyer = (role) => role === ROLES.ABOGADO;
export const isSysadmin = (role) => role === ROLES.SYSADMIN;
