import {
  TASK_ESTIMATE_MAX,
  TASK_ESTIMATE_MIN,
  TASK_TITLE_MAX_LENGTH,
} from "../domain/tasks.js";
import {
  COURSE_NAME_MAX_LENGTH,
  DEFAULT_ACTIVE_VIEW,
  DEFAULT_TIMER_SETTINGS,
  PROFILE_FIELD_MAX_LENGTH,
  VALID_ACTIVE_VIEWS,
} from "./schema.js";

export function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeText(value, maximumLength) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

export function normalizeId(value) {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

export function normalizeProfile(
  value,
  fallback = { university: "", fieldOfStudy: "" },
) {
  return {
    university:
      typeof value?.university === "string"
        ? normalizeText(value.university, PROFILE_FIELD_MAX_LENGTH)
        : fallback.university,
    fieldOfStudy:
      typeof value?.fieldOfStudy === "string"
        ? normalizeText(value.fieldOfStudy, PROFILE_FIELD_MAX_LENGTH)
        : fallback.fieldOfStudy,
  };
}

export function normalizeCourses(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const courseIds = new Set();

  return value.flatMap((course) => {
    const id = normalizeId(course?.id);
    const name = normalizeText(course?.name, COURSE_NAME_MAX_LENGTH);
    const color = typeof course?.color === "string" ? course.color.trim() : "";

    if (
      !id ||
      !name ||
      !/^#[0-9a-f]{6}$/i.test(color) ||
      courseIds.has(id)
    ) {
      return [];
    }

    courseIds.add(id);
    return [{ id, name, color }];
  });
}

export function isWholeNumberBetween(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

export function normalizeTimerSettings(
  value,
  fallback = DEFAULT_TIMER_SETTINGS,
) {
  return {
    focusMinutes: isWholeNumberBetween(value?.focusMinutes, 1, 180)
      ? value.focusMinutes
      : fallback.focusMinutes,
    shortBreakMinutes: isWholeNumberBetween(value?.shortBreakMinutes, 1, 180)
      ? value.shortBreakMinutes
      : fallback.shortBreakMinutes,
    longBreakMinutes: isWholeNumberBetween(value?.longBreakMinutes, 1, 180)
      ? value.longBreakMinutes
      : fallback.longBreakMinutes,
    focusSessionsPerCycle: isWholeNumberBetween(
      value?.focusSessionsPerCycle,
      1,
      99,
    )
      ? value.focusSessionsPerCycle
      : fallback.focusSessionsPerCycle,
    autoStart:
      typeof value?.autoStart === "boolean"
        ? value.autoStart
        : fallback.autoStart,
    soundEnabled:
      typeof value?.soundEnabled === "boolean"
        ? value.soundEnabled
        : fallback.soundEnabled,
  };
}

export function normalizeTasks(value, courses) {
  if (!Array.isArray(value)) {
    return [];
  }

  const courseIds = new Set(courses.map((course) => course.id));
  const taskIds = new Set();

  return value.flatMap((task) => {
    if (!isRecord(task)) {
      return [];
    }

    const id = normalizeId(task?.id);
    const title = normalizeText(task?.title, TASK_TITLE_MAX_LENGTH);
    const courseId = normalizeId(task?.courseId);
    const estimatedPomodoros = task?.estimatedPomodoros;
    const completedPomodoros = Object.hasOwn(task, "completedPomodoros")
      ? task.completedPomodoros
      : 0;
    const isCompleted = Object.hasOwn(task, "isCompleted")
      ? task.isCompleted
      : false;

    if (
      !id ||
      !title ||
      taskIds.has(id) ||
      !courseIds.has(courseId) ||
      !isWholeNumberBetween(
        estimatedPomodoros,
        TASK_ESTIMATE_MIN,
        TASK_ESTIMATE_MAX,
      ) ||
      !Number.isSafeInteger(completedPomodoros) ||
      completedPomodoros < 0 ||
      typeof isCompleted !== "boolean"
    ) {
      return [];
    }

    taskIds.add(id);
    return [
      {
        id,
        title,
        courseId,
        estimatedPomodoros,
        completedPomodoros,
        isCompleted,
      },
    ];
  });
}

export function normalizeSessionHistory(value, allowFocusBonus = false) {
  if (!Array.isArray(value)) {
    return [];
  }

  const sessionIds = new Set();

  return value.flatMap((session) => {
    if (!isRecord(session)) {
      return [];
    }

    const id = normalizeId(session.id);
    const completedAtTimestamp =
      typeof session.completedAt === "string"
        ? Date.parse(session.completedAt)
        : Number.NaN;
    const durationMinutes = session.durationMinutes;

    if (
      !id ||
      sessionIds.has(id) ||
      !Number.isFinite(completedAtTimestamp) ||
      !isWholeNumberBetween(durationMinutes, 1, 180)
    ) {
      return [];
    }

    const normalizedSession = {
      id,
      completedAt: new Date(completedAtTimestamp).toISOString(),
      durationMinutes,
      focusBonusXp: 0,
    };
    const focusBonusXp = session.focusBonusXp;
    const expectedFocusBonusXp = durationMinutes / 10;

    if (
      allowFocusBonus &&
      typeof focusBonusXp === "number" &&
      Number.isFinite(focusBonusXp) &&
      Math.abs(focusBonusXp - expectedFocusBonusXp) < 0.000001
    ) {
      normalizedSession.focusBonusXp = Math.round(focusBonusXp * 10) / 10;
    }

    const taskId = normalizeId(session.taskId);
    const taskTitle = normalizeText(session.taskTitle, TASK_TITLE_MAX_LENGTH);

    if (taskId && taskTitle) {
      normalizedSession.taskId = taskId;
      normalizedSession.taskTitle = taskTitle;

      const courseId = normalizeId(session.courseId);
      const courseName = normalizeText(
        session.courseName,
        COURSE_NAME_MAX_LENGTH,
      );
      const courseColor =
        typeof session.courseColor === "string"
          ? session.courseColor.trim()
          : "";

      if (
        courseId &&
        courseName &&
        /^#[0-9a-f]{6}$/i.test(courseColor)
      ) {
        normalizedSession.courseId = courseId;
        normalizedSession.courseName = courseName;
        normalizedSession.courseColor = courseColor;
      }
    }

    sessionIds.add(id);
    return [normalizedSession];
  });
}

export function normalizeActiveView(value) {
  return VALID_ACTIVE_VIEWS.has(value) ? value : DEFAULT_ACTIVE_VIEW;
}
