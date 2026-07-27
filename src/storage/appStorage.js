import { migrateAppState } from "./migrations.js";
import { normalizeActiveView } from "./normalizers.js";
import {
  APP_STORAGE_KEY,
  LEGACY_COURSE_STORAGE_KEY,
  LEGACY_PROFILE_STORAGE_KEY,
  LEGACY_TIMER_SETTINGS_STORAGE_KEY,
  STORAGE_VERSION,
} from "./schema.js";

export { DEFAULT_TIMER_SETTINGS } from "./schema.js";

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

function hasStoredValue(storage, key) {
  try {
    return storage?.getItem(key) !== null && storage?.getItem(key) !== undefined;
  } catch {
    return false;
  }
}

export function loadAppState(storage) {
  const selectedStorage = storage ?? getBrowserStorage();

  return migrateAppState({
    hasUnifiedStoredValue: hasStoredValue(
      selectedStorage,
      APP_STORAGE_KEY,
    ),
    legacyCourses: readStoredJson(
      selectedStorage,
      LEGACY_COURSE_STORAGE_KEY,
    ),
    legacyProfile: readStoredJson(
      selectedStorage,
      LEGACY_PROFILE_STORAGE_KEY,
    ),
    legacyTimerSettings: readStoredJson(
      selectedStorage,
      LEGACY_TIMER_SETTINGS_STORAGE_KEY,
    ),
    storedState: readStoredJson(selectedStorage, APP_STORAGE_KEY),
  });
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
        sessionHistory: state.sessionHistory,
        rewards: state.rewards,
        activeView: normalizeActiveView(state.activeView),
      }),
    );

    return true;
  } catch {
    return false;
  }
}
