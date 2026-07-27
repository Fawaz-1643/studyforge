import assert from "node:assert/strict";
import test from "node:test";
import { applyFocusSessionOutcome } from "./focusCompletion.js";
import {
  awardTaskCompletion,
  getLevelProgress,
  normalizeRewards,
} from "./rewards.js";
import { getSessionStatistics } from "./statistics.js";
import {
  filterTasks,
  getTaskCounts,
  validateTaskDetails,
} from "./tasks.js";
import { SESSION_OUTCOMES } from "./timer.js";

const course = { id: "course-1", name: "Algorithms", color: "#9b87f5" };
const task = {
  id: "task-1",
  title: "Review graphs",
  courseId: course.id,
  estimatedPomodoros: 2,
  completedPomodoros: 0,
  isCompleted: false,
};
const completedAt = Date.parse("2026-07-27T08:00:00.000Z");

test("task validation, counts, and filtering preserve fixed estimates", () => {
  const validation = validateTaskDetails(
    {
      title: "  Review graphs  ",
      courseId: course.id,
      estimatedPomodoros: "2",
    },
    [course],
  );

  assert.deepEqual(validation.taskDetails, {
    title: "Review graphs",
    courseId: course.id,
    estimatedPomodoros: 2,
  });
  assert.equal(validateTaskDetails({ title: "", courseId: course.id, estimatedPomodoros: 2 }, [course]).field, "title");
  assert.deepEqual(getTaskCounts([task]), { total: 1, active: 1, completed: 0 });
  assert.deepEqual(filterTasks([task], "active", course.id), [task]);
});

test("one natural Focus outcome updates task, History, and fractional XP once", () => {
  const rewards = normalizeRewards(undefined, [], [task]);
  const result = applyFocusSessionOutcome({
    activeTaskId: task.id,
    completedAt,
    courses: [course],
    createSessionId: () => "session-1",
    durationMinutes: 25,
    modeId: "focus",
    outcome: SESSION_OUTCOMES.NATURAL_COMPLETION,
    rewards,
    sessionHistory: [],
    tasks: [task],
  });

  assert.equal(result.nextTasks[0].completedPomodoros, 1);
  assert.equal(result.nextHistory.length, 1);
  assert.deepEqual(result.nextHistory[0], {
    id: "session-1",
    completedAt: "2026-07-27T08:00:00.000Z",
    durationMinutes: 25,
    focusBonusXp: 2.5,
    taskId: task.id,
    taskTitle: task.title,
    courseId: course.id,
    courseName: course.name,
    courseColor: course.color,
  });
  assert.equal(result.nextRewards.totalXp, 27.5);
  assert.equal(result.summary.totalXp, 27.5);
});

test("unassigned Focus remains coherent and skipped sessions have no effects", () => {
  const rewards = normalizeRewards(undefined, [], [task]);
  const unassigned = applyFocusSessionOutcome({
    activeTaskId: task.id,
    completedAt,
    courses: [course],
    createSessionId: () => "session-unassigned",
    durationMinutes: 25,
    forceUnassigned: true,
    modeId: "focus",
    outcome: SESSION_OUTCOMES.NATURAL_COMPLETION,
    rewards,
    sessionHistory: [],
    tasks: [task],
  });

  assert.equal(unassigned.nextTasks[0].completedPomodoros, 0);
  assert.equal(unassigned.nextHistory[0].taskId, undefined);
  assert.equal(
    applyFocusSessionOutcome({
      activeTaskId: task.id,
      completedAt,
      courses: [course],
      createSessionId: () => "never-created",
      durationMinutes: 25,
      modeId: "focus",
      outcome: SESSION_OUTCOMES.SKIPPED,
      rewards,
      sessionHistory: [],
      tasks: [task],
    }),
    null,
  );
});

test("task completion bonus remains one-time after reopening", () => {
  const rewards = normalizeRewards(undefined, [], [task]);
  const first = awardTaskCompletion(rewards, task, completedAt);
  const second = awardTaskCompletion(first.rewards, task, completedAt + 1000);

  assert.equal(first.bonusXp, 10);
  assert.equal(second.bonusXp, 0);
  assert.equal(second.rewards.totalXp, 10);
});

test("statistics and level progress derive only from valid session records", () => {
  const session = {
    id: "session-1",
    completedAt: "2026-07-27T08:00:00.000Z",
    durationMinutes: 25,
    focusBonusXp: 2.5,
    courseId: course.id,
    courseName: course.name,
    courseColor: course.color,
  };
  const statistics = getSessionStatistics(
    [session],
    [course],
    Date.parse("2026-07-27T12:00:00.000Z"),
  );

  assert.equal(statistics.totalSessions, 1);
  assert.equal(statistics.totalMinutes, 25);
  assert.equal(statistics.courseTimeBreakdown[0].minutes, 25);
  assert.equal(getLevelProgress(27.5).xpIntoLevel, 27.5);
});
