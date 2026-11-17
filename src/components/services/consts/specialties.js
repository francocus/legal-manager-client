// Curated list of practice areas. Keep it short: the product only works with
// these five areas, and both the profile selector and the case forms read from
// this single source.
export const LEGAL_SPECIALTIES = [
  'Civil',
  'Comercial',
  'Penal',
  'Laboral',
  'Familia',
];

// Values stored before the list was trimmed (or typed with different casing)
// are mapped back to the canonical label so old rows do not inject extra
// options into the UI. Unknown values are dropped: the area list is the only
// accepted vocabulary.
export const normalizeSpecialty = (value) => {
  const needle = String(value ?? '').trim().toLowerCase();
  if (!needle) return null;
  return LEGAL_SPECIALTIES.find((specialty) => specialty.toLowerCase() === needle) ?? null;
};

export const normalizeSpecialties = (values) => {
  const list = Array.isArray(values)
    ? values
    : String(values ?? '').split(',');

  return [...new Set(list.map(normalizeSpecialty).filter(Boolean))];
};
