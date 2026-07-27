import { formatTime } from "../../domain/formatters.js";

export function TimerDial({
  activeMode,
  compact = false,
  onPrimaryAction,
  primaryDisabled = false,
  primaryLabel,
  remainingSeconds,
  status,
  totalSeconds,
}) {
  const remainingPercent =
    totalSeconds > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))
      : 0;
  const statusLabel =
    status === "running"
      ? "Timer running"
      : status === "paused"
        ? "Timer paused"
        : "Ready when you are";

  return (
    <div
      className={`timer-dial${compact ? " timer-dial--compact" : ""}${
        status === "running" ? " timer-dial--running" : ""
      }`}
      data-timer-mode={activeMode.id}
    >
      <svg aria-hidden="true" className="timer-dial-rings" viewBox="0 0 240 240">
        <circle className="timer-dial-track" cx="120" cy="120" r="106" />
        <circle
          className="timer-dial-progress"
          cx="120"
          cy="120"
          pathLength="100"
          r="106"
          strokeDashoffset={100 - remainingPercent}
        />
      </svg>
      <div className="timer-dial-content">
        <span className="timer-dial-mode">
          <i aria-hidden="true" />
          {activeMode.label}
        </span>
        <p
          aria-atomic="true"
          aria-label={`${activeMode.label} timer, ${formatTime(
            remainingSeconds,
          )} remaining, ${statusLabel.toLowerCase()}`}
          aria-live="off"
          className="timer-time"
          role="timer"
        >
          {formatTime(remainingSeconds)}
        </p>
        <button
          aria-label={`${primaryLabel} ${activeMode.label} timer`}
          className="timer-dial-primary"
          disabled={primaryDisabled}
          onClick={onPrimaryAction}
          type="button"
        >
          <span
            aria-hidden="true"
            className={status === "running" ? "pause-symbol" : "play-symbol"}
          />
        </button>
        <p className="timer-state">{statusLabel}</p>
      </div>
    </div>
  );
}

export function TimerStage({
  activeMode,
  completedFocusSessions,
  focusCycleTarget,
  onAddFocusInterval,
  onAddMinute,
  onNextSession,
  onPause,
  onReset,
  onStart,
  remainingSeconds,
  status,
  totalSeconds,
}) {
  const primaryAction = status === "running" ? onPause : onStart;
  const primaryLabel =
    status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start";

  return (
    <div className="timer-stage">
      <button
        aria-label="Add one minute to the current timer"
        className="timer-corner-control timer-corner-control--top-left"
        onClick={onAddMinute}
        type="button"
      >
        <strong>+1</strong>
        <span>minute</span>
      </button>
      <button
        aria-label="Add one Focus interval to the current cycle"
        className="timer-corner-control timer-corner-control--top-right"
        disabled={focusCycleTarget >= 99}
        onClick={onAddFocusInterval}
        type="button"
      >
        <strong>+1</strong>
        <span>Focus</span>
      </button>

      <TimerDial
        activeMode={activeMode}
        onPrimaryAction={primaryAction}
        primaryDisabled={remainingSeconds === 0}
        primaryLabel={primaryLabel}
        remainingSeconds={remainingSeconds}
        status={status}
        totalSeconds={totalSeconds}
      />

      <button
        aria-label="Stop the timer and reset the current Focus cycle"
        className="timer-corner-control timer-corner-control--bottom-left"
        onClick={onReset}
        type="button"
      >
        <strong aria-hidden="true">■</strong>
        <span>Reset cycle</span>
      </button>
      <button
        aria-label={`Skip ${activeMode.label} and move to the next session`}
        className="timer-corner-control timer-corner-control--bottom-right"
        onClick={onNextSession}
        type="button"
      >
        <strong aria-hidden="true">→</strong>
        <span>Next session</span>
      </button>

      <p className="cycle-progress">
        {completedFocusSessions} of {focusCycleTarget} Focus sessions completed
        in this cycle
      </p>
    </div>
  );
}
