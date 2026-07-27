import { ThemedSelect } from "../../components/ui/ThemedSelect.jsx";
import { getTimerMode, TIMER_MODES } from "../../domain/timer.js";
import { TimerStage } from "./TimerDial.jsx";
import { TimerSettings } from "./TimerSettings.jsx";
import { useTimerFullscreen } from "./useTimerFullscreen.js";

export function TimerView({
  activeTask,
  activeTaskCourse,
  activeTaskId,
  completedFocusSessions,
  completionMessage,
  courses,
  focusCycleTarget,
  modeId,
  onAddFocusInterval,
  onAddMinute,
  onCompleteTask,
  onModeChange,
  onNavigate,
  onNextSession,
  onPause,
  onReset,
  onRestoreDefaults,
  onSaveDurations,
  onStart,
  onSetActiveTask,
  onToggleAutoStart,
  onToggleSound,
  remainingSeconds,
  settings,
  status,
  tasks,
  totalSeconds,
}) {
  const activeMode = getTimerMode(modeId);
  const selectableTasks = tasks.filter((task) => !task.isCompleted);
  const {
    fullscreenIsAvailable,
    fullscreenMessage,
    isFullscreen,
    isSmallScreenDevice,
    timerPanelRef,
    toggleTimerFullscreen,
  } = useTimerFullscreen();

  return (
    <section className="page-content timer-view" aria-labelledby="timer-title">
      <div className="page-heading timer-heading">
        <div>
          <div className="eyebrow">
            <span className="timer-dot" />
            Study timer
          </div>
          <h1 id="timer-title">Make this time count</h1>
          <p className="page-copy">
            Choose a mode, start the clock, and give one session your attention.
          </p>
        </div>
      </div>

      <section
        className="timer-panel"
        data-timer-mode={modeId}
        data-portrait-fullscreen={isSmallScreenDevice ? "true" : "false"}
        aria-label={`${activeMode.label} timer`}
        ref={timerPanelRef}
      >
        <div className="timer-rotate-message">
          <span aria-hidden="true">↻</span>
          <strong>Rotate your device</strong>
          <p role="status">
            The full-screen timer is designed for portrait orientation.
          </p>
          <button
            aria-label="Exit full screen timer"
            className="timer-fullscreen-button"
            onClick={toggleTimerFullscreen}
            type="button"
          >
            <span
              aria-hidden="true"
              className="fullscreen-icon fullscreen-icon--exit"
            />
            <span>Exit full screen</span>
          </button>
        </div>
        <div className="timer-modes" aria-label="Timer mode">
          {TIMER_MODES.map((mode) => (
            <button
              aria-pressed={modeId === mode.id}
              className="timer-mode-button"
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
        <span
          aria-atomic="true"
          aria-live="polite"
          className="sr-only"
          role="status"
        >
          {fullscreenMessage}
        </span>

        <TimerStage
          activeMode={activeMode}
          completedFocusSessions={completedFocusSessions}
          focusCycleTarget={focusCycleTarget}
          onAddFocusInterval={onAddFocusInterval}
          onAddMinute={onAddMinute}
          onNextSession={onNextSession}
          onPause={onPause}
          onReset={onReset}
          onStart={onStart}
          remainingSeconds={remainingSeconds}
          status={status}
          totalSeconds={totalSeconds}
        />

        <div className="timer-fullscreen-row">
          <button
            aria-label={
              isFullscreen
                ? "Exit full screen timer"
                : "Open timer in full screen"
            }
            className="timer-fullscreen-button"
            disabled={!fullscreenIsAvailable}
            onClick={toggleTimerFullscreen}
            type="button"
          >
            <span
              aria-hidden="true"
              className={`fullscreen-icon${
                isFullscreen ? " fullscreen-icon--exit" : ""
              }`}
            />
            <span>{isFullscreen ? "Exit full screen" : "Full screen"}</span>
          </button>
        </div>

        <div
          aria-atomic="true"
          aria-live="polite"
          className={`completion-message${
            completionMessage ? " completion-message--visible" : ""
          }`}
          role="status"
        >
          {completionMessage}
        </div>

      </section>

      <section className="active-task-panel" aria-labelledby="active-task-title">
        <div className="active-task-heading">
          <div>
            <p className="section-kicker">Current study task</p>
            <h2 id="active-task-title">
              {activeTask ? activeTask.title : "Choose a task for this session"}
            </h2>
          </div>
          {activeTask && (
            <div className="active-task-actions">
              <button
                aria-label={`Clear ${activeTask.title} as current task`}
                className="text-button"
                onClick={() => onSetActiveTask(null)}
                type="button"
              >
                Clear
              </button>
              <button
                aria-label={`Mark ${activeTask.title} complete`}
                className="button button--secondary"
                onClick={() => onCompleteTask(activeTask.id)}
                type="button"
              >
                Mark task complete
              </button>
            </div>
          )}
        </div>

        {activeTask && activeTaskCourse ? (
          <div
            className="active-task-details"
            style={{ "--course-color": activeTaskCourse.color }}
          >
            <span className="task-course">
              <i aria-hidden="true" />
              {activeTaskCourse.name}
            </span>
            <strong>
              {activeTask.completedPomodoros ?? 0} /{" "}
              {activeTask.estimatedPomodoros} Pomodoros completed
            </strong>
          </div>
        ) : (
          <p className="active-task-copy">
            {selectableTasks.length
              ? "A completed Focus session will count toward the task selected here."
              : tasks.length
                ? "All tasks are completed. Reopen a task to select it again."
                : "Create a task first, then return here to connect it to Focus sessions."}
          </p>
        )}

        {selectableTasks.length ? (
          <div className="active-task-select">
            <span id="active-task-select-label">
              {activeTask ? "Change task" : "Active task"}
            </span>
            <ThemedSelect
              labelId="active-task-select-label"
              onChange={(taskId) => onSetActiveTask(taskId || null)}
              options={[
                { label: "No active task", value: "" },
                ...selectableTasks.map((task) => {
                  const course = courses.find(
                    (candidate) => candidate.id === task.courseId,
                  );

                  return {
                    label: `${task.title}${course ? ` — ${course.name}` : ""}`,
                    value: task.id,
                  };
                }),
              ]}
              value={activeTaskId ?? ""}
            />
          </div>
        ) : (
          <button
            className="text-link active-task-link"
            onClick={() => onNavigate("tasks")}
            type="button"
          >
            {tasks.length ? "View tasks" : "Create a task"}
            <span aria-hidden="true">→</span>
          </button>
        )}
      </section>

      <TimerSettings
        onRestoreDefaults={onRestoreDefaults}
        onSaveDurations={onSaveDurations}
        onToggleAutoStart={onToggleAutoStart}
        onToggleSound={onToggleSound}
        settings={settings}
      />
    </section>
  );
}
