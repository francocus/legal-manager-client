import { Link } from 'react-router';
import { getStatusClass, getStatusLabel } from '../../cases/Cases.data';

const CasesItem = ({
  currentUser,
  id,
  caseNumber,
  title,
  clientName,
  lawyerName,
  area,
  status,
  onEdit,
  onDelete,
}) => {
  const canEdit = currentUser?.role === 'sysadmin' || currentUser?.role === 'abogado';
  const canDelete = currentUser?.role === 'sysadmin';

  return (
    <article className="cases-item">
      <Link to={`/dashboard/cases/${id}`} className="cases-item__link">
        <div className="cases-item__row">
          <span className="cases-item__label">Expediente</span>
          <span className={`cases-item__status ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>
        <h2 className="cases-item__title">{caseNumber}</h2>
        <p className="cases-item__subtitle">{title}</p>
        <div className="cases-item__meta">
          <span>
            <b>Cliente</b> {clientName}
          </span>
          <span>
            <b>Abogado</b> {lawyerName}
          </span>
          <span>
            <b>Área</b> {area || '—'}
          </span>
        </div>
      </Link>

      {canEdit ? (
        <div className="cases-item__footer">
          <button
            className="cases-item__action cases-item__action--edit"
            type="button"
            title="Editar expediente"
            aria-label="Editar expediente"
            onClick={() => onEdit?.(id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 17.25V20h2.75L18.81 7.94l-2.75-2.75L4 17.25Zm14.71-9.54a.996.996 0 0 0 0-1.41l-1.01-1.01a.996.996 0 1 0-1.41 1.41l1.01 1.01c.39.39 1.03.39 1.41 0Z" />
            </svg>
          </button>
          {canDelete ? (
            <button
              className="cases-item__action cases-item__action--delete"
              type="button"
              title="Eliminar expediente"
              aria-label="Eliminar expediente"
              onClick={() => onDelete?.(id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 3.75h6l1 1.5H20v1.5H4v-1.5h4l1-1.5Zm1.5 5.25h1.5v7.5h-1.5v-7.5Zm4.5 0h1.5v7.5H15v-7.5Zm-8.25 0h1.5v7.5h-1.5v-7.5Zm1.5 11.25h9A1.75 1.75 0 0 0 19 18v-8.25H5V18c0 .97.78 1.75 1.75 1.75Z" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export default CasesItem;
