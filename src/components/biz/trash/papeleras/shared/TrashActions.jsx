// Row-level trash action shared by every papelera table. The papelera is an
// archive of baja'd items: restore is the only action and needs no
// confirmation because it is reversible.
const TrashActions = ({ onRestore }) => (
  <div className="trash-row-actions">
    <button type="button" className="trash-row-button trash-row-button--secondary" onClick={onRestore}>
      Restaurar
    </button>
  </div>
);

export default TrashActions;
