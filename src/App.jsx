import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "studyforge:courses";
const COURSE_COLORS = [
  { name: "Violet", value: "#9b87f5" },
  { name: "Blue", value: "#5b9cf6" },
  { name: "Cyan", value: "#45c7d4" },
  { name: "Green", value: "#61d6a7" },
  { name: "Amber", value: "#f2b95f" },
  { name: "Coral", value: "#ef7e75" },
  { name: "Pink", value: "#e884c4" },
];

function loadCourses() {
  try {
    const savedCourses = JSON.parse(localStorage.getItem(STORAGE_KEY));

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

function createCourseId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
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

export default function App() {
  const [courses, setCourses] = useState(loadCourses);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // Keep the course manager usable if browser storage is unavailable.
    }
  }, [courses]);

  useEffect(() => {
    if (!isFormOpen && !courseToDelete) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsFormOpen(false);
        setEditingCourse(null);
        setCourseToDelete(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, courseToDelete]);

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

  function deleteCourse() {
    setCourses((currentCourses) =>
      currentCourses.filter((course) => course.id !== courseToDelete.id),
    );
    setCourseToDelete(null);
  }

  return (
    <main className="app-shell">
      <div className="ambient-glow ambient-glow--top" />
      <div className="ambient-glow ambient-glow--bottom" />

      <header className="site-header">
        <a className="brand" href="/" aria-label="StudyForge home">
          <BrandMark />
          <span>StudyForge</span>
        </a>
        <span className="milestone-badge">Milestone 2</span>
      </header>

      <section className="courses-page" aria-labelledby="page-title">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="status-dot" />
              Course library
            </div>
            <h1 id="page-title">Your courses</h1>
            <p className="page-copy">
              Give every subject a home and a color you’ll recognize at a glance.
            </p>
          </div>
          <button className="button button--primary add-button" onClick={openAddForm}>
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
            <button className="button button--primary" onClick={openAddForm}>
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
                    onClick={() => editCourse(course)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="text-button text-button--danger"
                    onClick={() => setCourseToDelete(course)}
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

      <footer>
        <span>Designed for calm, deliberate progress.</span>
        <span>StudyForge v0.2</span>
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
    </main>
  );
}
