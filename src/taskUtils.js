export const TASK_TITLE_MAX_LENGTH = 100;
export const TASK_ESTIMATE_MIN = 1;
export const TASK_ESTIMATE_MAX = 99;

export function validateTaskDetails(details, courses) {
  const title = details.title.trim();
  const estimate = String(details.estimatedPomodoros);

  if (!title) {
    return { error: "Enter a task title before saving." };
  }

  if (title.length > TASK_TITLE_MAX_LENGTH) {
    return {
      error: `Keep the task title to ${TASK_TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (!courses.some((course) => course.id === details.courseId)) {
    return { error: "Choose an existing course for this task." };
  }

  if (
    !/^\d+$/.test(estimate) ||
    Number(estimate) < TASK_ESTIMATE_MIN ||
    Number(estimate) > TASK_ESTIMATE_MAX
  ) {
    return {
      error: `Enter an estimate from ${TASK_ESTIMATE_MIN} to ${TASK_ESTIMATE_MAX} whole Pomodoro sessions.`,
    };
  }

  return {
    error: "",
    taskDetails: {
      title,
      courseId: details.courseId,
      estimatedPomodoros: Number(estimate),
    },
  };
}

export function saveTaskInList(tasks, taskDetails, editingTaskId, createId) {
  if (editingTaskId) {
    return tasks.map((task) =>
      task.id === editingTaskId ? { ...task, ...taskDetails } : task,
    );
  }

  return [
    ...tasks,
    {
      id: createId(),
      ...taskDetails,
      isCompleted: false,
    },
  ];
}

export function toggleTaskInList(tasks, taskId) {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, isCompleted: !task.isCompleted }
      : task,
  );
}

export function deleteTaskFromList(tasks, taskId) {
  return tasks.filter((task) => task.id !== taskId);
}

export function filterTasks(tasks, statusFilter, courseFilter) {
  return tasks.filter((task) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !task.isCompleted) ||
      (statusFilter === "completed" && task.isCompleted);
    const matchesCourse =
      courseFilter === "all" || task.courseId === courseFilter;

    return matchesStatus && matchesCourse;
  });
}

export function getTaskCounts(tasks) {
  const active = tasks.filter((task) => !task.isCompleted).length;

  return {
    total: tasks.length,
    active,
    completed: tasks.length - active,
  };
}

export function countTasksForCourse(tasks, courseId) {
  return tasks.filter((task) => task.courseId === courseId).length;
}
