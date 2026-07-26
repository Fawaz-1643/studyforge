const APP_STORAGE_KEY = "studyforge:app-state";
const LEGACY_COURSE_STORAGE_KEY = "studyforge:courses";
const LEGACY_PROFILE_STORAGE_KEY = "studyforge:profile";
const LEGACY_TIMER_SETTINGS_STORAGE_KEY = "studyforge:timer-settings";
const STORAGE_VERSION = 1;

const PROFILE_FIELD_MAX_LENGTH = 80;
const COURSE_NAME_MAX_LENGTH = 60;
const TASK_TITLE_MAX_LENGTH = 100;
const TASK_ESTIMATE_MIN = 1;
const TASK_ESTIMATE_MAX = 99;
const DEFAULT_ACTIVE_VIEW = "dashboard";
const VALID_ACTIVE_VIEWS = new Set([
  "dashboard",
  "courses",
  "tasks",
  "timer",
  "profile",
]);

export const DEFAULT_TIMER_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  focusSessionsPerCycle: 4,
  autoStart: false,
  soundEnabled: true,
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getBrowserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function readStoredJson(storage, key) {
  try {
    const storedValue = storage?.getItem(key);

    if (storedValue === null || storedValue === undefined) {
      return undefined;
    }

    return JSON.parse(storedValue);
  } catch {
    return undefined;
  }
}

function normalizeText(value, maximumLength) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function normalizeId(value) {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

function normalizeProfile(
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

function normalizeCourses(value) {
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

function isWholeNumberBetween(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function normalizeTimerSettings(value, fallback = DEFAULT_TIMER_SETTINGS) {
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

function normalizeTasks(value, courses) {
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
    const hasCompletedPomodoros = Object.hasOwn(task, "completedPomodoros");
    const completedPomodoros = hasCompletedPomodoros
      ? task.completedPomodoros
      : 0;
    const hasCompletionStatus = Object.hasOwn(task, "isCompleted");
    const isCompleted = hasCompletionStatus ? task.isCompleted : false;

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

function chooseCurrentValue(currentState, key, legacyValue) {
  return Object.hasOwn(currentState, key) ? currentState[key] : legacyValue;
}

function normalizeActiveView(value) {
  return VALID_ACTIVE_VIEWS.has(value) ? value : DEFAULT_ACTIVE_VIEW;
}

export function loadAppState(storage) {
  const selectedStorage = storage ?? getBrowserStorage();
  const storedState = readStoredJson(selectedStorage, APP_STORAGE_KEY);
  const currentState =
    isRecord(storedState) && storedState.version === STORAGE_VERSION
      ? storedState
      : {};

  const legacyCourses = readStoredJson(
    selectedStorage,
    LEGACY_COURSE_STORAGE_KEY,
  );
  const legacyProfile = readStoredJson(
    selectedStorage,
    LEGACY_PROFILE_STORAGE_KEY,
  );
  const legacyTimerSettings = readStoredJson(
    selectedStorage,
    LEGACY_TIMER_SETTINGS_STORAGE_KEY,
  );

  const courses = normalizeCourses(
    Array.isArray(currentState.courses)
      ? currentState.courses
      : legacyCourses,
  );
  const migratedProfile = normalizeProfile(legacyProfile);
  const profile = normalizeProfile(
    isRecord(currentState.profile) ? currentState.profile : undefined,
    migratedProfile,
  );
  const migratedTimerSettings = normalizeTimerSettings(legacyTimerSettings);
  const timerSettings = normalizeTimerSettings(
    isRecord(currentState.timerSettings)
      ? currentState.timerSettings
      : undefined,
    migratedTimerSettings,
  );
  const tasks = normalizeTasks(
    chooseCurrentValue(currentState, "tasks", []),
    courses,
  );
  const savedCycleProgress = chooseCurrentValue(
    currentState,
    "completedFocusSessions",
    0,
  );
  const completedFocusSessions =
    Number.isInteger(savedCycleProgress) &&
    savedCycleProgress >= 0 &&
    savedCycleProgress < timerSettings.focusSessionsPerCycle
      ? savedCycleProgress
      : 0;
  const savedActiveTaskId = normalizeId(
    chooseCurrentValue(currentState, "activeTaskId", null),
  );
  const activeTaskId = tasks.some(
    (task) => task.id === savedActiveTaskId && !task.isCompleted,
  )
    ? savedActiveTaskId
    : null;
  const activeView = normalizeActiveView(currentState.activeView);

  return {
    profile,
    courses,
    tasks,
    timerSettings,
    completedFocusSessions,
    activeTaskId,
    activeView,
  };
}

export function saveAppState(state, storage) {
  const selectedStorage = storage ?? getBrowserStorage();

  if (!selectedStorage) {
    return false;
  }

  try {
    selectedStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        profile: state.profile,
        courses: state.courses,
        tasks: state.tasks,
        timerSettings: state.timerSettings,
        completedFocusSessions: state.completedFocusSessions,
        activeTaskId: state.activeTaskId,
        activeView: normalizeActiveView(state.activeView),
      }),
    );

    return true;
  } catch {
    return false;
  }
}
