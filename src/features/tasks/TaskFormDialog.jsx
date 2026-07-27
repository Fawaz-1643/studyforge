import { useRef, useState } from "react";
import { ThemedSelect } from "../../components/ui/ThemedSelect.jsx";
import { TASK_ESTIMATE_MAX, TASK_ESTIMATE_MIN, TASK_TITLE_MAX_LENGTH, validateTaskDetails } from "../../domain/tasks.js";
import { useModalDialog } from "../../hooks/useModalDialog.js";

export function TaskForm({ courses, onCancel, onSave, task }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [courseId, setCourseId] = useState(task?.courseId ?? courses[0]?.id ?? "");
  const [estimate, setEstimate] = useState(
    String(task?.estimatedPomodoros ?? 1),
  );
  const [formError, setFormError] = useState("");
  const [formErrorField, setFormErrorField] = useState(null);
  const titleInputRef = useRef(null);
  const courseSelectRef = useRef(null);
  const estimateInputRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, titleInputRef);

  function handleSubmit(event) {
    event.preventDefault();
    const validation = validateTaskDetails(
      {
        title,
        courseId,
        estimatedPomodoros: estimate,
      },
      courses,
    );

    if (validation.error) {
      setFormError(validation.error);
      setFormErrorField(validation.field);

      if (validation.field === "title") {
        titleInputRef.current?.focus();
      } else if (validation.field === "course") {
        courseSelectRef.current?.focus();
      } else if (validation.field === "estimate") {
        estimateInputRef.current?.focus();
      }

      return;
    }

    setFormError("");
    setFormErrorField(null);
    onSave(validation.taskDetails);
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="modal-heading">
          <div>
            <p className="section-kicker">{task ? "Update task" : "New task"}</p>
            <h2 id="task-form-title">{task ? "Edit task" : "Add a task"}</h2>
          </div>
          <button
            aria-label="Close"
            className="icon-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="task-title">
            Task title
          </label>
          <input
            aria-describedby={`task-title-help${
              formErrorField === "title" ? " task-form-error" : ""
            }`}
            aria-invalid={formErrorField === "title"}
            autoComplete="off"
            className="text-input"
            id="task-title"
            maxLength={TASK_TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Review lecture notes"
            ref={titleInputRef}
            value={title}
          />
          <p className="field-help" id="task-title-help">
            Required · Up to {TASK_TITLE_MAX_LENGTH} characters
          </p>

          <div className="task-form-fields">
            <div>
              <span className="field-label" id="task-course-label">
                Course
              </span>
              <ThemedSelect
                describedBy={
                  formErrorField === "course" ? "task-form-error" : undefined
                }
                invalid={formErrorField === "course"}
                labelId="task-course-label"
                onChange={setCourseId}
                options={courses.map((course) => ({
                  label: course.name,
                  value: course.id,
                }))}
                ref={courseSelectRef}
                value={courseId}
              />
            </div>
            <label>
              <span className="field-label">Estimated Pomodoros</span>
              <input
                aria-describedby={`task-estimate-help${
                  formErrorField === "estimate" ? " task-form-error" : ""
                }`}
                aria-invalid={formErrorField === "estimate"}
                className="text-input"
                inputMode="numeric"
                max={TASK_ESTIMATE_MAX}
                min={TASK_ESTIMATE_MIN}
                onChange={(event) => setEstimate(event.target.value)}
                ref={estimateInputRef}
                step="1"
                type="number"
                value={estimate}
              />
              <span className="field-help" id="task-estimate-help">
                Estimated Focus sessions only
              </span>
            </label>
          </div>

          <p
            className={`form-message task-form-message${
              formError ? " form-message--error" : ""
            }`}
            id="task-form-error"
            role={formError ? "alert" : undefined}
          >
            {formError ||
              "This estimate stays unchanged when timer sessions finish."}
          </p>

          <div className="modal-actions">
            <button className="button button--secondary" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="button button--primary" type="submit">
              {task ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
