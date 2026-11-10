export const CASE_STATUS_OPTIONS = [
  { value: 'activo', label: 'Activo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'cerrado', label: 'Cerrado' },
];

// The backend sends flat dto rows with ids only (no nested client/lawyer
// objects), so display names come from the userNames resolver map.
export const mapCase = (legalCase = {}, userNames = {}) => {
  const clientId = legalCase.clientId ?? legalCase.client?.id ?? '';
  const lawyerId = legalCase.lawyerId ?? legalCase.lawyerIds?.[0] ?? legalCase.lawyer?.id ?? '';

  return {
    id: legalCase.id,
    caseNumber: legalCase.caseNumber ?? '',
    title: legalCase.title ?? '',
    area: legalCase.area ?? '',
    status: legalCase.status ?? 'activo',
    startDate: legalCase.startDate ?? '',
    lastUpdate: legalCase.lastUpdate ?? '',
    description: legalCase.description ?? '',
    notes: legalCase.notes ?? '',
    clientId,
    lawyerId,
    clientName: userNames[clientId] ?? legalCase.client?.name ?? 'Sin cliente',
    lawyerName: userNames[lawyerId] ?? legalCase.lawyer?.name ?? 'Sin abogado',
  };
};

export const getStatusClass = (status = '') => {
  const normalizedStatus = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');

  switch (normalizedStatus) {
    case 'activo':
    case 'abierto':
      return 'is-active';
    case 'pendiente':
      return 'is-pending';
    case 'cerrado':
    case 'finalizado':
    case 'archivado':
      return 'is-closed';
    case 'cancelado':
    case 'canceled':
      return 'is-cancelled';
    default:
      return '';
  }
};

export const getStatusLabel = (status = '') => {
  const normalizedStatus = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');

  switch (normalizedStatus) {
    case 'activo':
    case 'abierto':
      return 'Activo';
    case 'pendiente':
      return 'Pendiente';
    case 'cerrado':
    case 'finalizado':
      return 'Cerrado';
    case 'archivado':
      return 'Archivado';
    case 'cancelado':
    case 'canceled':
      return 'Cancelado';
    default:
      return status;
  }
};
