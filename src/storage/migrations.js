import { normalizeRewards } from "../domain/rewards.js";
import {
  isRecord,
  normalizeActiveView,
  normalizeCourses,
  normalizeId,
  normalizeProfile,
  normalizeSessionHistory,
  normalizeTasks,
  normalizeTimerSettings,
} from "./normalizers.js";
import {
  MILESTONE_10_STORAGE_VERSION,
  MILESTONE_9_STORAGE_VERSION,
  STORAGE_VERSION,
  SUPPORTED_STORAGE_VERSIONS,
} from "./schema.js";

function chooseCurrentValue(currentState, key, legacyValue) {
  return Object.hasOwn(currentState, key) ? currentState[key] : legacyValue;
}

export function isSupportedStoredState(value) {
  return isRecord(value) && SUPPORTED_STORAGE_VERSIONS.has(value.version);
}

export function migrateAppState({
  hasUnifiedStoredValue,
  legacyCourses,
  legacyProfile,
  legacyTimerSettings,
  storedState,
}) {
  const storedStateIsSupported = isSupportedStoredState(storedState);
  const currentState = storedStateIsSupported ? storedState : {};
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
  const supportsHistory =
    currentState.version === STORAGE_VERSION ||
    currentState.version === MILESTONE_10_STORAGE_VERSION ||
    currentState.version === MILESTONE_9_STORAGE_VERSION;
  const sessionHistory = supportsHistory
    ? normalizeSessionHistory(
        currentState.sessionHistory,
        currentState.version === STORAGE_VERSION,
      )
    : [];
  const rewards = normalizeRewards(
    currentState.version === STORAGE_VERSION ||
      currentState.version === MILESTONE_10_STORAGE_VERSION
      ? currentState.rewards
      : undefined,
    sessionHistory,
    tasks,
  );
  const activeView = normalizeActiveView(currentState.activeView);
  const repairedSupportedState =
    storedStateIsSupported &&
    ((Array.isArray(currentState.courses) &&
      courses.length !== currentState.courses.length) ||
      (Array.isArray(currentState.tasks) &&
        tasks.length !== currentState.tasks.length) ||
      (Array.isArray(currentState.sessionHistory) &&
        sessionHistory.length !== currentState.sessionHistory.length) ||
      (Object.hasOwn(currentState, "activeTaskId") &&
        normalizeId(currentState.activeTaskId) &&
        activeTaskId === null) ||
      (Object.hasOwn(currentState, "activeView") &&
        currentState.activeView !== activeView));
  const recoveryMessage =
    hasUnifiedStoredValue && !storedStateIsSupported
      ? "Saved StudyForge data could not be restored, so the app opened with safe defaults."
      : repairedSupportedState
        ? "Some saved StudyForge data was repaired or skipped so the app could open safely."
        : "";

  return {
    profile,
    courses,
    tasks,
    timerSettings,
    completedFocusSessions,
    activeTaskId,
    sessionHistory,
    rewards,
    activeView,
    recoveryMessage,
  };
}
