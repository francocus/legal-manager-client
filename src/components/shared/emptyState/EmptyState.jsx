import './EmptyState.css';

const EmptyState = ({ title = 'Sin resultados', message, icon, action }) => (
  <div className="empty-state">
    {icon ? (
      <span className="empty-state__icon" aria-hidden="true">
        {icon}
      </span>
    ) : null}
    <p className="empty-state__title">{title}</p>
    {message ? <p className="empty-state__message">{message}</p> : null}
    {action ? <div className="empty-state__action">{action}</div> : null}
  </div>
);

export default EmptyState;
