import { useRef } from "react";
import { useModalDialog } from "../../hooks/useModalDialog.js";

export function DeleteConfirmation({ course, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, cancelButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="delete-course-description"
        aria-labelledby="delete-title"
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
        <h2 id="delete-title">Delete {course.name}?</h2>
        <p className="modal-copy" id="delete-course-description">
          This removes the course from this device. This action can’t be undone.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Keep course
          </button>
          <button className="button button--danger" onClick={onConfirm} type="button">
            Delete course
          </button>
        </div>
      </section>
    </div>
  );
}

export function CourseDeleteBlocked({ course, linkedTaskCount, onClose, onViewTasks }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useModalDialog(onClose, closeButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-describedby="course-delete-blocked-description"
        aria-labelledby="course-delete-blocked-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
        tabIndex="-1"
      >
        <div className="blocked-symbol" aria-hidden="true">
          ↗
        </div>
        <h2 id="course-delete-blocked-title">This course is still in use</h2>
        <p className="modal-copy" id="course-delete-blocked-description">
          {course.name} has {linkedTaskCount} linked{" "}
          {linkedTaskCount === 1 ? "task" : "tasks"}. Move those tasks to another
          course or delete them before deleting this course.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Keep course
          </button>
          <button className="button button--primary" onClick={onViewTasks} type="button">
            View tasks
          </button>
        </div>
      </section>
    </div>
  );
}
