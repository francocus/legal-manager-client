// Row-level trash actions shared by every papelera table. Restore is the
// reversible path (no confirmation); the hard delete asks through
// ConfirmDialog in the container.
const TrashActions = ({ onRestore, onDelete, deleteDisabled = false, deleteTitle }) => (
  <div className="trash-row-actions">
    <button type="button" className="trash-row-button trash-row-button--secondary" onClick={onRestore}>
      Restaurar
    </button>
    <button
      type="button"
      className="trash-row-button trash-row-button--danger"
      onClick={onDelete}
      disabled={deleteDisabled}
      title={deleteTitle}
    >
      Borrar definitivamente
    </button>
  </div>
);

export default TrashActions;
