import { useRef } from "react";
import { useModalDialog } from "../../hooks/useModalDialog.js";

export function TaskDeleteConfirmation({ onCancel, onConfirm, task }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, cancelButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="task-delete-description"
        aria-labelledby="task-delete-title"
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
        <h2 id="task-delete-title">Delete this task?</h2>
        <p className="modal-copy" id="task-delete-description">
          “{task.title}” will be removed from this task list. This action can’t be
          undone.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Keep task
          </button>
          <button className="button button--danger" onClick={onConfirm} type="button">
            Delete task
          </button>
        </div>
      </section>
    </div>
  );
}

export function DeleteCompletedTasksConfirmation({ count, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, cancelButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="completed-tasks-delete-description"
        aria-labelledby="completed-tasks-delete-title"
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
        <h2 id="completed-tasks-delete-title">
          Delete {count} completed {count === 1 ? "task" : "tasks"}?
        </h2>
        <p className="modal-copy" id="completed-tasks-delete-description">
          This removes only completed tasks from the task list. Their saved
          Focus history, statistics, and earned XP will remain.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Keep tasks
          </button>
          <button className="button button--danger" onClick={onConfirm} type="button">
            Delete completed
          </button>
        </div>
      </section>
    </div>
  );
}
