import { useEffect, useRef, useState } from "react";
import { formatVisibleXp } from "../../domain/formatters.js";
import {
  consumeNaturalCompletion,
  getNaturalCompletionTransition,
  getNextFocusCycleTarget,
  getNextSkippedModeId,
  getResetCycleState,
  getSecondsToAdd,
  getTimerDurationSeconds,
  getTimerMode,
  resetWouldDiscardProgress,
} from "../../domain/timer.js";
import { DEFAULT_TIMER_SETTINGS } from "../../storage/appStorage.js";
import { useTimerAudio } from "./useTimerAudio.js";

export function useTimerEngine({
  initialCompletedFocusSessions,
  initialSettings,
  onNaturalFocusComplete,
  onStatusMessage,
}) {
  const [modeId, setModeId] = useState("focus");
  const [settings, setSettings] = useState(initialSettings);
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => getTimerDurationSeconds("focus", initialSettings),
  );
  const [totalSeconds, setTotalSeconds] = useState(
    () => getTimerDurationSeconds("focus", initialSettings),
  );
  const [status, setStatus] = useState("idle");
  const [completedFocusSessions, setCompletedFocusSessions] = useState(
    initialCompletedFocusSessions,
  );
  const [focusCycleTarget, setFocusCycleTarget] = useState(
    initialSettings.focusSessionsPerCycle,
  );
  const [completionMessage, setCompletionMessage] = useState("");
  const timerEndTimeRef = useRef(null);
  const timerTotalSecondsRef = useRef(
    getTimerDurationSeconds("focus", initialSettings),
  );
  const focusCycleTargetRef = useRef(initialSettings.focusSessionsPerCycle);
  const timerTaskOverrideRef = useRef(null);
  const completionHandledRef = useRef(false);
  const completionCallbackRef = useRef(onNaturalFocusComplete);
  const statusMessageRef = useRef(onStatusMessage);
  const {
    playCompletionSound,
    playStartSound,
    prepareTimerSounds,
  } = useTimerAudio(settings.soundEnabled);

  completionCallbackRef.current = onNaturalFocusComplete;
  statusMessageRef.current = onStatusMessage;
  timerTotalSecondsRef.current = totalSeconds;
  focusCycleTargetRef.current = focusCycleTarget;

  useEffect(() => {
    if (status !== "running") {
      return undefined;
    }

    function updateRemainingTime() {
      if (timerEndTimeRef.current === null) {
        return;
      }

      const millisecondsLeft = Math.max(
        0,
        timerEndTimeRef.current - Date.now(),
      );
      const nextRemainingSeconds = Math.ceil(millisecondsLeft / 1000);

      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0) {
        finishTimer(timerEndTimeRef.current);
      }
    }

    updateRemainingTime();
    const timerInterval = window.setInterval(updateRemainingTime, 250);
    document.addEventListener("visibilitychange", updateRemainingTime);

    return () => {
      window.clearInterval(timerInterval);
      document.removeEventListener("visibilitychange", updateRemainingTime);
    };
  }, [completedFocusSessions, modeId, settings, status]);

  function finishTimer(completedAt = Date.now()) {
    const completionConsumption = consumeNaturalCompletion(
      completionHandledRef.current,
    );

    completionHandledRef.current =
      completionConsumption.completionWasHandled;

    if (!completionConsumption.shouldEmit) {
      return;
    }

    timerEndTimeRef.current = null;

    const completedMode = getTimerMode(modeId);
    const durationMinutes = timerTotalSecondsRef.current / 60;
    const transition = getNaturalCompletionTransition({
      completedFocusSessions,
      focusCycleTarget: focusCycleTargetRef.current,
      modeId,
    });

    if (modeId === "focus") {
      completionCallbackRef.current({
        completedAt,
        durationMinutes,
        forceUnassigned: timerTaskOverrideRef.current === "unassigned",
      });
      setCompletedFocusSessions(transition.completedFocusSessions);

      if (transition.cycleIsComplete) {
        focusCycleTargetRef.current = settings.focusSessionsPerCycle;
        setFocusCycleTarget(settings.focusSessionsPerCycle);
      }

      timerTaskOverrideRef.current = null;
    }

    const nextMode = getTimerMode(transition.nextModeId);
    const nextDurationSeconds = getTimerDurationSeconds(
      transition.nextModeId,
      settings,
    );
    const nextAction = settings.autoStart
      ? `${nextMode.label} started automatically.`
      : `${nextMode.label} is ready.`;

    playCompletionSound();
    setCompletionMessage(
      modeId === "focus"
        ? `${completedMode.label} complete. +${formatVisibleXp(
            durationMinutes + durationMinutes / 10,
          )} XP. ${nextAction}`
        : `${completedMode.label} complete. ${nextAction}`,
    );
    setModeId(transition.nextModeId);
    setRemainingSeconds(nextDurationSeconds);
    timerTotalSecondsRef.current = nextDurationSeconds;
    setTotalSeconds(nextDurationSeconds);

    if (settings.autoStart) {
      completionHandledRef.current = false;
      timerEndTimeRef.current = completedAt + nextDurationSeconds * 1000;
      setStatus("running");
    } else {
      setStatus("idle");
    }
  }

  function start() {
    if (remainingSeconds === 0) {
      return;
    }

    prepareTimerSounds();
    playStartSound();

    if (status !== "paused") {
      timerTaskOverrideRef.current = null;
    }

    completionHandledRef.current = false;
    timerEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setCompletionMessage("");
    setStatus("running");
  }

  function pause() {
    if (timerEndTimeRef.current === null) {
      return;
    }

    const millisecondsLeft = Math.max(
      0,
      timerEndTimeRef.current - Date.now(),
    );
    const nextRemainingSeconds = Math.ceil(millisecondsLeft / 1000);

    if (nextRemainingSeconds === 0) {
      finishTimer(timerEndTimeRef.current);
      return;
    }

    timerEndTimeRef.current = null;
    setRemainingSeconds(nextRemainingSeconds);
    setStatus("paused");
  }

  function resetCycle() {
    const resetState = getResetCycleState(settings);

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    timerTaskOverrideRef.current = null;
    focusCycleTargetRef.current = resetState.focusCycleTarget;
    timerTotalSecondsRef.current = resetState.totalSeconds;
    setModeId(resetState.modeId);
    setCompletedFocusSessions(resetState.completedFocusSessions);
    setFocusCycleTarget(resetState.focusCycleTarget);
    setRemainingSeconds(resetState.remainingSeconds);
    setTotalSeconds(resetState.totalSeconds);
    setCompletionMessage("");
    setStatus(resetState.status);
    statusMessageRef.current("A new Focus cycle is ready.");
  }

  function requestCycleReset() {
    const shouldConfirm = resetWouldDiscardProgress({
      completedFocusSessions,
      focusCycleTarget,
      modeId,
      remainingSeconds,
      settings,
      status,
      totalSeconds,
    });

    if (!shouldConfirm) {
      resetCycle();
      return false;
    }

    if (status === "running") {
      pause();
    }

    return true;
  }

  function nextSession() {
    const nextModeId = getNextSkippedModeId(modeId);
    const nextMode = getTimerMode(nextModeId);
    const nextDurationSeconds = getTimerDurationSeconds(nextModeId, settings);

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    timerTaskOverrideRef.current = null;
    timerTotalSecondsRef.current = nextDurationSeconds;
    setModeId(nextModeId);
    setRemainingSeconds(nextDurationSeconds);
    setTotalSeconds(nextDurationSeconds);
    setCompletionMessage("");
    setStatus("idle");
    statusMessageRef.current(
      `${nextMode.label} is ready. The skipped session did not count toward rewards or cycle progress.`,
    );
  }

  function changeMode(nextModeId) {
    const nextMode = getTimerMode(nextModeId);
    const nextDurationSeconds = getTimerDurationSeconds(
      nextMode.id,
      settings,
    );

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    timerTaskOverrideRef.current = null;
    setModeId(nextMode.id);
    timerTotalSecondsRef.current = nextDurationSeconds;
    setRemainingSeconds(nextDurationSeconds);
    setTotalSeconds(nextDurationSeconds);
    setCompletionMessage("");
    setStatus("idle");
  }

  function addMinute() {
    const secondsToAdd = getSecondsToAdd(timerTotalSecondsRef.current);

    if (secondsToAdd <= 0) {
      statusMessageRef.current(
        "This timer is already at the 180-minute limit.",
      );
      return;
    }

    timerTotalSecondsRef.current += secondsToAdd;
    setTotalSeconds(timerTotalSecondsRef.current);
    setRemainingSeconds((currentSeconds) => currentSeconds + secondsToAdd);

    if (timerEndTimeRef.current !== null) {
      timerEndTimeRef.current += secondsToAdd * 1000;
    }

    statusMessageRef.current("One minute was added to the current timer.");
  }

  function addFocusInterval() {
    const nextTarget = getNextFocusCycleTarget(focusCycleTargetRef.current);

    if (nextTarget === focusCycleTargetRef.current) {
      statusMessageRef.current(
        "This Focus cycle is already at the 99-session limit.",
      );
      return;
    }

    focusCycleTargetRef.current = nextTarget;
    setFocusCycleTarget(nextTarget);
    statusMessageRef.current(
      `This cycle now contains ${nextTarget} Focus intervals.`,
    );
  }

  function startQuickFocus() {
    const quickFocusSeconds = DEFAULT_TIMER_SETTINGS.focusMinutes * 60;

    prepareTimerSounds();
    playStartSound();
    completionHandledRef.current = false;
    timerTaskOverrideRef.current = "unassigned";
    timerTotalSecondsRef.current = quickFocusSeconds;
    timerEndTimeRef.current = Date.now() + quickFocusSeconds * 1000;
    setModeId("focus");
    setTotalSeconds(quickFocusSeconds);
    setRemainingSeconds(quickFocusSeconds);
    setCompletionMessage("");
    setStatus("running");
    statusMessageRef.current(
      "A 25-minute Quick Focus session started without an active task.",
    );
  }

  function saveDurations(nextValues) {
    const nextSettings = { ...settings, ...nextValues };

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setSettings(nextSettings);
    focusCycleTargetRef.current = nextSettings.focusSessionsPerCycle;
    setFocusCycleTarget(nextSettings.focusSessionsPerCycle);
    setCompletedFocusSessions((currentCount) =>
      Math.min(currentCount, nextSettings.focusSessionsPerCycle - 1),
    );
    const nextDurationSeconds = getTimerDurationSeconds(modeId, nextSettings);
    timerTaskOverrideRef.current = null;
    timerTotalSecondsRef.current = nextDurationSeconds;
    setRemainingSeconds(nextDurationSeconds);
    setTotalSeconds(nextDurationSeconds);
    setCompletionMessage("Timer settings applied.");
    setStatus("idle");
  }

  function restoreDefaults() {
    const defaultSettings = { ...DEFAULT_TIMER_SETTINGS };

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setSettings(defaultSettings);
    focusCycleTargetRef.current = defaultSettings.focusSessionsPerCycle;
    setFocusCycleTarget(defaultSettings.focusSessionsPerCycle);
    setCompletedFocusSessions((currentCount) =>
      Math.min(currentCount, defaultSettings.focusSessionsPerCycle - 1),
    );
    const nextDurationSeconds = getTimerDurationSeconds(
      modeId,
      defaultSettings,
    );
    timerTaskOverrideRef.current = null;
    timerTotalSecondsRef.current = nextDurationSeconds;
    setRemainingSeconds(nextDurationSeconds);
    setTotalSeconds(nextDurationSeconds);
    setCompletionMessage("Default timer settings restored.");
    setStatus("idle");
  }

  function toggleAutoStart(isEnabled) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      autoStart: isEnabled,
    }));
  }

  function toggleSound(isEnabled) {
    if (isEnabled) {
      prepareTimerSounds(true);
    }

    setSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled: isEnabled,
    }));
  }

  return {
    addFocusInterval,
    addMinute,
    changeMode,
    completedFocusSessions,
    completionMessage,
    focusCycleTarget,
    modeId,
    nextSession,
    pause,
    remainingSeconds,
    requestCycleReset,
    resetCycle,
    restoreDefaults,
    saveDurations,
    settings,
    start,
    startQuickFocus,
    status,
    toggleAutoStart,
    toggleSound,
    totalSeconds,
  };
}
