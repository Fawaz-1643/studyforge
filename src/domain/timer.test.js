import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeNaturalCompletion,
  getNaturalCompletionTransition,
  getNextFocusCycleTarget,
  getNextSkippedModeId,
  getResetCycleState,
  getSecondsToAdd,
  getTimerDurationSeconds,
  isCreditedFocusOutcome,
  resetWouldDiscardProgress,
  SESSION_OUTCOMES,
} from "./timer.js";

const settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  focusSessionsPerCycle: 4,
  autoStart: false,
  soundEnabled: true,
};

test("timer durations and skipped-session transitions remain deterministic", () => {
  assert.equal(getTimerDurationSeconds("focus", settings), 1500);
  assert.equal(getTimerDurationSeconds("short-break", settings), 300);
  assert.equal(getNextSkippedModeId("focus"), "short-break");
  assert.equal(getNextSkippedModeId("short-break"), "focus");
  assert.equal(getNextSkippedModeId("long-break"), "focus");
});

test("natural Focus completion selects short and long breaks correctly", () => {
  assert.deepEqual(
    getNaturalCompletionTransition({
      completedFocusSessions: 2,
      focusCycleTarget: 4,
      modeId: "focus",
    }),
    {
      completedFocusSessions: 3,
      cycleIsComplete: false,
      nextModeId: "short-break",
    },
  );
  assert.deepEqual(
    getNaturalCompletionTransition({
      completedFocusSessions: 3,
      focusCycleTarget: 4,
      modeId: "focus",
    }),
    {
      completedFocusSessions: 0,
      cycleIsComplete: true,
      nextModeId: "long-break",
    },
  );
});

test("break completion returns to Focus without changing Focus progress", () => {
  assert.deepEqual(
    getNaturalCompletionTransition({
      completedFocusSessions: 2,
      focusCycleTarget: 4,
      modeId: "long-break",
    }),
    {
      completedFocusSessions: 2,
      cycleIsComplete: false,
      nextModeId: "focus",
    },
  );
});

test("cycle reset and confirmation calculations preserve current rules", () => {
  assert.deepEqual(getResetCycleState(settings), {
    completedFocusSessions: 0,
    focusCycleTarget: 4,
    modeId: "focus",
    remainingSeconds: 1500,
    status: "idle",
    totalSeconds: 1500,
  });
  assert.equal(
    resetWouldDiscardProgress({
      completedFocusSessions: 0,
      focusCycleTarget: 4,
      modeId: "focus",
      remainingSeconds: 1500,
      settings,
      status: "idle",
      totalSeconds: 1500,
    }),
    false,
  );
  assert.equal(
    resetWouldDiscardProgress({
      completedFocusSessions: 1,
      focusCycleTarget: 4,
      modeId: "focus",
      remainingSeconds: 1500,
      settings,
      status: "idle",
      totalSeconds: 1500,
    }),
    true,
  );
});

test("temporary timer extensions remain bounded", () => {
  assert.equal(getSecondsToAdd(25 * 60), 60);
  assert.equal(getSecondsToAdd(180 * 60), 0);
  assert.equal(getNextFocusCycleTarget(4), 5);
  assert.equal(getNextFocusCycleTarget(99), 99);
});

test("only natural Focus completion is creditable", () => {
  assert.equal(
    isCreditedFocusOutcome({
      modeId: "focus",
      outcome: SESSION_OUTCOMES.NATURAL_COMPLETION,
    }),
    true,
  );

  for (const outcome of [
    SESSION_OUTCOMES.EARLY_COMPLETION,
    SESSION_OUTCOMES.SKIPPED,
    SESSION_OUTCOMES.CANCELLED,
    SESSION_OUTCOMES.CYCLE_RESET,
  ]) {
    assert.equal(isCreditedFocusOutcome({ modeId: "focus", outcome }), false);
  }

  assert.equal(
    isCreditedFocusOutcome({
      modeId: "short-break",
      outcome: SESSION_OUTCOMES.NATURAL_COMPLETION,
    }),
    false,
  );
});

test("natural completion is consumed exactly once", () => {
  const first = consumeNaturalCompletion(false);
  const duplicate = consumeNaturalCompletion(first.completionWasHandled);

  assert.equal(first.shouldEmit, true);
  assert.equal(duplicate.shouldEmit, false);
  assert.equal(duplicate.completionWasHandled, true);
});
