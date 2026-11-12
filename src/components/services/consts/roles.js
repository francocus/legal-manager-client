export const ROLES = {
  CLIENTE: 'cliente',
  ABOGADO: 'abogado',
  ADMIN: 'admin',
  SYSADMIN: 'admin',
};

export const ROLE_OPTIONS = [
  { value: ROLES.CLIENTE, label: 'Cliente' },
  { value: ROLES.ABOGADO, label: 'Abogado' },
  { value: ROLES.ADMIN, label: 'Administrador' },
];

export const ROLE_LABELS = {
  [ROLES.CLIENTE]: 'Cliente',
  [ROLES.ABOGADO]: 'Abogado',
  [ROLES.ADMIN]: 'Administrador',
  sysadmin: 'Administrador',
};

export const isClient = (role) => role === ROLES.CLIENTE;
export const isLawyer = (role) => role === ROLES.ABOGADO;
export const isAdmin = (role) => role === ROLES.ADMIN || role === 'sysadmin';
export const isSysadmin = isAdmin;

export const mapApiRole = (value) => {
  const role = String(value ?? '').toLowerCase();
  if (role === 'admin' || role === 'sysadmin') return ROLES.ADMIN;
  if (role === 'lawyer' || role === 'abogado') return ROLES.ABOGADO;
  if (role === 'client' || role === 'cliente') return ROLES.CLIENTE;
  return role;
};
