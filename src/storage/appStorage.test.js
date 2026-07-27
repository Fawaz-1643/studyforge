import assert from "node:assert/strict";
import test from "node:test";
import { loadAppState, saveAppState } from "./appStorage.js";
import {
  APP_STORAGE_KEY,
  LEGACY_COURSE_STORAGE_KEY,
  LEGACY_PROFILE_STORAGE_KEY,
  LEGACY_TIMER_SETTINGS_STORAGE_KEY,
  STORAGE_VERSION,
  VALID_ACTIVE_VIEWS,
} from "./schema.js";

function createStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    values,
  };
}

const course = { id: "course-1", name: "Algorithms", color: "#9b87f5" };
const task = {
  id: "task-1",
  title: "Review graphs",
  courseId: course.id,
  estimatedPomodoros: 2,
  completedPomodoros: 1,
  isCompleted: false,
};
const currentState = {
  version: 4,
  profile: { university: "Khalifa University", fieldOfStudy: "CS" },
  courses: [course],
  tasks: [task],
  timerSettings: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    focusSessionsPerCycle: 4,
    autoStart: false,
    soundEnabled: true,
  },
  completedFocusSessions: 1,
  activeTaskId: task.id,
  sessionHistory: [
    {
      id: "session-1",
      completedAt: "2026-07-27T08:00:00.000Z",
      durationMinutes: 25,
      focusBonusXp: 2.5,
      taskId: task.id,
      taskTitle: task.title,
      courseId: course.id,
      courseName: course.name,
      courseColor: course.color,
    },
  ],
  rewards: {
    achievements: [],
    rewardedTaskIds: [],
    taskBonuses: [],
    totalXp: 999,
  },
  activeView: "history",
};

test("current schema restores valid data and derives fractional rewards", () => {
  const storage = createStorage({
    [APP_STORAGE_KEY]: JSON.stringify(currentState),
  });
  const loaded = loadAppState(storage);

  assert.equal(loaded.courses.length, 1);
  assert.equal(loaded.tasks.length, 1);
  assert.equal(loaded.activeTaskId, task.id);
  assert.equal(loaded.activeView, "history");
  assert.equal(loaded.sessionHistory[0].focusBonusXp, 2.5);
  assert.equal(loaded.rewards.totalXp, 27.5);
});

test("version 3 migration never awards retroactive Focus bonuses", () => {
  const storage = createStorage({
    [APP_STORAGE_KEY]: JSON.stringify({
      ...currentState,
      version: 3,
      sessionHistory: currentState.sessionHistory.map((session) => ({
        ...session,
        focusBonusXp: 2.5,
      })),
    }),
  });
  const loaded = loadAppState(storage);

  assert.equal(loaded.sessionHistory[0].focusBonusXp, 0);
  assert.equal(loaded.rewards.totalXp, 25);
});

test("supported version 2 and version 1 states keep their historical boundaries", () => {
  const version2 = loadAppState(
    createStorage({
      [APP_STORAGE_KEY]: JSON.stringify({
        ...currentState,
        version: 2,
      }),
    }),
  );
  const version1 = loadAppState(
    createStorage({
      [APP_STORAGE_KEY]: JSON.stringify({
        ...currentState,
        version: 1,
      }),
    }),
  );

  assert.equal(version2.sessionHistory.length, 1);
  assert.equal(version2.sessionHistory[0].focusBonusXp, 0);
  assert.equal(version2.rewards.totalXp, 25);
  assert.deepEqual(version1.sessionHistory, []);
  assert.equal(version1.rewards.totalXp, 0);
});

test("legacy keys migrate into the unified state without changing their names", () => {
  const storage = createStorage({
    [LEGACY_COURSE_STORAGE_KEY]: JSON.stringify([course]),
    [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(currentState.profile),
    [LEGACY_TIMER_SETTINGS_STORAGE_KEY]: JSON.stringify(
      currentState.timerSettings,
    ),
  });
  const loaded = loadAppState(storage);

  assert.deepEqual(loaded.courses, [course]);
  assert.deepEqual(loaded.profile, currentState.profile);
  assert.deepEqual(loaded.timerSettings, currentState.timerSettings);
});

test("every valid view restores and invalid views recover to the dashboard", () => {
  for (const activeView of VALID_ACTIVE_VIEWS) {
    const loaded = loadAppState(
      createStorage({
        [APP_STORAGE_KEY]: JSON.stringify({
          ...currentState,
          activeView,
        }),
      }),
    );

    assert.equal(loaded.activeView, activeView);
  }

  const recovered = loadAppState(
    createStorage({
      [APP_STORAGE_KEY]: JSON.stringify({
        ...currentState,
        activeView: "unknown-view",
      }),
    }),
  );

  assert.equal(recovered.activeView, "dashboard");
  assert.match(recovered.recoveryMessage, /repaired or skipped/);
});

test("malformed and unavailable storage fall back safely", () => {
  const malformed = createStorage({ [APP_STORAGE_KEY]: "{broken" });
  const loaded = loadAppState(malformed);

  assert.deepEqual(loaded.courses, []);
  assert.match(loaded.recoveryMessage, /safe defaults/);

  const throwingStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.deepEqual(loadAppState(throwingStorage).courses, []);
  assert.equal(saveAppState(currentState, throwingStorage), false);
});

test("saving preserves schema 4 and excludes memory-only countdown state", () => {
  const storage = createStorage();

  assert.equal(
    saveAppState(
      {
        ...currentState,
        remainingSeconds: 12,
        timerEndTime: Date.now(),
        timerStatus: "running",
      },
      storage,
    ),
    true,
  );

  const saved = JSON.parse(storage.values.get(APP_STORAGE_KEY));
  assert.equal(saved.version, STORAGE_VERSION);
  assert.equal(saved.remainingSeconds, undefined);
  assert.equal(saved.timerEndTime, undefined);
  assert.equal(saved.timerStatus, undefined);
});
