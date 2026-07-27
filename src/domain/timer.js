export const TIMER_MODES = [
  { id: "focus", label: "Focus", durationKey: "focusMinutes" },
  { id: "short-break", label: "Short Break", durationKey: "shortBreakMinutes" },
  { id: "long-break", label: "Long Break", durationKey: "longBreakMinutes" },
];

export const SESSION_OUTCOMES = {
  NATURAL_COMPLETION: "natural-completion",
  EARLY_COMPLETION: "early-completion",
  SKIPPED: "skipped",
  CANCELLED: "cancelled",
  CYCLE_RESET: "cycle-reset",
};

export const MAX_TIMER_MINUTES = 180;
export const MAX_FOCUS_SESSIONS = 99;

export function getTimerMode(modeId) {
  return TIMER_MODES.find((mode) => mode.id === modeId) ?? TIMER_MODES[0];
}

export function getTimerDurationSeconds(modeId, settings) {
  const mode = getTimerMode(modeId);
  return settings[mode.durationKey] * 60;
}

export function getNextSkippedModeId(modeId) {
  return modeId === "focus" ? "short-break" : "focus";
}

export function getNaturalCompletionTransition({
  completedFocusSessions,
  focusCycleTarget,
  modeId,
}) {
  if (modeId !== "focus") {
    return {
      completedFocusSessions,
      cycleIsComplete: false,
      nextModeId: "focus",
    };
  }

  const nextFocusCount = completedFocusSessions + 1;
  const cycleIsComplete = nextFocusCount >= focusCycleTarget;

  return {
    completedFocusSessions: cycleIsComplete ? 0 : nextFocusCount,
    cycleIsComplete,
    nextModeId: cycleIsComplete ? "long-break" : "short-break",
  };
}

export function getResetCycleState(settings) {
  const totalSeconds = getTimerDurationSeconds("focus", settings);

  return {
    completedFocusSessions: 0,
    focusCycleTarget: settings.focusSessionsPerCycle,
    modeId: "focus",
    remainingSeconds: totalSeconds,
    status: "idle",
    totalSeconds,
  };
}

export function resetWouldDiscardProgress({
  completedFocusSessions,
  focusCycleTarget,
  modeId,
  remainingSeconds,
  settings,
  status,
  totalSeconds,
}) {
  const configuredModeSeconds = getTimerDurationSeconds(modeId, settings);

  return (
    status !== "idle" ||
    completedFocusSessions > 0 ||
    focusCycleTarget !== settings.focusSessionsPerCycle ||
    totalSeconds !== configuredModeSeconds ||
    remainingSeconds !== configuredModeSeconds
  );
}

export function getSecondsToAdd(totalSeconds) {
  return Math.min(60, MAX_TIMER_MINUTES * 60 - totalSeconds);
}

export function getNextFocusCycleTarget(currentTarget) {
  return Math.min(MAX_FOCUS_SESSIONS, currentTarget + 1);
}

export function getFocusCompletionBonus(durationMinutes) {
  return durationMinutes / 10;
}

export function isCreditedFocusOutcome({ modeId, outcome }) {
  return (
    modeId === "focus" &&
    outcome === SESSION_OUTCOMES.NATURAL_COMPLETION
  );
}

export function consumeNaturalCompletion(completionWasHandled) {
  return {
    completionWasHandled: true,
    shouldEmit: !completionWasHandled,
  };
}
