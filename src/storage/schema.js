export const APP_STORAGE_KEY = "studyforge:app-state";
export const LEGACY_COURSE_STORAGE_KEY = "studyforge:courses";
export const LEGACY_PROFILE_STORAGE_KEY = "studyforge:profile";
export const LEGACY_TIMER_SETTINGS_STORAGE_KEY = "studyforge:timer-settings";

export const STORAGE_VERSION = 4;
export const MILESTONE_10_STORAGE_VERSION = 3;
export const MILESTONE_9_STORAGE_VERSION = 2;
export const MILESTONE_8_STORAGE_VERSION = 1;
export const SUPPORTED_STORAGE_VERSIONS = new Set([
  STORAGE_VERSION,
  MILESTONE_10_STORAGE_VERSION,
  MILESTONE_9_STORAGE_VERSION,
  MILESTONE_8_STORAGE_VERSION,
]);

export const PROFILE_FIELD_MAX_LENGTH = 80;
export const COURSE_NAME_MAX_LENGTH = 60;
export const DEFAULT_ACTIVE_VIEW = "dashboard";
export const VALID_ACTIVE_VIEWS = new Set([
  "dashboard",
  "courses",
  "tasks",
  "timer",
  "history",
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
