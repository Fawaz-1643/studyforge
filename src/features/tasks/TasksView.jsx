import { useState } from "react";
import { PlusIcon } from "../../components/icons/AppIcons.jsx";
import { ThemedSelect } from "../../components/ui/ThemedSelect.jsx";
import { filterTasks, getTaskCounts } from "../../domain/tasks.js";

export function TasksView({
  activeTaskId,
  courses,
  onAdd,
  onDelete,
  onDeleteAllCompleted,
  onEdit,
  onNavigate,
  onSetActiveTask,
  onToggleComplete,
  removingTaskIds,
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
            <div className="task-filter-actions">
              <div className="course-filter">
                <ThemedSelect
                  label="Filter by course"
                  onChange={setCourseFilter}
                  options={[
                    { label: "All courses", value: "all" },
                    ...courses.map((course) => ({
                      label: course.name,
                      value: course.id,
                    })),
                  ]}
                  value={courseFilter}
                />
              </div>
              {statusFilter === "completed" && taskCounts.completed > 0 && (
                <button
                  className="button button--danger completed-task-cleanup"
                  onClick={onDeleteAllCompleted}
                  type="button"
                >
                  Delete all completed
                </button>
              )}
            </div>
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
                    }${task.id === activeTaskId ? " task-card--current" : ""}${
                      removingTaskIds.includes(task.id)
                        ? " task-card--removing"
                        : ""
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
                          {task.isCompleted
                            ? "Completed"
                            : task.id === activeTaskId
                              ? "Current task"
                              : "Active"}
                        </span>
                      </div>
                      <div className="task-meta">
                        <span className="task-course">
                          <i aria-hidden="true" />
                          {course.name}
                        </span>
                        <span>
                          {task.completedPomodoros ?? 0} /{" "}
                          {task.estimatedPomodoros} Pomodoros completed
                        </span>
                      </div>
                    </div>
                    <div className="task-actions">
                      {!task.isCompleted && (
                        <button
                          aria-label={
                            task.id === activeTaskId
                              ? `Clear ${task.title} as current task`
                              : `Set ${task.title} as current task`
                          }
                          className="text-button"
                          onClick={() =>
                            onSetActiveTask(
                              task.id === activeTaskId ? null : task.id,
                            )
                          }
                          type="button"
                        >
                          {task.id === activeTaskId ? "Clear current" : "Set current"}
                        </button>
                      )}
                      <button
                        aria-label={`Edit ${task.title}`}
                        className="text-button"
                        onClick={() => onEdit(task)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${task.title}`}
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
        Tasks and their Pomodoro progress are saved on this device.
      </p>
    </section>
  );
}
