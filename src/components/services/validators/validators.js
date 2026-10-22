export const isRequired = (value) => String(value ?? '').trim().length > 0;

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());

export const isDni = (value) => /^\d{7,8}$/.test(String(value ?? '').replace(/\D/g, ''));

export const isPhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 0 || digits.length >= 8;
};

export const formatDni = (value) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 8);

export const formatPhone = (value) =>
  String(value ?? '')
    .replace(/[^\d+\-\s()]/g, '')
    .slice(0, 20);
