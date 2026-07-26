import { useEffect, useRef, useState } from "react";
import {
  countTasksForCourse,
  deleteTaskFromList,
  filterTasks,
  getTaskCounts,
  saveTaskInList,
  TASK_ESTIMATE_MAX,
  TASK_ESTIMATE_MIN,
  TASK_TITLE_MAX_LENGTH,
  toggleTaskInList,
  validateTaskDetails,
} from "./taskUtils.js";

const COURSE_STORAGE_KEY = "studyforge:courses";
const PROFILE_STORAGE_KEY = "studyforge:profile";
const TIMER_SETTINGS_STORAGE_KEY = "studyforge:timer-settings";
const COURSE_COLORS = [
  { name: "Violet", value: "#9b87f5" },
  { name: "Blue", value: "#5b9cf6" },
  { name: "Cyan", value: "#45c7d4" },
  { name: "Green", value: "#61d6a7" },
  { name: "Amber", value: "#f2b95f" },
  { name: "Coral", value: "#ef7e75" },
  { name: "Pink", value: "#e884c4" },
];
const DEFAULT_TIMER_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  focusSessionsPerCycle: 4,
  autoStart: false,
  soundEnabled: true,
};
const TIMER_MODES = [
  { id: "focus", label: "Focus", durationKey: "focusMinutes" },
  { id: "short-break", label: "Short Break", durationKey: "shortBreakMinutes" },
  { id: "long-break", label: "Long Break", durationKey: "longBreakMinutes" },
];

function loadCourses() {
  try {
    const savedCourses = JSON.parse(localStorage.getItem(COURSE_STORAGE_KEY));

    if (!Array.isArray(savedCourses)) {
      return [];
    }

    return savedCourses.filter(
      (course) =>
        typeof course?.id === "string" &&
        typeof course?.name === "string" &&
        typeof course?.color === "string",
    );
  } catch {
    return [];
  }
}

function loadProfile() {
  try {
    const savedProfile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));

    return {
      university:
        typeof savedProfile?.university === "string" ? savedProfile.university : "",
      fieldOfStudy:
        typeof savedProfile?.fieldOfStudy === "string" ? savedProfile.fieldOfStudy : "",
    };
  } catch {
    return { university: "", fieldOfStudy: "" };
  }
}

function loadTimerSettings() {
  try {
    const savedSettings = JSON.parse(
      localStorage.getItem(TIMER_SETTINGS_STORAGE_KEY),
    );
    const isWholeNumberBetween = (value, minimum, maximum) =>
      Number.isInteger(value) && value >= minimum && value <= maximum;

    return {
      focusMinutes: isWholeNumberBetween(savedSettings?.focusMinutes, 1, 180)
        ? savedSettings.focusMinutes
        : DEFAULT_TIMER_SETTINGS.focusMinutes,
      shortBreakMinutes: isWholeNumberBetween(
        savedSettings?.shortBreakMinutes,
        1,
        180,
      )
        ? savedSettings.shortBreakMinutes
        : DEFAULT_TIMER_SETTINGS.shortBreakMinutes,
      longBreakMinutes: isWholeNumberBetween(
        savedSettings?.longBreakMinutes,
        1,
        180,
      )
        ? savedSettings.longBreakMinutes
        : DEFAULT_TIMER_SETTINGS.longBreakMinutes,
      focusSessionsPerCycle: isWholeNumberBetween(
        savedSettings?.focusSessionsPerCycle,
        1,
        99,
      )
        ? savedSettings.focusSessionsPerCycle
        : DEFAULT_TIMER_SETTINGS.focusSessionsPerCycle,
      autoStart:
        typeof savedSettings?.autoStart === "boolean"
          ? savedSettings.autoStart
          : DEFAULT_TIMER_SETTINGS.autoStart,
      soundEnabled:
        typeof savedSettings?.soundEnabled === "boolean"
          ? savedSettings.soundEnabled
          : DEFAULT_TIMER_SETTINGS.soundEnabled,
    };
  } catch {
    return { ...DEFAULT_TIMER_SETTINGS };
  }
}

function createCourseId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function createTaskId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function getTimerMode(modeId) {
  return TIMER_MODES.find((mode) => mode.id === modeId) ?? TIMER_MODES[0];
}

function getTimerDurationSeconds(modeId, settings) {
  const mode = getTimerMode(modeId);
  return settings[mode.durationKey] * 60;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function PlusIcon() {
  return <span className="plus-icon" aria-hidden="true" />;
}

function ProfilePanel({ profile, onSave }) {
  const hasProfile = Boolean(profile.university || profile.fieldOfStudy);
  const [isEditing, setIsEditing] = useState(!hasProfile);
  const [university, setUniversity] = useState(profile.university);
  const [fieldOfStudy, setFieldOfStudy] = useState(profile.fieldOfStudy);

  function handleSubmit(event) {
    event.preventDefault();

    const nextProfile = {
      university: university.trim(),
      fieldOfStudy: fieldOfStudy.trim(),
    };

    onSave(nextProfile);

    if (nextProfile.university || nextProfile.fieldOfStudy) {
      setIsEditing(false);
    }
  }

  function cancelEditing() {
    setUniversity(profile.university);
    setFieldOfStudy(profile.fieldOfStudy);
    setIsEditing(false);
  }

  if (!isEditing && hasProfile) {
    return (
      <section className="profile-panel profile-panel--saved" aria-labelledby="profile-title">
        <div className="profile-avatar" aria-hidden="true">
          <span />
        </div>
        <div className="profile-details">
          <p className="section-kicker">Student profile</p>
          <h2 id="profile-title">Your study space</h2>
          <dl>
            {profile.fieldOfStudy && (
              <div>
                <dt>Field of study</dt>
                <dd>{profile.fieldOfStudy}</dd>
              </div>
            )}
            {profile.university && (
              <div>
                <dt>University</dt>
                <dd>{profile.university}</dd>
              </div>
            )}
          </dl>
        </div>
        <button
          className="button button--secondary profile-edit-button"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Edit profile
        </button>
      </section>
    );
  }

  return (
    <section className="profile-panel" aria-labelledby="profile-title">
      <div className="profile-intro">
        <div>
          <p className="section-kicker">Make it yours</p>
          <h2 id="profile-title">Set up your study space</h2>
        </div>
        <p>
          Add a little context to StudyForge. Both details are optional and stay on
          this device.
        </p>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-fields">
          <label>
            <span className="field-label">
              University <span className="optional-label">Optional</span>
            </span>
            <input
              autoComplete="organization"
              className="text-input"
              maxLength={80}
              onChange={(event) => setUniversity(event.target.value)}
              placeholder="e.g. University of Dubai"
              value={university}
            />
          </label>
          <label>
            <span className="field-label">
              Field of study <span className="optional-label">Optional</span>
            </span>
            <input
              autoComplete="off"
              className="text-input"
              maxLength={80}
              onChange={(event) => setFieldOfStudy(event.target.value)}
              placeholder="e.g. Computer Science"
              value={fieldOfStudy}
            />
          </label>
        </div>
        <div className="profile-form-actions">
          {hasProfile && (
            <button
              className="button button--secondary"
              onClick={cancelEditing}
              type="button"
            >
              Cancel
            </button>
          )}
          <button
            className="button button--primary"
            disabled={!university.trim() && !fieldOfStudy.trim()}
            type="submit"
          >
            Save profile
          </button>
        </div>
      </form>
    </section>
  );
}

function CourseForm({ course, onCancel, onSave }) {
  const [name, setName] = useState(course?.name ?? "");
  const [color, setColor] = useState(course?.color ?? COURSE_COLORS[0].value);
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      nameInputRef.current?.focus();
      return;
    }

    onSave({ name: trimmedName, color });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="course-form-title"
        aria-modal="true"
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <p className="section-kicker">{course ? "Update course" : "New course"}</p>
            <h2 id="course-form-title">
              {course ? "Edit course" : "Add a course"}
            </h2>
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
          <label className="field-label" htmlFor="course-name">
            Course name
          </label>
          <input
            autoComplete="off"
            className="text-input"
            id="course-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Organic Chemistry"
            ref={nameInputRef}
            required
            value={name}
          />

          <fieldset>
            <legend>Course color</legend>
            <div className="color-options">
              {COURSE_COLORS.map((option) => (
                <label
                  className={`color-option${color === option.value ? " is-selected" : ""}`}
                  key={option.value}
                  style={{ "--course-color": option.value }}
                  title={option.name}
                >
                  <input
                    checked={color === option.value}
                    name="course-color"
                    onChange={() => setColor(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span aria-hidden="true" />
                  <span className="sr-only">{option.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="modal-actions">
            <button className="button button--secondary" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="button button--primary" type="submit">
              {course ? "Save changes" : "Add course"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteConfirmation({ course, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="delete-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <div className="delete-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="delete-title">Delete {course.name}?</h2>
        <p className="modal-copy">
          This removes the course from this device. This action can’t be undone.
        </p>
        <div className="modal-actions">
          <button className="button button--secondary" onClick={onCancel} type="button">
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

function DashboardView({ courses, profile, onNavigate }) {
  const hasProfile = Boolean(profile.university || profile.fieldOfStudy);

  return (
    <section className="page-content" aria-labelledby="dashboard-title">
      <div className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Dashboard
          </div>
          <h1 id="dashboard-title">Your study space</h1>
          <p className="page-copy">
            Everything you’ve set up so far, kept simple and easy to reach.
          </p>
        </div>
      </div>

      <div className="overview-grid">
        <article className="overview-card">
          <div className="overview-card-heading">
            <div className="overview-icon overview-icon--profile" aria-hidden="true">
              <span />
            </div>
            <span className="overview-status">{hasProfile ? "Set up" : "Not set"}</span>
          </div>
          <p className="section-kicker">Student profile</p>
          <h2>{profile.fieldOfStudy || "Add your field of study"}</h2>
          <p className="overview-copy">
            {profile.university ||
              "Add an optional university and field to personalize your space."}
          </p>
          <button
            className="text-link"
            onClick={() => onNavigate("profile")}
            type="button"
          >
            {hasProfile ? "View profile" : "Set up profile"}
            <span aria-hidden="true">→</span>
          </button>
        </article>

        <article className="overview-card">
          <div className="overview-card-heading">
            <div className="overview-icon overview-icon--courses" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="overview-status">
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </span>
          </div>
          <p className="section-kicker">Course library</p>
          <h2>{courses.length ? "Your subjects are ready" : "Build your course list"}</h2>
          <div className="course-preview">
            {courses.length ? (
              courses.slice(0, 3).map((course) => (
                <span key={course.id}>
                  <i style={{ "--course-color": course.color }} />
                  {course.name}
                </span>
              ))
            ) : (
              <p className="overview-copy">
                Add each subject with a name and recognizable color.
              </p>
            )}
          </div>
          <button
            className="text-link"
            onClick={() => onNavigate("courses")}
            type="button"
          >
            {courses.length ? "Manage courses" : "Add a course"}
            <span aria-hidden="true">→</span>
          </button>
        </article>
      </div>

      <aside className="dashboard-note">
        <span className="dashboard-note-mark" aria-hidden="true">
          i
        </span>
        <div>
          <strong>Your information stays on this device</strong>
          <p>StudyForge saves your profile and courses in this browser.</p>
        </div>
      </aside>
    </section>
  );
}

function CoursesView({ courses, onAdd, onDelete, onEdit }) {
  return (
    <section
      className="page-content courses-view"
      aria-labelledby="courses-title"
    >
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Course library
          </div>
          <h1 id="courses-title">Your courses</h1>
          <p className="page-copy">
            Give every subject a home and a color you’ll recognize at a glance.
          </p>
        </div>
        <button className="button button--primary add-button" onClick={onAdd}>
          <PlusIcon />
          Add course
        </button>
      </div>

      <div className="course-summary" aria-live="polite">
        <span>{courses.length}</span> {courses.length === 1 ? "course" : "courses"}
        <span className="summary-divider" aria-hidden="true" />
        Saved on this device
      </div>

      {courses.length === 0 ? (
        <section className="empty-state">
          <div className="empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>No courses yet</h2>
          <p>Add the subjects you’re studying. You can rename or recolor them anytime.</p>
          <button className="button button--primary" onClick={onAdd}>
            <PlusIcon />
            Add your first course
          </button>
        </section>
      ) : (
        <ul className="course-grid">
          {courses.map((course) => (
            <li
              className="course-card"
              key={course.id}
              style={{ "--course-color": course.color }}
            >
              <div className="course-color" aria-hidden="true" />
              <div className="course-content">
                <p className="course-label">Course</p>
                <h2>{course.name}</h2>
              </div>
              <div className="course-actions">
                <button
                  className="text-button"
                  onClick={() => onEdit(course)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="text-button text-button--danger"
                  onClick={() => onDelete(course)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskForm({ courses, onCancel, onSave, task }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [courseId, setCourseId] = useState(task?.courseId ?? courses[0]?.id ?? "");
  const [estimate, setEstimate] = useState(
    String(task?.estimatedPomodoros ?? 1),
  );
  const [formError, setFormError] = useState("");
  const titleInputRef = useRef(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

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

      if (
        !title.trim() ||
        title.trim().length > TASK_TITLE_MAX_LENGTH
      ) {
        titleInputRef.current?.focus();
      }

      return;
    }

    setFormError("");
    onSave(validation.taskDetails);
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
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
            aria-describedby={formError ? "task-form-error" : "task-title-help"}
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
            <label>
              <span className="field-label">Course</span>
              <select
                className="text-input select-input"
                onChange={(event) => setCourseId(event.target.value)}
                value={courseId}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Estimated Pomodoros</span>
              <input
                aria-describedby={formError ? "task-form-error" : "task-estimate-help"}
                className="text-input"
                inputMode="numeric"
                max={TASK_ESTIMATE_MAX}
                min={TASK_ESTIMATE_MIN}
                onChange={(event) => setEstimate(event.target.value)}
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

function TaskDeleteConfirmation({ onCancel, onConfirm, task }) {
  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="task-delete-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <div className="delete-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="task-delete-title">Delete this task?</h2>
        <p className="modal-copy">
          “{task.title}” will be removed from this task list. This action can’t be
          undone.
        </p>
        <div className="modal-actions">
          <button className="button button--secondary" onClick={onCancel} type="button">
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

function CourseDeleteBlocked({ course, linkedTaskCount, onClose, onViewTasks }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="course-delete-blocked-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <div className="blocked-symbol" aria-hidden="true">
          ↗
        </div>
        <h2 id="course-delete-blocked-title">This course is still in use</h2>
        <p className="modal-copy">
          {course.name} has {linkedTaskCount} linked{" "}
          {linkedTaskCount === 1 ? "task" : "tasks"}. Move those tasks to another
          course or delete them before deleting this course.
        </p>
        <div className="modal-actions">
          <button className="button button--secondary" onClick={onClose} type="button">
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

function TasksView({
  courses,
  onAdd,
  onDelete,
  onEdit,
  onNavigate,
  onToggleComplete,
  tasks,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const taskCounts = getTaskCounts(tasks);
  const filteredTasks = filterTasks(tasks, statusFilter, courseFilter);
  const filtersAreActive = statusFilter !== "all" || courseFilter !== "all";

  function clearFilters() {
    setStatusFilter("all");
    setCourseFilter("all");
  }

  if (courses.length === 0) {
    return (
      <section className="page-content tasks-view" aria-labelledby="tasks-title">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="status-dot" />
              Task manager
            </div>
            <h1 id="tasks-title">Your tasks</h1>
            <p className="page-copy">
              Plan focused work and keep every task connected to a course.
            </p>
          </div>
        </div>
        <section className="empty-state tasks-empty-state">
          <div className="empty-task-mark" aria-hidden="true">
            ✓
          </div>
          <h2>Create a course first</h2>
          <p>
            Every StudyForge task needs a course. Add a course, then return here
            to plan your first task.
          </p>
          <button
            className="button button--primary"
            onClick={() => onNavigate("courses")}
            type="button"
          >
            Go to Courses
          </button>
        </section>
      </section>
    );
  }

  return (
    <section className="page-content tasks-view" aria-labelledby="tasks-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Task manager
          </div>
          <h1 id="tasks-title">Your tasks</h1>
          <p className="page-copy">
            Plan focused work, estimate the effort, and keep each task tied to a
            course.
          </p>
        </div>
        <button className="button button--primary add-button" onClick={onAdd}>
          <PlusIcon />
          Add task
        </button>
      </div>

      <div className="task-counts" aria-label="Task totals">
        <article>
          <span>Total</span>
          <strong>{taskCounts.total}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{taskCounts.active}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{taskCounts.completed}</strong>
        </article>
      </div>

      {tasks.length === 0 ? (
        <section className="empty-state tasks-empty-state">
          <div className="empty-task-mark" aria-hidden="true">
            ✓
          </div>
          <h2>No tasks yet</h2>
          <p>
            Add one clear piece of work, link it to a course, and estimate how
            many Focus sessions it may take.
          </p>
          <button className="button button--primary" onClick={onAdd} type="button">
            <PlusIcon />
            Add your first task
          </button>
        </section>
      ) : (
        <>
          <section className="task-filters" aria-label="Task filters">
            <div className="status-filter" aria-label="Filter by status">
              {[
                { id: "all", label: "All tasks" },
                { id: "active", label: "Active" },
                { id: "completed", label: "Completed" },
              ].map((filter) => (
                <button
                  aria-pressed={statusFilter === filter.id}
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="course-filter">
              <span className="sr-only">Filter by course</span>
              <select
                className="text-input select-input"
                onChange={(event) => setCourseFilter(event.target.value)}
                value={courseFilter}
              >
                <option value="all">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {filteredTasks.length === 0 ? (
            <section className="filter-empty-state">
              <h2>No tasks match these filters</h2>
              <p>Try another status or course, or return to the full task list.</p>
              {filtersAreActive && (
                <button
                  className="button button--secondary"
                  onClick={clearFilters}
                  type="button"
                >
                  Clear filters
                </button>
              )}
            </section>
          ) : (
            <ul className="task-list">
              {filteredTasks.map((task) => {
                const course = courses.find(
                  (candidate) => candidate.id === task.courseId,
                );

                if (!course) {
                  return null;
                }

                return (
                  <li
                    className={`task-card${
                      task.isCompleted ? " task-card--completed" : ""
                    }`}
                    key={task.id}
                    style={{ "--course-color": course.color }}
                  >
                    <button
                      aria-label={
                        task.isCompleted
                          ? `Reopen ${task.title}`
                          : `Mark ${task.title} as completed`
                      }
                      className="task-status-button"
                      onClick={() => onToggleComplete(task.id)}
                      type="button"
                    >
                      <span aria-hidden="true">{task.isCompleted ? "✓" : ""}</span>
                    </button>
                    <div className="task-card-content">
                      <div className="task-card-heading">
                        <h2>{task.title}</h2>
                        <span
                          className={`task-status${
                            task.isCompleted ? " task-status--completed" : ""
                          }`}
                        >
                          {task.isCompleted ? "Completed" : "Active"}
                        </span>
                      </div>
                      <div className="task-meta">
                        <span className="task-course">
                          <i aria-hidden="true" />
                          {course.name}
                        </span>
                        <span>
                          Estimated {task.estimatedPomodoros}{" "}
                          {task.estimatedPomodoros === 1
                            ? "Pomodoro"
                            : "Pomodoros"}
                        </span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        className="text-button"
                        onClick={() => onEdit(task)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="text-button text-button--danger"
                        onClick={() => onDelete(task)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <p className="memory-note">
        Tasks are kept for this visit only and will clear when the page reloads.
      </p>
    </section>
  );
}

function ProfileView({ profile, onSave }) {
  return (
    <section className="page-content profile-view" aria-labelledby="profile-page-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Student profile
          </div>
          <h1 id="profile-page-title">Your profile</h1>
          <p className="page-copy">
            Add a little context to make StudyForge feel like your own space.
          </p>
        </div>
      </div>
      <ProfilePanel profile={profile} onSave={onSave} />
    </section>
  );
}

function TimerSettings({
  onRestoreDefaults,
  onSaveDurations,
  onToggleAutoStart,
  onToggleSound,
  settings,
}) {
  const [draftSettings, setDraftSettings] = useState({
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
    focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
  });
  const [settingsError, setSettingsError] = useState("");

  useEffect(() => {
    setDraftSettings({
      focusMinutes: String(settings.focusMinutes),
      shortBreakMinutes: String(settings.shortBreakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
      focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
    });
    setSettingsError("");
  }, [
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
    settings.focusSessionsPerCycle,
  ]);

  function updateDraftSetting(key, value) {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const durationKeys = ["focusMinutes", "shortBreakMinutes", "longBreakMinutes"];
    const durationsAreValid = durationKeys.every((key) => {
      const value = draftSettings[key];
      return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 180;
    });
    const cycleValue = draftSettings.focusSessionsPerCycle;
    const cycleIsValid =
      /^\d+$/.test(cycleValue) && Number(cycleValue) >= 1 && Number(cycleValue) <= 99;

    if (!durationsAreValid) {
      setSettingsError("Enter each duration as a whole number from 1 to 180 minutes.");
      return;
    }

    if (!cycleIsValid) {
      setSettingsError("Enter a Focus sessions value from 1 to 99.");
      return;
    }

    setSettingsError("");
    onSaveDurations({
      focusMinutes: Number(draftSettings.focusMinutes),
      shortBreakMinutes: Number(draftSettings.shortBreakMinutes),
      longBreakMinutes: Number(draftSettings.longBreakMinutes),
      focusSessionsPerCycle: Number(draftSettings.focusSessionsPerCycle),
    });
  }

  return (
    <section className="timer-settings" aria-labelledby="timer-settings-title">
      <div className="timer-settings-heading">
        <div>
          <p className="section-kicker">Preferences</p>
          <h2 id="timer-settings-title">Timer settings</h2>
        </div>
        <button
          className="text-button"
          onClick={onRestoreDefaults}
          type="button"
        >
          Restore defaults
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="timer-duration-fields">
          {[
            { key: "focusMinutes", label: "Focus" },
            { key: "shortBreakMinutes", label: "Short Break" },
            { key: "longBreakMinutes", label: "Long Break" },
          ].map((field) => (
            <label key={field.key}>
              <span className="field-label">{field.label}</span>
              <span className="number-input-wrap">
                <input
                  aria-describedby={settingsError ? "timer-settings-error" : undefined}
                  className="text-input timer-number-input"
                  inputMode="numeric"
                  max="180"
                  min="1"
                  onChange={(event) => updateDraftSetting(field.key, event.target.value)}
                  step="1"
                  type="number"
                  value={draftSettings[field.key]}
                />
                <span>min</span>
              </span>
            </label>
          ))}
          <label>
            <span className="field-label">Focus sessions per cycle</span>
            <span className="number-input-wrap">
              <input
                aria-describedby={settingsError ? "timer-settings-error" : undefined}
                className="text-input timer-number-input"
                inputMode="numeric"
                max="99"
                min="1"
                onChange={(event) =>
                  updateDraftSetting("focusSessionsPerCycle", event.target.value)
                }
                step="1"
                type="number"
                value={draftSettings.focusSessionsPerCycle}
              />
              <span>sessions</span>
            </span>
          </label>
        </div>

        <div className="timer-settings-actions">
          <p
            className={`form-message${settingsError ? " form-message--error" : ""}`}
            id="timer-settings-error"
            role={settingsError ? "alert" : undefined}
          >
            {settingsError || "Changes reset the current timer without completing it."}
          </p>
          <button className="button button--secondary" type="submit">
            Apply settings
          </button>
        </div>
      </form>

      <div className="timer-toggles">
        <label className="toggle-row">
          <span>
            <strong>Auto-start next timer</strong>
            <small>Begin the next Focus or Break timer automatically.</small>
          </span>
          <input
            checked={settings.autoStart}
            onChange={(event) => onToggleAutoStart(event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-control" aria-hidden="true" />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Timer sounds</strong>
            <small>Play distinct sounds when a timer starts and finishes.</small>
          </span>
          <input
            checked={settings.soundEnabled}
            onChange={(event) => onToggleSound(event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-control" aria-hidden="true" />
        </label>
      </div>
    </section>
  );
}

function TimerView({
  completedFocusSessions,
  completionMessage,
  modeId,
  onModeChange,
  onPause,
  onReset,
  onRestoreDefaults,
  onSaveDurations,
  onStart,
  onToggleAutoStart,
  onToggleSound,
  remainingSeconds,
  settings,
  status,
}) {
  const activeMode = getTimerMode(modeId);
  const primaryAction = status === "running" ? onPause : onStart;
  const primaryLabel =
    status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start";

  return (
    <section className="page-content timer-view" aria-labelledby="timer-title">
      <div className="page-heading timer-heading">
        <div>
          <div className="eyebrow">
            <span className="timer-dot" />
            Study timer
          </div>
          <h1 id="timer-title">Make this time count</h1>
          <p className="page-copy">
            Choose a mode, start the clock, and give one session your attention.
          </p>
        </div>
      </div>

      <section className="timer-panel" aria-label={`${activeMode.label} timer`}>
        <div className="timer-modes" aria-label="Timer mode">
          {TIMER_MODES.map((mode) => (
            <button
              aria-pressed={modeId === mode.id}
              className="timer-mode-button"
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="timer-display">
          <p className="section-kicker">{activeMode.label}</p>
          <p aria-atomic="true" aria-live="off" className="timer-time">
            {formatTime(remainingSeconds)}
          </p>
          <p className="timer-state">
            {status === "running"
              ? "Timer running"
              : status === "paused"
                ? "Timer paused"
                : "Ready when you are"}
          </p>
          <p className="cycle-progress">
            {completedFocusSessions} of {settings.focusSessionsPerCycle} Focus sessions
            completed in this cycle
          </p>
        </div>

        <div
          aria-atomic="true"
          aria-live="polite"
          className={`completion-message${
            completionMessage ? " completion-message--visible" : ""
          }`}
          role="status"
        >
          {completionMessage}
        </div>

        <div className="timer-controls">
          <button
            className="button button--primary timer-primary-button"
            disabled={remainingSeconds === 0}
            onClick={primaryAction}
            type="button"
          >
            {primaryLabel}
          </button>
          <button className="button button--secondary" onClick={onReset} type="button">
            Reset
          </button>
        </div>
      </section>

      <TimerSettings
        onRestoreDefaults={onRestoreDefaults}
        onSaveDurations={onSaveDurations}
        onToggleAutoStart={onToggleAutoStart}
        onToggleSound={onToggleSound}
        settings={settings}
      />
    </section>
  );
}

export default function App() {
  const [courses, setCourses] = useState(loadCourses);
  const [profile, setProfile] = useState(loadProfile);
  const [tasks, setTasks] = useState([]);
  const [activeView, setActiveView] = useState("timer");
  const [timerModeId, setTimerModeId] = useState(TIMER_MODES[0].id);
  const [timerSettings, setTimerSettings] = useState(loadTimerSettings);
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => getTimerDurationSeconds(TIMER_MODES[0].id, timerSettings),
  );
  const [timerStatus, setTimerStatus] = useState("idle");
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [completionMessage, setCompletionMessage] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [courseDeleteBlocked, setCourseDeleteBlocked] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const timerEndTimeRef = useRef(null);
  const completionHandledRef = useRef(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // Keep the course manager usable if browser storage is unavailable.
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Keep the profile form usable if browser storage is unavailable.
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(
        TIMER_SETTINGS_STORAGE_KEY,
        JSON.stringify(timerSettings),
      );
    } catch {
      // Keep the timer usable if browser storage is unavailable.
    }
  }, [timerSettings]);

  useEffect(() => {
    if (
      !isFormOpen &&
      !courseToDelete &&
      !courseDeleteBlocked &&
      !isTaskFormOpen &&
      !taskToDelete
    ) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsFormOpen(false);
        setEditingCourse(null);
        setCourseToDelete(null);
        setCourseDeleteBlocked(null);
        setIsTaskFormOpen(false);
        setEditingTask(null);
        setTaskToDelete(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    courseDeleteBlocked,
    courseToDelete,
    isFormOpen,
    isTaskFormOpen,
    taskToDelete,
  ]);

  useEffect(() => {
    if (timerStatus !== "running") {
      return undefined;
    }

    function updateRemainingTime() {
      if (timerEndTimeRef.current === null) {
        return;
      }

      const millisecondsLeft = Math.max(0, timerEndTimeRef.current - Date.now());
      const nextRemainingSeconds = Math.ceil(millisecondsLeft / 1000);

      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0) {
        finishTimer(timerEndTimeRef.current);
      }
    }

    updateRemainingTime();
    const timerInterval = window.setInterval(updateRemainingTime, 250);
    document.addEventListener("visibilitychange", updateRemainingTime);

    return () => {
      window.clearInterval(timerInterval);
      document.removeEventListener("visibilitychange", updateRemainingTime);
    };
  }, [completedFocusSessions, timerModeId, timerSettings, timerStatus]);

  useEffect(
    () => () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    },
    [],
  );

  function openAddForm() {
    setEditingCourse(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCourse(null);
  }

  function saveCourse(courseDetails) {
    if (editingCourse) {
      setCourses((currentCourses) =>
        currentCourses.map((course) =>
          course.id === editingCourse.id ? { ...course, ...courseDetails } : course,
        ),
      );
    } else {
      setCourses((currentCourses) => [
        ...currentCourses,
        { id: createCourseId(), ...courseDetails },
      ]);
    }

    closeForm();
  }

  function editCourse(course) {
    setEditingCourse(course);
    setIsFormOpen(true);
  }

  function prepareCourseDeletion(course) {
    const linkedTaskCount = countTasksForCourse(tasks, course.id);

    if (linkedTaskCount > 0) {
      setCourseDeleteBlocked({ course, linkedTaskCount });
      return;
    }

    setCourseToDelete(course);
  }

  function deleteCourse() {
    const linkedTaskCount = countTasksForCourse(tasks, courseToDelete.id);

    if (linkedTaskCount > 0) {
      setCourseDeleteBlocked({ course: courseToDelete, linkedTaskCount });
      setCourseToDelete(null);
      return;
    }

    setCourses((currentCourses) =>
      currentCourses.filter((course) => course.id !== courseToDelete.id),
    );
    setCourseToDelete(null);
  }

  function openAddTaskForm() {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }

  function closeTaskForm() {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  }

  function saveTask(taskDetails) {
    if (!courses.some((course) => course.id === taskDetails.courseId)) {
      return;
    }

    if (editingTask) {
      setTasks((currentTasks) =>
        saveTaskInList(
          currentTasks,
          taskDetails,
          editingTask.id,
          createTaskId,
        ),
      );
    } else {
      setTasks((currentTasks) =>
        saveTaskInList(currentTasks, taskDetails, null, createTaskId),
      );
    }

    closeTaskForm();
  }

  function editTask(task) {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }

  function toggleTaskComplete(taskId) {
    setTasks((currentTasks) => toggleTaskInList(currentTasks, taskId));
  }

  function deleteTask() {
    setTasks((currentTasks) => deleteTaskFromList(currentTasks, taskToDelete.id));
    setTaskToDelete(null);
  }

  function viewBlockedCourseTasks() {
    setCourseDeleteBlocked(null);
    setActiveView("tasks");
  }

  function prepareTimerSounds(force = false) {
    if ((!timerSettings.soundEnabled && !force) || audioContextRef.current) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    audioContextRef.current = new AudioContext();
    audioContextRef.current.resume().catch(() => {
      // The timer and in-app feedback remain usable if audio is blocked.
    });
  }

  function createSoundBus(audioContext) {
    const compressor = audioContext.createDynamicsCompressor();

    compressor.threshold.setValueAtTime(-14, audioContext.currentTime);
    compressor.knee.setValueAtTime(8, audioContext.currentTime);
    compressor.ratio.setValueAtTime(4, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.3, audioContext.currentTime);
    compressor.connect(audioContext.destination);

    return compressor;
  }

  function playTone({
    audioContext,
    destination,
    duration,
    frequency,
    peakVolume,
    startTime,
    type = "sine",
  }) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  function playCompletionSound() {
    const audioContext = audioContextRef.current;

    if (!timerSettings.soundEnabled || !audioContext) {
      return;
    }

    try {
      const startTime = audioContext.currentTime;
      const bellBus = createSoundBus(audioContext);

      [
        { frequency: 659.25, peakVolume: 0.38, duration: 2.2 },
        { frequency: 1325.1, peakVolume: 0.18, duration: 1.75 },
        { frequency: 1964.6, peakVolume: 0.1, duration: 1.35 },
        { frequency: 2768.9, peakVolume: 0.06, duration: 0.9 },
      ].forEach((partial) => {
        playTone({
          audioContext,
          destination: bellBus,
          startTime,
          ...partial,
        });
      });
    } catch {
      // The visible completion message is the fallback when audio cannot play.
    }
  }

  function playStartSound() {
    const audioContext = audioContextRef.current;

    if (!timerSettings.soundEnabled || !audioContext) {
      return;
    }

    try {
      const startTime = audioContext.currentTime;
      const startBus = createSoundBus(audioContext);

      playTone({
        audioContext,
        destination: startBus,
        duration: 0.72,
        frequency: 392,
        peakVolume: 0.28,
        startTime,
        type: "triangle",
      });
      playTone({
        audioContext,
        destination: startBus,
        duration: 0.88,
        frequency: 587.33,
        peakVolume: 0.32,
        startTime: startTime + 0.2,
        type: "triangle",
      });
    } catch {
      // Starting the timer still works if audio cannot play.
    }
  }

  function finishTimer(completedAt = Date.now()) {
    if (completionHandledRef.current) {
      return;
    }

    completionHandledRef.current = true;
    timerEndTimeRef.current = null;

    const completedMode = getTimerMode(timerModeId);
    let nextModeId = "focus";

    if (timerModeId === "focus") {
      const nextFocusCount = completedFocusSessions + 1;
      const cycleIsComplete =
        nextFocusCount >= timerSettings.focusSessionsPerCycle;

      nextModeId = cycleIsComplete ? "long-break" : "short-break";
      setCompletedFocusSessions(cycleIsComplete ? 0 : nextFocusCount);
    }

    const nextMode = getTimerMode(nextModeId);
    const nextDurationSeconds = getTimerDurationSeconds(
      nextModeId,
      timerSettings,
    );
    const nextAction = timerSettings.autoStart
      ? `${nextMode.label} started automatically.`
      : `${nextMode.label} is ready.`;

    playCompletionSound();
    setCompletionMessage(`${completedMode.label} complete. ${nextAction}`);
    setTimerModeId(nextModeId);
    setRemainingSeconds(nextDurationSeconds);

    if (timerSettings.autoStart) {
      completionHandledRef.current = false;
      timerEndTimeRef.current = completedAt + nextDurationSeconds * 1000;
      setTimerStatus("running");
    } else {
      setTimerStatus("idle");
    }
  }

  function startTimer() {
    if (remainingSeconds === 0) {
      return;
    }

    prepareTimerSounds();
    playStartSound();
    completionHandledRef.current = false;
    timerEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setCompletionMessage("");
    setTimerStatus("running");
  }

  function pauseTimer() {
    if (timerEndTimeRef.current === null) {
      return;
    }

    const millisecondsLeft = Math.max(0, timerEndTimeRef.current - Date.now());
    const nextRemainingSeconds = Math.ceil(millisecondsLeft / 1000);

    if (nextRemainingSeconds === 0) {
      finishTimer(timerEndTimeRef.current);
      return;
    }

    timerEndTimeRef.current = null;
    setRemainingSeconds(nextRemainingSeconds);
    setTimerStatus("paused");
  }

  function resetTimer() {
    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setRemainingSeconds(getTimerDurationSeconds(timerModeId, timerSettings));
    setCompletionMessage("");
    setTimerStatus("idle");
  }

  function changeTimerMode(nextModeId) {
    const nextMode = getTimerMode(nextModeId);

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setTimerModeId(nextMode.id);
    setRemainingSeconds(getTimerDurationSeconds(nextMode.id, timerSettings));
    setCompletionMessage("");
    setTimerStatus("idle");
  }

  function saveTimerDurations(nextValues) {
    const nextSettings = { ...timerSettings, ...nextValues };

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setTimerSettings(nextSettings);
    setCompletedFocusSessions((currentCount) =>
      Math.min(currentCount, nextSettings.focusSessionsPerCycle - 1),
    );
    setRemainingSeconds(getTimerDurationSeconds(timerModeId, nextSettings));
    setCompletionMessage("Timer settings applied.");
    setTimerStatus("idle");
  }

  function restoreTimerDefaults() {
    const defaultSettings = { ...DEFAULT_TIMER_SETTINGS };

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setTimerSettings(defaultSettings);
    setCompletedFocusSessions((currentCount) =>
      Math.min(currentCount, defaultSettings.focusSessionsPerCycle - 1),
    );
    setRemainingSeconds(getTimerDurationSeconds(timerModeId, defaultSettings));
    setCompletionMessage("Default timer settings restored.");
    setTimerStatus("idle");
  }

  function toggleAutoStart(isEnabled) {
    setTimerSettings((currentSettings) => ({
      ...currentSettings,
      autoStart: isEnabled,
    }));
  }

  function toggleCompletionSound(isEnabled) {
    if (isEnabled) {
      prepareTimerSounds(true);
    }

    setTimerSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled: isEnabled,
    }));
  }

  return (
    <main className="app-shell">
      <div className="ambient-glow ambient-glow--top" />
      <div className="ambient-glow ambient-glow--bottom" />

      <header className="site-header">
        <button
          className="brand"
          onClick={() => setActiveView("timer")}
          type="button"
        >
          <BrandMark />
          <span>StudyForge</span>
        </button>
        <nav className="primary-nav" aria-label="Main navigation">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "courses", label: "Courses" },
            { id: "tasks", label: "Tasks" },
            { id: "timer", label: "Timer" },
            { id: "profile", label: "Profile" },
          ].map((item) => (
            <button
              aria-current={activeView === item.id ? "page" : undefined}
              className="nav-button"
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <span className={`nav-icon nav-icon--${item.id}`} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>
        <span className="milestone-badge">Milestones 1–6</span>
      </header>

      {activeView === "dashboard" && (
        <DashboardView
          courses={courses}
          onNavigate={setActiveView}
          profile={profile}
        />
      )}
      {activeView === "courses" && (
        <CoursesView
          courses={courses}
          onAdd={openAddForm}
          onDelete={prepareCourseDeletion}
          onEdit={editCourse}
        />
      )}
      {activeView === "tasks" && (
        <TasksView
          courses={courses}
          onAdd={openAddTaskForm}
          onDelete={setTaskToDelete}
          onEdit={editTask}
          onNavigate={setActiveView}
          onToggleComplete={toggleTaskComplete}
          tasks={tasks}
        />
      )}
      {activeView === "profile" && (
        <ProfileView profile={profile} onSave={setProfile} />
      )}
      {activeView === "timer" && (
        <TimerView
          completedFocusSessions={completedFocusSessions}
          completionMessage={completionMessage}
          modeId={timerModeId}
          onModeChange={changeTimerMode}
          onPause={pauseTimer}
          onReset={resetTimer}
          onRestoreDefaults={restoreTimerDefaults}
          onSaveDurations={saveTimerDurations}
          onStart={startTimer}
          onToggleAutoStart={toggleAutoStart}
          onToggleSound={toggleCompletionSound}
          remainingSeconds={remainingSeconds}
          settings={timerSettings}
          status={timerStatus}
        />
      )}

      <footer>
        <span>Designed for calm, deliberate progress.</span>
        <span>StudyForge v0.6</span>
      </footer>

      {isFormOpen && (
        <CourseForm course={editingCourse} onCancel={closeForm} onSave={saveCourse} />
      )}
      {courseToDelete && (
        <DeleteConfirmation
          course={courseToDelete}
          onCancel={() => setCourseToDelete(null)}
          onConfirm={deleteCourse}
        />
      )}
      {courseDeleteBlocked && (
        <CourseDeleteBlocked
          course={courseDeleteBlocked.course}
          linkedTaskCount={courseDeleteBlocked.linkedTaskCount}
          onClose={() => setCourseDeleteBlocked(null)}
          onViewTasks={viewBlockedCourseTasks}
        />
      )}
      {isTaskFormOpen && (
        <TaskForm
          courses={courses}
          onCancel={closeTaskForm}
          onSave={saveTask}
          task={editingTask}
        />
      )}
      {taskToDelete && (
        <TaskDeleteConfirmation
          onCancel={() => setTaskToDelete(null)}
          onConfirm={deleteTask}
          task={taskToDelete}
        />
      )}
    </main>
  );
}
