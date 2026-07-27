import { useRef } from "react";
import { useModalDialog } from "../../hooks/useModalDialog.js";

export function ResetCycleConfirmation({ onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, cancelButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="reset-cycle-description"
        aria-labelledby="reset-cycle-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
        tabIndex="-1"
      >
        <div className="delete-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="reset-cycle-title">Reset this Focus cycle?</h2>
        <p className="modal-copy" id="reset-cycle-description">
          This cancels the current session and clears the completed intervals
          in this cycle. Saved History, XP, achievements, and task progress will
          remain.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Keep cycle
          </button>
          <button className="button button--danger" onClick={onConfirm} type="button">
            Reset cycle
          </button>
        </div>
      </section>
    </div>
  );
}
