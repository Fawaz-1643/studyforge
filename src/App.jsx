import { useEffect, useRef, useState } from "react";

const COURSE_STORAGE_KEY = "studyforge:courses";
const PROFILE_STORAGE_KEY = "studyforge:profile";
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

export default function App() {
  const [courses, setCourses] = useState(loadCourses);
  const [profile, setProfile] = useState(loadProfile);
  const [activeView, setActiveView] = useState("dashboard");
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
        <button
          className="brand"
          onClick={() => setActiveView("dashboard")}
          type="button"
        >
          <BrandMark />
          <span>StudyForge</span>
        </button>
        <nav className="primary-nav" aria-label="Main navigation">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "courses", label: "Courses" },
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
        <span className="milestone-badge">Milestones 1–3</span>
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
          onDelete={setCourseToDelete}
          onEdit={editCourse}
        />
      )}
      {activeView === "profile" && (
        <ProfileView profile={profile} onSave={setProfile} />
      )}

      <footer>
        <span>Designed for calm, deliberate progress.</span>
        <span>StudyForge v0.3</span>
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
