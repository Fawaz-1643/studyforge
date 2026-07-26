import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  countTasksForCourse,
  deleteTaskFromList,
  filterTasks,
  getTaskCounts,
  incrementTaskPomodoroInList,
  saveTaskInList,
  TASK_ESTIMATE_MAX,
  TASK_ESTIMATE_MIN,
  TASK_TITLE_MAX_LENGTH,
  toggleTaskInList,
  validateTaskDetails,
} from "./taskUtils.js";
import {
  DEFAULT_TIMER_SETTINGS,
  loadAppState,
  saveAppState,
} from "./persistence.js";
import {
  createFocusSessionRecord,
  getSessionStatistics,
} from "./statisticsUtils.js";
import {
  ACHIEVEMENTS,
  awardFocusCompletion,
  awardTaskCompletion,
  getAchievementDetails,
  getActiveStreakCount,
  getLevelProgress,
} from "./rewardUtils.js";

const COURSE_COLORS = [
  { name: "Violet", value: "#9b87f5" },
  { name: "Blue", value: "#5b9cf6" },
  { name: "Cyan", value: "#45c7d4" },
  { name: "Green", value: "#61d6a7" },
  { name: "Amber", value: "#f2b95f" },
  { name: "Coral", value: "#ef7e75" },
  { name: "Pink", value: "#e884c4" },
];
const TIMER_MODES = [
  { id: "focus", label: "Focus", durationKey: "focusMinutes" },
  { id: "short-break", label: "Short Break", durationKey: "shortBreakMinutes" },
  { id: "long-break", label: "Long Break", durationKey: "longBreakMinutes" },
];
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "courses", label: "Courses" },
  { id: "tasks", label: "Tasks" },
  { id: "timer", label: "Timer" },
  { id: "history", label: "History" },
  { id: "profile", label: "Profile" },
];
const MODAL_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function useModalDialog(onClose, initialFocusRef) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);

  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return undefined;
    }

    const previouslyFocusedElement = document.activeElement;
    const backdrop = dialog.closest(".modal-backdrop");
    const shell = dialog.closest(".app-shell");
    const inertedSiblings = [];
    const previousBodyOverflow = document.body.style.overflow;

    shell?.querySelectorAll(":scope > *").forEach((element) => {
      if (element !== backdrop && !element.hasAttribute("inert")) {
        element.setAttribute("inert", "");
        inertedSiblings.push(element);
      }
    });

    document.body.style.overflow = "hidden";

    const initialFocusTarget =
      initialFocusRef?.current ??
      dialog.querySelector("[data-initial-focus]") ??
      dialog.querySelector(MODAL_FOCUSABLE_SELECTOR);

    (initialFocusTarget ?? dialog).focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = [
        ...dialog.querySelectorAll(MODAL_FOCUSABLE_SELECTOR),
      ].filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      inertedSiblings.forEach((element) => element.removeAttribute("inert"));
      document.body.style.overflow = previousBodyOverflow;

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      } else {
        document.querySelector("#main-content")?.focus();
      }
    };
  }, [initialFocusRef]);

  return dialogRef;
}

const ThemedSelect = forwardRef(function ThemedSelect(
  {
    describedBy,
    invalid = false,
    label,
    labelId,
    onChange,
    options,
    value,
  },
  forwardedRef,
) {
  const generatedId = useId();
  const listboxId = `themed-select-${generatedId}`;
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);
  const selectedOption = options[selectedIndex] ?? options[0];

  function assignTriggerRef(element) {
    triggerRef.current = element;

    if (typeof forwardedRef === "function") {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleOutsidePointer(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex, isOpen]);

  function chooseOption(option) {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) => {
        const startingIndex = isOpen ? currentIndex : selectedIndex;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (
          (startingIndex + direction + options.length) %
          options.length
        );
      });
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (isOpen) {
        chooseOption(options[highlightedIndex]);
      } else {
        setHighlightedIndex(selectedIndex);
        setIsOpen(true);
      }
    }
  }

  return (
    <div className="themed-select" ref={wrapperRef}>
      <button
        aria-activedescendant={
          isOpen ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
        aria-controls={listboxId}
        aria-describedby={describedBy}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={invalid}
        aria-label={label}
        aria-labelledby={labelId}
        className="themed-select-trigger"
        onClick={() => {
          setHighlightedIndex(selectedIndex);
          setIsOpen((currentValue) => !currentValue);
        }}
        onKeyDown={handleKeyDown}
        ref={assignTriggerRef}
        role="combobox"
        type="button"
      >
        <span>{selectedOption?.label ?? ""}</span>
        <i aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          aria-label={labelId ? undefined : label}
          aria-labelledby={labelId}
          className="themed-select-list"
          id={listboxId}
          role="listbox"
        >
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className={`themed-select-option${
                index === highlightedIndex
                  ? " themed-select-option--highlighted"
                  : ""
              }`}
              id={`${listboxId}-option-${index}`}
              key={option.value}
              onClick={() => chooseOption(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              role="option"
              tabIndex="-1"
              type="button"
            >
              <span>{option.label}</span>
              {option.value === value && <i aria-hidden="true">✓</i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

function createCourseId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function createTaskId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function getTimerMode(modeId) {
  return TIMER_MODES.find((mode) => mode.id === modeId) ?? TIMER_MODES[0];
}

function getTimerDurationSeconds(modeId, settings) {
  const mode = getTimerMode(modeId);
  return settings[mode.durationKey] * 60;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatVisibleXp(value) {
  return Math.floor(Number.isFinite(value) ? value : 0);
}

function TimerDial({
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

function TimerStage({
  activeMode,
  completedFocusSessions,
  focusCycleTarget,
  onAddFocusInterval,
  onAddMinute,
  onOpenPopout,
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
        aria-label="Stop and reset timer"
        className="timer-corner-control timer-corner-control--bottom-left"
        onClick={onReset}
        type="button"
      >
        <strong aria-hidden="true">■</strong>
        <span>Reset</span>
      </button>
      <button
        aria-label="Open the timer in a floating window"
        className="timer-corner-control timer-corner-control--bottom-right"
        onClick={onOpenPopout}
        type="button"
      >
        <strong aria-hidden="true">↗</strong>
        <span>Float</span>
      </button>

      <p className="cycle-progress">
        {completedFocusSessions} of {focusCycleTarget} Focus sessions completed
        in this cycle
      </p>
    </div>
  );
}

function TimerPopout({
  activeTask,
  modeId,
  onClose,
  onModeChange,
  onPause,
  onReset,
  onStart,
  remainingSeconds,
  status,
  totalSeconds,
}) {
  const activeMode = getTimerMode(modeId);
  const primaryAction = status === "running" ? onPause : onStart;
  const primaryLabel =
    status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start";

  return (
    <main className="timer-popout-shell" data-timer-mode={modeId}>
      <header className="timer-popout-header">
        <div>
          <span className="timer-popout-brand">StudyForge</span>
          <strong>Focus companion</strong>
        </div>
        <button
          aria-label="Close popout timer"
          className="icon-button"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </header>

      <div className="timer-modes timer-popout-modes" aria-label="Timer mode">
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

      <TimerDial
        activeMode={activeMode}
        compact
        onPrimaryAction={primaryAction}
        primaryDisabled={remainingSeconds === 0}
        primaryLabel={primaryLabel}
        remainingSeconds={remainingSeconds}
        status={status}
        totalSeconds={totalSeconds}
      />

      <p className="timer-popout-task">
        <span>Current task</span>
        <strong>{activeTask?.title ?? "No active task"}</strong>
      </p>

      <div className="timer-controls timer-popout-controls">
        <button className="button button--secondary" onClick={onReset} type="button">
          Reset
        </button>
      </div>
    </main>
  );
}

function DashboardQuickTimer({
  completedFocusSessions,
  focusCycleTarget,
  modeId,
  onModeChange,
  onNavigate,
  onPause,
  onQuickStart,
  onReset,
  onStart,
  remainingSeconds,
  status,
  totalSeconds,
}) {
  const activeMode = getTimerMode(modeId);
  const isIdleFocusPreview = status === "idle" && modeId === "focus";
  const previewSeconds = DEFAULT_TIMER_SETTINGS.focusMinutes * 60;
  const displayedRemainingSeconds = isIdleFocusPreview
    ? previewSeconds
    : remainingSeconds;
  const displayedTotalSeconds = isIdleFocusPreview ? previewSeconds : totalSeconds;
  const primaryAction =
    status === "running"
      ? onPause
      : status === "paused"
        ? onStart
        : modeId === "focus"
          ? onQuickStart
          : onStart;
  const primaryLabel =
    status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start";
  const modeDescription =
    modeId === "focus"
      ? "Begin a default 25-minute unassigned Focus session without changing task progress."
      : modeId === "short-break"
        ? "Take a brief reset before returning to the next focused interval."
        : "Take a longer reset after completing the current Focus cycle.";

  return (
    <section
      className="dashboard-quick-timer"
      data-timer-mode={activeMode.id}
      aria-labelledby="dashboard-quick-timer-title"
    >
      <div className="dashboard-quick-copy">
        <p className="section-kicker">Quick timer</p>
        <h2 id="dashboard-quick-timer-title">Start before momentum slips away</h2>
        <p className="dashboard-quick-description">{modeDescription}</p>
        <div className="dashboard-timer-modes" aria-label="Quick timer mode">
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
        <p className="dashboard-quick-cycle">
          {completedFocusSessions} of {focusCycleTarget} Focus intervals complete
          in this cycle
        </p>
        <div className="dashboard-quick-actions">
          <button
            className="button button--secondary"
            onClick={() => onNavigate("timer")}
            type="button"
          >
            Open full timer
          </button>
          {status !== "idle" && (
            <button className="text-button" onClick={onReset} type="button">
              Reset timer
            </button>
          )}
        </div>
      </div>
      <TimerDial
        activeMode={activeMode}
        compact
        onPrimaryAction={primaryAction}
        primaryDisabled={displayedRemainingSeconds === 0}
        primaryLabel={primaryLabel}
        remainingSeconds={displayedRemainingSeconds}
        status={status}
        totalSeconds={displayedTotalSeconds}
      />
    </section>
  );
}

function PomodoroFaqItem({ answer, question }) {
  const generatedId = useId();
  const answerId = `pomodoro-answer-${generatedId}`;
  const questionId = `pomodoro-question-${generatedId}`;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`pomodoro-faq-item${isOpen ? " is-open" : ""}`}>
      <button
        aria-controls={answerId}
        aria-expanded={isOpen}
        className="pomodoro-faq-question"
        id={questionId}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span>{question}</span>
        <i aria-hidden="true">+</i>
      </button>
      <div
        aria-hidden={!isOpen}
        aria-labelledby={questionId}
        className="pomodoro-faq-answer"
        id={answerId}
        role="region"
      >
        <div>
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

function formatStudyMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }

  return `${hours} ${hours === 1 ? "hr" : "hrs"} ${minutes} min`;
}

function MiniLevelProgress({ rewards }) {
  const levelProgress = getLevelProgress(rewards.totalXp);
  const visibleXpIntoLevel = formatVisibleXp(levelProgress.xpIntoLevel);

  return (
    <div
      aria-label={`Level ${levelProgress.level}: ${visibleXpIntoLevel} of ${levelProgress.xpForNextLevel} XP`}
      className="mini-level-progress"
    >
      <div className="mini-level-copy">
        <strong>Level {levelProgress.level}</strong>
        <span>
          {visibleXpIntoLevel}/{levelProgress.xpForNextLevel} XP
        </span>
      </div>
      <div
        aria-hidden="true"
        className="mini-level-track"
      >
        <span
          style={{ "--mini-level-progress": `${levelProgress.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function ClockIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path d="M6.5 1.5h3" />
      <circle cx="8" cy="8.5" r="5.25" />
      <path d="M8 5v3.5l2.45 2.15" />
      <circle className="clock-icon-center" cx="8" cy="8.5" r="0.65" />
    </svg>
  );
}

function NavIcon({ id }) {
  const sharedProps = {
    "aria-hidden": true,
    className: `nav-icon nav-icon--${id}`,
    fill: "none",
    viewBox: "0 0 16 16",
  };

  if (id === "dashboard") {
    return (
      <svg {...sharedProps}>
        <rect height="5" rx="1.25" width="5" x="1.5" y="1.5" />
        <rect height="5" rx="1.25" width="5" x="9.5" y="1.5" />
        <rect height="5" rx="1.25" width="5" x="1.5" y="9.5" />
        <rect height="5" rx="1.25" width="5" x="9.5" y="9.5" />
      </svg>
    );
  }

  if (id === "courses") {
    return (
      <svg {...sharedProps}>
        <rect height="4.5" rx="1.25" width="13" x="1.5" y="2" />
        <rect height="4.5" rx="1.25" width="13" x="1.5" y="9.5" />
      </svg>
    );
  }

  if (id === "tasks") {
    return (
      <svg {...sharedProps}>
        <rect height="13" rx="2.25" width="13" x="1.5" y="1.5" />
        <path d="m4.75 8.2 2.05 2.05 4.55-4.7" />
      </svg>
    );
  }

  if (id === "timer") {
    return <ClockIcon className={sharedProps.className} />;
  }

  if (id === "history") {
    return (
      <svg {...sharedProps}>
        <path d="M2 13.75h12" />
        <path d="M3.5 11V7.75h2V11M7 11V3.5h2V11M10.5 11V6h2V11" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <circle cx="8" cy="5" r="3" />
      <path d="M2.75 14c.35-3.1 2.1-4.65 5.25-4.65S12.9 10.9 13.25 14Z" />
    </svg>
  );
}

function PlusIcon() {
  return <span className="plus-icon" aria-hidden="true" />;
}

function ProfilePanel({ profile, onSave }) {
  const hasProfile = Boolean(profile.university || profile.fieldOfStudy);
  const [isEditing, setIsEditing] = useState(!hasProfile);
  const [university, setUniversity] = useState(profile.university);
  const [fieldOfStudy, setFieldOfStudy] = useState(profile.fieldOfStudy);

  function handleSubmit(event) {
    event.preventDefault();

    const nextProfile = {
      university: university.trim(),
      fieldOfStudy: fieldOfStudy.trim(),
    };

    onSave(nextProfile);

    if (nextProfile.university || nextProfile.fieldOfStudy) {
      setIsEditing(false);
    }
  }

  function cancelEditing() {
    setUniversity(profile.university);
    setFieldOfStudy(profile.fieldOfStudy);
    setIsEditing(false);
  }

  if (!isEditing && hasProfile) {
    return (
      <section className="profile-panel profile-panel--saved" aria-labelledby="profile-title">
        <div className="profile-avatar" aria-hidden="true">
          <span />
        </div>
        <div className="profile-details">
          <p className="section-kicker">Student profile</p>
          <h2 id="profile-title">Your academic identity</h2>
          <dl>
            {profile.fieldOfStudy && (
              <div>
                <dt>Field of study</dt>
                <dd>{profile.fieldOfStudy}</dd>
              </div>
            )}
            {profile.university && (
              <div>
                <dt>University</dt>
                <dd>{profile.university}</dd>
              </div>
            )}
          </dl>
        </div>
        <button
          className="button button--secondary profile-edit-button"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Edit profile
        </button>
      </section>
    );
  }

  return (
    <section className="profile-panel" aria-labelledby="profile-title">
      <div className="profile-intro">
        <div>
          <p className="section-kicker">Make it yours</p>
          <h2 id="profile-title">Set up your academic identity</h2>
        </div>
        <p>
          Add a little context to StudyForge. Both details are optional and stay on
          this device.
        </p>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-fields">
          <label>
            <span className="field-label">
              University <span className="optional-label">Optional</span>
            </span>
            <input
              autoComplete="organization"
              className="text-input"
              maxLength={80}
              onChange={(event) => setUniversity(event.target.value)}
              placeholder="e.g. University of Dubai"
              value={university}
            />
          </label>
          <label>
            <span className="field-label">
              Field of study <span className="optional-label">Optional</span>
            </span>
            <input
              autoComplete="off"
              className="text-input"
              maxLength={80}
              onChange={(event) => setFieldOfStudy(event.target.value)}
              placeholder="e.g. Computer Science"
              value={fieldOfStudy}
            />
          </label>
        </div>
        <div className="profile-form-actions">
          {hasProfile && (
            <button
              className="button button--secondary"
              onClick={cancelEditing}
              type="button"
            >
              Cancel
            </button>
          )}
          <button
            className="button button--primary"
            disabled={!university.trim() && !fieldOfStudy.trim()}
            type="submit"
          >
            Save profile
          </button>
        </div>
      </form>
    </section>
  );
}

function CourseForm({ course, onCancel, onSave }) {
  const [name, setName] = useState(course?.name ?? "");
  const [color, setColor] = useState(course?.color ?? COURSE_COLORS[0].value);
  const [formError, setFormError] = useState("");
  const nameInputRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, nameInputRef);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("Enter a course name before saving.");
      nameInputRef.current?.focus();
      return;
    }

    setFormError("");
    onSave({ name: trimmedName, color });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="course-form-title"
        aria-modal="true"
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="modal-heading">
          <div>
            <p className="section-kicker">{course ? "Update course" : "New course"}</p>
            <h2 id="course-form-title">
              {course ? "Edit course" : "Add a course"}
            </h2>
          </div>
          <button
            aria-label="Close"
            className="icon-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="course-name">
            Course name
          </label>
          <input
            aria-describedby={formError ? "course-form-error" : undefined}
            aria-invalid={Boolean(formError)}
            autoComplete="off"
            className="text-input"
            id="course-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Organic Chemistry"
            ref={nameInputRef}
            required
            value={name}
          />

          <fieldset>
            <legend>Course color</legend>
            <div className="color-options">
              {COURSE_COLORS.map((option) => (
                <label
                  className={`color-option${color === option.value ? " is-selected" : ""}`}
                  key={option.value}
                  style={{ "--course-color": option.value }}
                  title={option.name}
                >
                  <input
                    checked={color === option.value}
                    name="course-color"
                    onChange={() => setColor(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span aria-hidden="true" />
                  <span className="sr-only">{option.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <p
            className={`form-message modal-form-message${
              formError ? " form-message--error" : ""
            }`}
            id="course-form-error"
            role={formError ? "alert" : undefined}
          >
            {formError}
          </p>

          <div className="modal-actions">
            <button className="button button--secondary" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="button button--primary" type="submit">
              {course ? "Save changes" : "Add course"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteConfirmation({ course, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, cancelButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="delete-course-description"
        aria-labelledby="delete-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
        tabIndex="-1"
      >
        <div className="delete-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="delete-title">Delete {course.name}?</h2>
        <p className="modal-copy" id="delete-course-description">
          This removes the course from this device. This action can’t be undone.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Keep course
          </button>
          <button className="button button--danger" onClick={onConfirm} type="button">
            Delete course
          </button>
        </div>
      </section>
    </div>
  );
}

function DashboardView({
  activeTask,
  completedFocusSessions,
  courses,
  focusCycleTarget,
  onChangeTimerMode,
  onNavigate,
  onPauseTimer,
  onQuickFocus,
  onResetTimer,
  onStartTimer,
  profile,
  rewards,
  sessionHistory,
  tasks,
  timerModeId,
  timerRemainingSeconds,
  timerSettings,
  timerStatus,
  timerTotalSeconds,
}) {
  const hasProfile = Boolean(profile.university || profile.fieldOfStudy);
  const taskCounts = getTaskCounts(tasks);
  const levelProgress = getLevelProgress(rewards.totalXp);
  const currentStreak = getActiveStreakCount(rewards.streak);
  const earnedAchievementIds = new Set(
    rewards.achievements.map((achievement) => achievement.id),
  );
  const statistics = getSessionStatistics(sessionHistory, courses);
  const courseTimeLookup = new Map(
    statistics.courseTimeBreakdown.map((courseTotal) => [
      courseTotal.courseId,
      courseTotal,
    ]),
  );
  const maximumTrendMinutes = Math.max(
    1,
    ...statistics.sevenDayTrend.map((day) => day.minutes),
  );
  const recentSessions = [...sessionHistory]
    .sort(
      (first, second) =>
        Date.parse(second.completedAt) - Date.parse(first.completedAt),
    )
    .slice(0, 3);
  const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
  });
  const recentSessionFormatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });

  return (
    <section className="page-content" aria-labelledby="dashboard-title">
      <div className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Dashboard
          </div>
          <h1 id="dashboard-title">Your study space</h1>
          <p className="page-copy">
            Everything you’ve set up so far, kept simple and easy to reach.
          </p>
        </div>
      </div>

      <DashboardQuickTimer
        completedFocusSessions={completedFocusSessions}
        focusCycleTarget={focusCycleTarget}
        modeId={timerModeId}
        onModeChange={onChangeTimerMode}
        onNavigate={onNavigate}
        onPause={onPauseTimer}
        onQuickStart={onQuickFocus}
        onReset={onResetTimer}
        onStart={onStartTimer}
        remainingSeconds={timerRemainingSeconds}
        status={timerStatus}
        totalSeconds={timerTotalSeconds}
      />

      <section
        className="dashboard-spotlight"
        aria-labelledby="dashboard-spotlight-title"
      >
        <div className="dashboard-spotlight-copy">
          <p className="section-kicker">Continue your momentum</p>
          <h2 id="dashboard-spotlight-title">
            {activeTask ? activeTask.title : "Choose what deserves your attention"}
          </h2>
          <p>
            {activeTask
              ? `A ${timerSettings.focusMinutes}-minute Focus session is ready for “${activeTask.title}”.`
              : tasks.length
                ? "Select a current task, then use the timer to turn your plan into focused progress."
                : "Create a course-linked task when you are ready to plan your first focused session."}
          </p>
          <div className="dashboard-spotlight-actions">
            <button
              className="button button--primary"
              onClick={() => onNavigate(activeTask ? "timer" : "tasks")}
              type="button"
            >
              {activeTask ? "Open focus timer" : "Choose a task"}
            </button>
            <button
              className="button button--secondary"
              onClick={() => onNavigate("history")}
              type="button"
            >
              View study history
            </button>
          </div>
        </div>

        <dl className="dashboard-spotlight-stats">
          <div>
            <dt>Today</dt>
            <dd>
              <strong>{formatStudyMinutes(statistics.todayMinutes)}</strong>
              <span>
                {statistics.todaySessions}{" "}
                {statistics.todaySessions === 1 ? "session" : "sessions"}
              </span>
            </dd>
          </div>
          <div>
            <dt>This week</dt>
            <dd>
              <strong>{formatStudyMinutes(statistics.weekMinutes)}</strong>
              <span>
                {statistics.weekSessions}{" "}
                {statistics.weekSessions === 1 ? "session" : "sessions"}
              </span>
            </dd>
          </div>
          <div>
            <dt>Open work</dt>
            <dd>
              <strong>{taskCounts.active}</strong>
              <span>
                {taskCounts.active === 1 ? "active task" : "active tasks"}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="dashboard-courses"
        aria-labelledby="dashboard-courses-title"
      >
        <div className="dashboard-section-heading">
          <div>
            <p className="section-kicker">Course library</p>
            <h2 id="dashboard-courses-title">
              {courses.length ? "Your subjects at a glance" : "Build your course list"}
            </h2>
            <p>
              See open work and recorded Focus time for each subject.
            </p>
          </div>
          <button
            className="text-link"
            onClick={() => onNavigate("courses")}
            type="button"
          >
            {courses.length ? "Manage courses" : "Add a course"}
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {courses.length ? (
          <div className="dashboard-course-grid">
            {courses.map((course, index) => {
              const courseTasks = tasks.filter(
                (task) => task.courseId === course.id,
              );
              const activeCourseTasks = courseTasks.filter(
                (task) => !task.isCompleted,
              ).length;
              const completedCoursePomodoros = courseTasks.reduce(
                (total, task) => total + (task.completedPomodoros ?? 0),
                0,
              );
              const estimatedCoursePomodoros = courseTasks.reduce(
                (total, task) => total + task.estimatedPomodoros,
                0,
              );
              const courseFocusMinutes =
                courseTimeLookup.get(course.id)?.minutes ?? 0;
              const progressPercent = estimatedCoursePomodoros
                ? Math.min(
                    100,
                    (completedCoursePomodoros / estimatedCoursePomodoros) * 100,
                  )
                : 0;

              return (
                <article
                  className="dashboard-course-card"
                  key={course.id}
                  style={{
                    "--course-color": course.color,
                    "--course-progress": `${progressPercent}%`,
                  }}
                >
                  <div className="dashboard-course-card-top">
                    <span className="dashboard-course-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="dashboard-course-dot" aria-hidden="true" />
                  </div>
                  <div>
                    <h3>{course.name}</h3>
                    <p>
                      {activeCourseTasks}{" "}
                      {activeCourseTasks === 1 ? "active task" : "active tasks"}
                    </p>
                  </div>
                  <dl>
                    <div>
                      <dt>Focused</dt>
                      <dd>{formatStudyMinutes(courseFocusMinutes)}</dd>
                    </div>
                    <div>
                      <dt>Pomodoros</dt>
                      <dd>
                        {completedCoursePomodoros}/{estimatedCoursePomodoros || 0}
                      </dd>
                    </div>
                  </dl>
                  <div
                    aria-label={`${Math.round(
                      progressPercent,
                    )}% of estimated Pomodoros completed for ${course.name}`}
                    aria-valuemax="100"
                    aria-valuemin="0"
                    aria-valuenow={Math.round(progressPercent)}
                    className="dashboard-course-progress"
                    role="progressbar"
                  >
                    <span />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-courses-empty">
            <span aria-hidden="true">＋</span>
            <div>
              <strong>Your first subject will make this space useful.</strong>
              <p>Add a course, choose its color, then connect tasks to it.</p>
            </div>
            <button
              className="button button--primary"
              onClick={() => onNavigate("courses")}
              type="button"
            >
              Add first course
            </button>
          </div>
        )}
      </section>

      <section className="reward-progress" aria-labelledby="reward-progress-title">
        <div className="reward-progress-heading">
          <div>
            <p className="section-kicker">Study progress</p>
            <h2 id="reward-progress-title">
              {rewards.totalXp
                ? `Level ${levelProgress.level}`
                : "Your progress starts with focused work"}
            </h2>
            <p>
              {rewards.totalXp
                ? `${formatVisibleXp(rewards.totalXp)} total XP · ${currentStreak} ${
                    currentStreak === 1 ? "day" : "days"
                  } in your current streak`
                : "Complete a Focus session to earn one XP per focused minute."}
            </p>
          </div>
          <div className="reward-level-badge" aria-label={`Level ${levelProgress.level}`}>
            <span>Level</span>
            <strong>{levelProgress.level}</strong>
          </div>
        </div>

        <div className="reward-level-progress">
          <div className="reward-level-labels">
            <strong>
              {formatVisibleXp(levelProgress.xpIntoLevel)} /{" "}
              {levelProgress.xpForNextLevel} XP
            </strong>
            <span>
              {formatVisibleXp(levelProgress.xpRemaining)} XP to next level
            </span>
          </div>
          <div
            aria-label={`${Math.round(levelProgress.progressPercent)}% toward level ${
              levelProgress.level + 1
            }`}
            aria-valuemax={levelProgress.xpForNextLevel}
            aria-valuemin="0"
            aria-valuenow={formatVisibleXp(levelProgress.xpIntoLevel)}
            className="reward-progress-track"
            role="progressbar"
          >
            <span
              style={{ "--reward-progress": `${levelProgress.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="achievement-grid" aria-label="Study achievements">
          {ACHIEVEMENTS.map((achievement) => {
            const isEarned = earnedAchievementIds.has(achievement.id);

            return (
              <article
                className={`achievement-card${
                  isEarned ? " achievement-card--earned" : ""
                }`}
                key={achievement.id}
              >
                <span className="achievement-mark" aria-hidden="true">
                  {isEarned ? "✓" : "·"}
                </span>
                <div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                </div>
                <span className="achievement-state">
                  {isEarned ? "Earned" : "Not earned"}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="dashboard-history"
        aria-labelledby="dashboard-history-title"
      >
        <div className="dashboard-section-heading">
          <div>
            <p className="section-kicker">Recent rhythm</p>
            <h2 id="dashboard-history-title">Your last seven days</h2>
            <p>
              A compact view of the Focus sessions already recorded in History.
            </p>
          </div>
          <button
            className="text-link"
            onClick={() => onNavigate("history")}
            type="button"
          >
            Open full history
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="dashboard-history-grid">
          <div className="dashboard-trend" aria-label="Seven-day study trend">
            {statistics.sevenDayTrend.map((day) => (
              <div
                aria-label={`${weekdayFormatter.format(day.date)}: ${
                  day.sessions
                } ${day.sessions === 1 ? "session" : "sessions"}, ${
                  day.minutes
                } minutes`}
                className="dashboard-trend-day"
                data-tooltip={`${weekdayFormatter.format(day.date)} · ${
                  day.minutes
                } min · ${day.sessions} ${
                  day.sessions === 1 ? "session" : "sessions"
                }`}
                key={day.key}
                role="img"
                tabIndex="0"
              >
                <span className="dashboard-trend-value">
                  {day.minutes ? `${day.minutes}m` : "—"}
                </span>
                <span className="dashboard-trend-track">
                  <i
                    style={{
                      "--dashboard-trend-height": `${Math.max(
                        day.minutes ? 12 : 3,
                        (day.minutes / maximumTrendMinutes) * 100,
                      )}%`,
                    }}
                  />
                </span>
                <span>{weekdayFormatter.format(day.date)}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-recent-sessions">
            <div className="dashboard-recent-heading">
              <strong>Recent sessions</strong>
              <span>{statistics.totalSessions} all time</span>
            </div>
            {recentSessions.length ? (
              <ul>
                {recentSessions.map((session) => (
                  <li key={session.id}>
                    <span
                      className="dashboard-session-dot"
                      style={{
                        "--session-color":
                          session.courseColor ?? "rgba(150, 155, 171, 0.7)",
                      }}
                    />
                    <div>
                      <strong>{session.taskTitle ?? "Unassigned Focus session"}</strong>
                      <span>
                        {session.courseName ?? "No course selected"} ·{" "}
                        {recentSessionFormatter.format(
                          new Date(session.completedAt),
                        )}
                      </span>
                    </div>
                    <b>{session.durationMinutes} min</b>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard-history-empty">
                <strong>Your study history starts with one Focus session.</strong>
                <p>
                  Completed Focus sessions will appear here automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        className="pomodoro-story"
        aria-labelledby="pomodoro-story-title"
      >
        <div className="pomodoro-story-copy">
          <p className="section-kicker">Where the rhythm began</p>
          <h2 id="pomodoro-story-title">One kitchen timer. One honest interval.</h2>
          <p>
            In 1987, university student Francesco Cirillo challenged himself to
            focus with a tomato-shaped kitchen timer. The simple experiment grew
            into a method for planning work, protecting breaks, handling
            interruptions, and learning from completed sessions.
          </p>
          <a
            href="https://www.pomodorotechnique.com/francesco-cirillo/"
            rel="noreferrer"
            target="_blank"
          >
            Read the creator’s story
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="pomodoro-origin-visual" aria-hidden="true">
          <span className="pomodoro-orbit pomodoro-orbit--outer" />
          <span className="pomodoro-orbit pomodoro-orbit--inner" />
          <div className="tomato-timer-illustration">
            <i />
            <strong>25</strong>
            <span>minutes</span>
          </div>
          <span className="pomodoro-visual-note pomodoro-visual-note--focus">
            Focus deeply
          </span>
          <span className="pomodoro-visual-note pomodoro-visual-note--rest">
            Rest deliberately
          </span>
        </div>

        <ol className="pomodoro-rhythm">
          <li>
            <span aria-hidden="true">◎</span>
            <div>
              <strong>Choose one commitment</strong>
              <p>Make the next interval specific enough to begin.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">↗</span>
            <div>
              <strong>Work with a boundary</strong>
              <p>Give the Focus interval your attention until it ends.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">∿</span>
            <div>
              <strong>Step away on purpose</strong>
              <p>Use the break to reset before the next commitment.</p>
            </div>
          </li>
        </ol>

        <p className="pomodoro-attribution">
          StudyForge is independent and is not affiliated with or endorsed by
          Francesco Cirillo or Pomodoro Technique®.
        </p>
      </section>

      <section className="pomodoro-faq" aria-labelledby="pomodoro-faq-title">
        <div className="pomodoro-faq-heading">
          <p className="section-kicker">Questions, answered</p>
          <h2 id="pomodoro-faq-title">Make the method work for your study day</h2>
          <p>
            A few practical answers about intervals, interruptions, breaks, and
            how StudyForge records your work.
          </p>
        </div>
        <div className="pomodoro-faq-list">
          <PomodoroFaqItem
            answer="Twenty-five minutes is the traditional starting point, not a test you can fail. StudyForge lets you adjust the duration while keeping a clear Focus-and-break rhythm."
            question="Does every Focus interval have to be 25 minutes?"
          />
          <PomodoroFaqItem
            answer="Step away from the task when you can: stretch, get water, or rest your eyes. The useful part is giving the next Focus interval a distinct beginning."
            question="What should I do during a break?"
          />
          <PomodoroFaqItem
            answer="Pause if you expect to return, or reset if the session is over. Paused, reset, cancelled, or manually switched sessions never earn Focus XP or create History records."
            question="What happens if my session is interrupted?"
          />
          <PomodoroFaqItem
            answer="No. An unassigned Focus session still records its time and rewards when it finishes naturally; it simply leaves task progress unchanged."
            question="Do I need to select a task before starting?"
          />
          <PomodoroFaqItem
            answer="It appears after the number of completed Focus intervals selected for the current cycle. The top-right timer control can add another Focus interval to that cycle without adding minutes."
            question="When does the Long Break appear?"
          />
        </div>
      </section>

      <section
        className="dashboard-mini-profile"
        aria-labelledby="dashboard-mini-profile-title"
      >
        <div className="dashboard-mini-profile-mark" aria-hidden="true">
          <span />
        </div>
        <div className="dashboard-mini-profile-copy">
          <p className="section-kicker">Student profile</p>
          <h2 id="dashboard-mini-profile-title">
            {profile.fieldOfStudy || "Make this study space yours"}
          </h2>
          <p>
            {profile.university ||
              "Add an optional field of study and university to personalize StudyForge."}
          </p>
        </div>
        <span className="overview-status">
          {hasProfile ? "Profile ready" : "Not set"}
        </span>
        <button
          className="button button--secondary"
          onClick={() => onNavigate("profile")}
          type="button"
        >
          {hasProfile ? "View profile" : "Set up profile"}
        </button>
      </section>

      <aside className="dashboard-note">
        <span className="dashboard-note-mark" aria-hidden="true">
          i
        </span>
        <div>
          <strong>Your information stays on this device</strong>
          <p>
            StudyForge saves your profile, courses, tasks, cycle progress,
            completed Focus history, and earned rewards in this browser.
          </p>
        </div>
      </aside>
    </section>
  );
}

function HistoryView({ courses, sessionHistory }) {
  const statistics = getSessionStatistics(sessionHistory, courses);
  const orderedHistory = [...sessionHistory].sort(
    (first, second) =>
      Date.parse(second.completedAt) - Date.parse(first.completedAt),
  );
  const maximumTrendMinutes = Math.max(
    1,
    ...statistics.sevenDayTrend.map((day) => day.minutes),
  );
  const completedDateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
  });
  const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });

  return (
    <section className="page-content history-view" aria-labelledby="history-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Study history
          </div>
          <h1 id="history-title">Your focused work</h1>
          <p className="page-copy">
            A device-local record of naturally completed Focus sessions.
          </p>
        </div>
      </div>

      <div className="history-summary" aria-label="Focus session totals">
        <article>
          <span>Today</span>
          <strong>{statistics.todaySessions}</strong>
          <small>
            {statistics.todaySessions === 1 ? "Focus session" : "Focus sessions"}
            {" · "}
            {formatStudyMinutes(statistics.todayMinutes)}
          </small>
        </article>
        <article>
          <span>Current week</span>
          <strong>{statistics.weekSessions}</strong>
          <small>
            {statistics.weekSessions === 1 ? "Focus session" : "Focus sessions"}
            {" · "}
            {formatStudyMinutes(statistics.weekMinutes)}
          </small>
        </article>
        <article>
          <span>All recorded</span>
          <strong>{statistics.totalSessions}</strong>
          <small>{formatStudyMinutes(statistics.totalMinutes)} focused</small>
        </article>
      </div>

      {sessionHistory.length === 0 ? (
        <section className="history-empty-state" aria-labelledby="history-empty-title">
          <div className="history-empty-icon" aria-hidden="true">
            <ClockIcon className="history-empty-clock" />
          </div>
          <p className="section-kicker">Nothing recorded yet</p>
          <h2 id="history-empty-title">Complete a Focus session to begin</h2>
          <p>
            Pauses, resets, breaks, settings changes, and cancelled sessions will
            never appear here.
          </p>
        </section>
      ) : (
        <>
          <div className="history-insights">
            <section className="history-panel" aria-labelledby="trend-title">
              <div className="history-panel-heading">
                <div>
                  <p className="section-kicker">Last seven days</p>
                  <h2 id="trend-title">Study trend</h2>
                </div>
                <span>{formatStudyMinutes(
                  statistics.sevenDayTrend.reduce(
                    (total, day) => total + day.minutes,
                    0,
                  ),
                )}</span>
              </div>
              <div className="study-trend">
                {statistics.sevenDayTrend.map((day) => (
                  <div
                    aria-label={`${shortDateFormatter.format(day.date)}: ${
                      day.sessions
                    } ${
                      day.sessions === 1 ? "session" : "sessions"
                    }, ${formatStudyMinutes(day.minutes)}`}
                    className="trend-day"
                    data-tooltip={`${shortDateFormatter.format(day.date)} · ${formatStudyMinutes(
                      day.minutes,
                    )} · ${day.sessions} ${
                      day.sessions === 1 ? "session" : "sessions"
                    }`}
                    key={day.key}
                    role="img"
                    tabIndex="0"
                  >
                    <div
                      aria-hidden="true"
                      className="trend-bar-track"
                    >
                      <span
                        className="trend-bar"
                        style={{
                          "--trend-height": `${(day.minutes / maximumTrendMinutes) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{day.sessions}</strong>
                    <small>{weekdayFormatter.format(day.date)}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="history-panel" aria-labelledby="breakdown-title">
              <div className="history-panel-heading">
                <div>
                  <p className="section-kicker">All recorded time</p>
                  <h2 id="breakdown-title">Course breakdown</h2>
                </div>
              </div>
              <div className="course-time-list">
                {statistics.courseTimeBreakdown.map((courseTotal) => (
                  <div
                    className="course-time-row"
                    key={courseTotal.courseId ?? "unassigned"}
                    style={{ "--course-color": courseTotal.color }}
                  >
                    <div className="course-time-label">
                      <span aria-hidden="true" />
                      <div>
                        <strong>{courseTotal.name}</strong>
                        <small>
                          {courseTotal.sessions}{" "}
                          {courseTotal.sessions === 1 ? "session" : "sessions"}
                        </small>
                      </div>
                    </div>
                    <div className="course-time-value">
                      <strong>{formatStudyMinutes(courseTotal.minutes)}</strong>
                      <span>
                        {Math.round(
                          (courseTotal.minutes / statistics.totalMinutes) * 100,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="session-history" aria-labelledby="session-history-title">
            <div className="history-panel-heading">
              <div>
                <p className="section-kicker">Completed Focus sessions</p>
                <h2 id="session-history-title">Session history</h2>
              </div>
              <span>
                {statistics.totalSessions}{" "}
                {statistics.totalSessions === 1 ? "record" : "records"}
              </span>
            </div>
            <div className="session-list">
              {orderedHistory.map((session) => (
                <article className="session-record" key={session.id}>
                  <div className="session-record-mark" aria-hidden="true">
                    ✓
                  </div>
                  <div className="session-record-details">
                    <strong>{session.taskTitle ?? "Focus session"}</strong>
                    <span>
                      {session.courseName ??
                        (session.taskTitle
                          ? "No course association"
                          : "No task or course selected")}
                    </span>
                  </div>
                  <div className="session-record-meta">
                    <strong>{formatStudyMinutes(session.durationMinutes)}</strong>
                    <time dateTime={session.completedAt}>
                      {completedDateFormatter.format(new Date(session.completedAt))}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function CoursesView({ courses, onAdd, onDelete, onEdit }) {
  return (
    <section
      className="page-content courses-view"
      aria-labelledby="courses-title"
    >
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Course library
          </div>
          <h1 id="courses-title">Your courses</h1>
          <p className="page-copy">
            Give every subject a home and a color you’ll recognize at a glance.
          </p>
        </div>
        <button className="button button--primary add-button" onClick={onAdd}>
          <PlusIcon />
          Add course
        </button>
      </div>

      <div className="course-summary" aria-live="polite">
        <span>{courses.length}</span> {courses.length === 1 ? "course" : "courses"}
        <span className="summary-divider" aria-hidden="true" />
        Saved on this device
      </div>

      {courses.length === 0 ? (
        <section className="empty-state">
          <div className="empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>No courses yet</h2>
          <p>Add the subjects you’re studying. You can rename or recolor them anytime.</p>
          <button className="button button--primary" onClick={onAdd}>
            <PlusIcon />
            Add your first course
          </button>
        </section>
      ) : (
        <ul className="course-grid">
          {courses.map((course) => (
            <li
              className="course-card"
              key={course.id}
              style={{ "--course-color": course.color }}
            >
              <div className="course-color" aria-hidden="true" />
              <div className="course-content">
                <p className="course-label">Course</p>
                <h2>{course.name}</h2>
              </div>
              <div className="course-actions">
                <button
                  aria-label={`Edit ${course.name}`}
                  className="text-button"
                  onClick={() => onEdit(course)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  aria-label={`Delete ${course.name}`}
                  className="text-button text-button--danger"
                  onClick={() => onDelete(course)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskForm({ courses, onCancel, onSave, task }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [courseId, setCourseId] = useState(task?.courseId ?? courses[0]?.id ?? "");
  const [estimate, setEstimate] = useState(
    String(task?.estimatedPomodoros ?? 1),
  );
  const [formError, setFormError] = useState("");
  const [formErrorField, setFormErrorField] = useState(null);
  const titleInputRef = useRef(null);
  const courseSelectRef = useRef(null);
  const estimateInputRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, titleInputRef);

  function handleSubmit(event) {
    event.preventDefault();
    const validation = validateTaskDetails(
      {
        title,
        courseId,
        estimatedPomodoros: estimate,
      },
      courses,
    );

    if (validation.error) {
      setFormError(validation.error);
      setFormErrorField(validation.field);

      if (validation.field === "title") {
        titleInputRef.current?.focus();
      } else if (validation.field === "course") {
        courseSelectRef.current?.focus();
      } else if (validation.field === "estimate") {
        estimateInputRef.current?.focus();
      }

      return;
    }

    setFormError("");
    setFormErrorField(null);
    onSave(validation.taskDetails);
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="modal-heading">
          <div>
            <p className="section-kicker">{task ? "Update task" : "New task"}</p>
            <h2 id="task-form-title">{task ? "Edit task" : "Add a task"}</h2>
          </div>
          <button
            aria-label="Close"
            className="icon-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="task-title">
            Task title
          </label>
          <input
            aria-describedby={`task-title-help${
              formErrorField === "title" ? " task-form-error" : ""
            }`}
            aria-invalid={formErrorField === "title"}
            autoComplete="off"
            className="text-input"
            id="task-title"
            maxLength={TASK_TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Review lecture notes"
            ref={titleInputRef}
            value={title}
          />
          <p className="field-help" id="task-title-help">
            Required · Up to {TASK_TITLE_MAX_LENGTH} characters
          </p>

          <div className="task-form-fields">
            <div>
              <span className="field-label" id="task-course-label">
                Course
              </span>
              <ThemedSelect
                describedBy={
                  formErrorField === "course" ? "task-form-error" : undefined
                }
                invalid={formErrorField === "course"}
                labelId="task-course-label"
                onChange={setCourseId}
                options={courses.map((course) => ({
                  label: course.name,
                  value: course.id,
                }))}
                ref={courseSelectRef}
                value={courseId}
              />
            </div>
            <label>
              <span className="field-label">Estimated Pomodoros</span>
              <input
                aria-describedby={`task-estimate-help${
                  formErrorField === "estimate" ? " task-form-error" : ""
                }`}
                aria-invalid={formErrorField === "estimate"}
                className="text-input"
                inputMode="numeric"
                max={TASK_ESTIMATE_MAX}
                min={TASK_ESTIMATE_MIN}
                onChange={(event) => setEstimate(event.target.value)}
                ref={estimateInputRef}
                step="1"
                type="number"
                value={estimate}
              />
              <span className="field-help" id="task-estimate-help">
                Estimated Focus sessions only
              </span>
            </label>
          </div>

          <p
            className={`form-message task-form-message${
              formError ? " form-message--error" : ""
            }`}
            id="task-form-error"
            role={formError ? "alert" : undefined}
          >
            {formError ||
              "This estimate stays unchanged when timer sessions finish."}
          </p>

          <div className="modal-actions">
            <button className="button button--secondary" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="button button--primary" type="submit">
              {task ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TaskDeleteConfirmation({ onCancel, onConfirm, task }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, cancelButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="task-delete-description"
        aria-labelledby="task-delete-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
        tabIndex="-1"
      >
        <div className="delete-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="task-delete-title">Delete this task?</h2>
        <p className="modal-copy" id="task-delete-description">
          “{task.title}” will be removed from this task list. This action can’t be
          undone.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Keep task
          </button>
          <button className="button button--danger" onClick={onConfirm} type="button">
            Delete task
          </button>
        </div>
      </section>
    </div>
  );
}

function DeleteCompletedTasksConfirmation({ count, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, cancelButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="completed-tasks-delete-description"
        aria-labelledby="completed-tasks-delete-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
        tabIndex="-1"
      >
        <div className="delete-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="completed-tasks-delete-title">
          Delete {count} completed {count === 1 ? "task" : "tasks"}?
        </h2>
        <p className="modal-copy" id="completed-tasks-delete-description">
          This removes only completed tasks from the task list. Their saved
          Focus history, statistics, and earned XP will remain.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Keep tasks
          </button>
          <button className="button button--danger" onClick={onConfirm} type="button">
            Delete completed
          </button>
        </div>
      </section>
    </div>
  );
}

function FocusCompletionSummary({
  onClose,
  onCompleteTask,
  summary,
}) {
  const continueButtonRef = useRef(null);
  const dialogRef = useModalDialog(onClose, continueButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-describedby="focus-summary-description"
        aria-labelledby="focus-summary-title"
        aria-modal="true"
        className="modal modal--small focus-summary-modal"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="focus-summary-symbol" aria-hidden="true">
          ✓
        </div>
        <p className="section-kicker">Focus complete</p>
        <h2 id="focus-summary-title">Beautiful work. You finished the session.</h2>
        <p className="modal-copy" id="focus-summary-description">
          Your focused time is safely recorded in History.
        </p>

        <dl className="focus-xp-breakdown">
          <div>
            <dt>{summary.durationMinutes} focused minutes</dt>
            <dd>+{formatVisibleXp(summary.focusXp)} XP</dd>
          </div>
          <div>
            <dt>Session completion bonus</dt>
            <dd>+{formatVisibleXp(summary.focusBonusXp)} XP</dd>
          </div>
          {summary.taskBonusXp > 0 && (
            <div>
              <dt>Task completion bonus</dt>
              <dd>+{formatVisibleXp(summary.taskBonusXp)} XP</dd>
            </div>
          )}
          <div className="focus-xp-total">
            <dt>Total gained this session</dt>
            <dd>{formatVisibleXp(summary.totalXp)} XP</dd>
          </div>
        </dl>

        {summary.taskReachedEstimate && !summary.taskCompleted && (
          <div className="focus-summary-task">
            <strong>“{summary.taskTitle}” reached its estimate.</strong>
            <p>
              Task completion stays your choice. Mark it complete now to include
              its one-time bonus in this session total.
            </p>
            <button
              className="button button--primary"
              onClick={() => onCompleteTask(summary.taskId)}
              type="button"
            >
              Mark task complete
            </button>
          </div>
        )}

        {summary.taskCompleted && (
          <p className="focus-summary-task-complete">
            “{summary.taskTitle}” was marked complete
            {summary.taskBonusXp > 0
              ? " and its one-time bonus was included."
              : ". Its one-time bonus had already been awarded."}
          </p>
        )}

        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onClose}
            ref={continueButtonRef}
            type="button"
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}

function RewardNotice({ notice, onClose, onPauseChange }) {
  if (!notice) {
    return null;
  }

  return (
    <aside
      aria-atomic="true"
      aria-live="polite"
      className="reward-notice"
      onBlur={() => onPauseChange(false)}
      onFocus={() => onPauseChange(true)}
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
      role="status"
    >
      <div className="reward-notice-mark" aria-hidden="true">
        {notice.levelUp ? "↑" : "★"}
      </div>
      <div>
        <p>{notice.levelUp ? "Level up" : "Achievement earned"}</p>
        <strong>{notice.title}</strong>
        <span>{notice.message}</span>
      </div>
      <button aria-label="Dismiss reward message" onClick={onClose} type="button">
        ×
      </button>
    </aside>
  );
}

function TaskCompletionNotice({ notice, onClose, onDelete }) {
  if (!notice) {
    return null;
  }

  return (
    <aside
      aria-atomic="true"
      aria-live="polite"
      className="task-completion-notice"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      role="status"
    >
      <div>
        <p>Task complete</p>
        <strong>Nice work on “{notice.task.title}”.</strong>
        <span>
          {notice.bonusXp
            ? `You earned ${notice.bonusXp} bonus XP.`
            : "This task’s one-time XP bonus was already awarded."}
        </span>
      </div>
      <div className="task-completion-notice-actions">
        <button className="text-button" onClick={onClose} type="button">
          Keep task
        </button>
        <button className="text-button text-button--danger" onClick={onDelete} type="button">
          Delete task
        </button>
      </div>
    </aside>
  );
}

function CourseDeleteBlocked({ course, linkedTaskCount, onClose, onViewTasks }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useModalDialog(onClose, closeButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-describedby="course-delete-blocked-description"
        aria-labelledby="course-delete-blocked-title"
        aria-modal="true"
        className="modal modal--small"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
        tabIndex="-1"
      >
        <div className="blocked-symbol" aria-hidden="true">
          ↗
        </div>
        <h2 id="course-delete-blocked-title">This course is still in use</h2>
        <p className="modal-copy" id="course-delete-blocked-description">
          {course.name} has {linkedTaskCount} linked{" "}
          {linkedTaskCount === 1 ? "task" : "tasks"}. Move those tasks to another
          course or delete them before deleting this course.
        </p>
        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Keep course
          </button>
          <button className="button button--primary" onClick={onViewTasks} type="button">
            View tasks
          </button>
        </div>
      </section>
    </div>
  );
}

function TasksView({
  activeTaskId,
  courses,
  onAdd,
  onDelete,
  onDeleteAllCompleted,
  onEdit,
  onNavigate,
  onSetActiveTask,
  onToggleComplete,
  removingTaskIds,
  tasks,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const taskCounts = getTaskCounts(tasks);
  const filteredTasks = filterTasks(tasks, statusFilter, courseFilter);
  const filtersAreActive = statusFilter !== "all" || courseFilter !== "all";

  function clearFilters() {
    setStatusFilter("all");
    setCourseFilter("all");
  }

  if (courses.length === 0) {
    return (
      <section className="page-content tasks-view" aria-labelledby="tasks-title">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="status-dot" />
              Task manager
            </div>
            <h1 id="tasks-title">Your tasks</h1>
            <p className="page-copy">
              Plan focused work and keep every task connected to a course.
            </p>
          </div>
        </div>
        <section className="empty-state tasks-empty-state">
          <div className="empty-task-mark" aria-hidden="true">
            ✓
          </div>
          <h2>Create a course first</h2>
          <p>
            Every StudyForge task needs a course. Add a course, then return here
            to plan your first task.
          </p>
          <button
            className="button button--primary"
            onClick={() => onNavigate("courses")}
            type="button"
          >
            Go to Courses
          </button>
        </section>
      </section>
    );
  }

  return (
    <section className="page-content tasks-view" aria-labelledby="tasks-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Task manager
          </div>
          <h1 id="tasks-title">Your tasks</h1>
          <p className="page-copy">
            Plan focused work, estimate the effort, and keep each task tied to a
            course.
          </p>
        </div>
        <button className="button button--primary add-button" onClick={onAdd}>
          <PlusIcon />
          Add task
        </button>
      </div>

      <div className="task-counts" aria-label="Task totals">
        <article>
          <span>Total</span>
          <strong>{taskCounts.total}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{taskCounts.active}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{taskCounts.completed}</strong>
        </article>
      </div>

      {tasks.length === 0 ? (
        <section className="empty-state tasks-empty-state">
          <div className="empty-task-mark" aria-hidden="true">
            ✓
          </div>
          <h2>No tasks yet</h2>
          <p>
            Add one clear piece of work, link it to a course, and estimate how
            many Focus sessions it may take.
          </p>
          <button className="button button--primary" onClick={onAdd} type="button">
            <PlusIcon />
            Add your first task
          </button>
        </section>
      ) : (
        <>
          <section className="task-filters" aria-label="Task filters">
            <div className="status-filter" aria-label="Filter by status">
              {[
                { id: "all", label: "All tasks" },
                { id: "active", label: "Active" },
                { id: "completed", label: "Completed" },
              ].map((filter) => (
                <button
                  aria-pressed={statusFilter === filter.id}
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="task-filter-actions">
              <div className="course-filter">
                <ThemedSelect
                  label="Filter by course"
                  onChange={setCourseFilter}
                  options={[
                    { label: "All courses", value: "all" },
                    ...courses.map((course) => ({
                      label: course.name,
                      value: course.id,
                    })),
                  ]}
                  value={courseFilter}
                />
              </div>
              {statusFilter === "completed" && taskCounts.completed > 0 && (
                <button
                  className="button button--danger completed-task-cleanup"
                  onClick={onDeleteAllCompleted}
                  type="button"
                >
                  Delete all completed
                </button>
              )}
            </div>
          </section>

          {filteredTasks.length === 0 ? (
            <section className="filter-empty-state">
              <h2>No tasks match these filters</h2>
              <p>Try another status or course, or return to the full task list.</p>
              {filtersAreActive && (
                <button
                  className="button button--secondary"
                  onClick={clearFilters}
                  type="button"
                >
                  Clear filters
                </button>
              )}
            </section>
          ) : (
            <ul className="task-list">
              {filteredTasks.map((task) => {
                const course = courses.find(
                  (candidate) => candidate.id === task.courseId,
                );

                if (!course) {
                  return null;
                }

                return (
                  <li
                    className={`task-card${
                      task.isCompleted ? " task-card--completed" : ""
                    }${task.id === activeTaskId ? " task-card--current" : ""}${
                      removingTaskIds.includes(task.id)
                        ? " task-card--removing"
                        : ""
                    }`}
                    key={task.id}
                    style={{ "--course-color": course.color }}
                  >
                    <button
                      aria-label={
                        task.isCompleted
                          ? `Reopen ${task.title}`
                          : `Mark ${task.title} as completed`
                      }
                      className="task-status-button"
                      onClick={() => onToggleComplete(task.id)}
                      type="button"
                    >
                      <span aria-hidden="true">{task.isCompleted ? "✓" : ""}</span>
                    </button>
                    <div className="task-card-content">
                      <div className="task-card-heading">
                        <h2>{task.title}</h2>
                        <span
                          className={`task-status${
                            task.isCompleted ? " task-status--completed" : ""
                          }`}
                        >
                          {task.isCompleted
                            ? "Completed"
                            : task.id === activeTaskId
                              ? "Current task"
                              : "Active"}
                        </span>
                      </div>
                      <div className="task-meta">
                        <span className="task-course">
                          <i aria-hidden="true" />
                          {course.name}
                        </span>
                        <span>
                          {task.completedPomodoros ?? 0} /{" "}
                          {task.estimatedPomodoros} Pomodoros completed
                        </span>
                      </div>
                    </div>
                    <div className="task-actions">
                      {!task.isCompleted && (
                        <button
                          aria-label={
                            task.id === activeTaskId
                              ? `Clear ${task.title} as current task`
                              : `Set ${task.title} as current task`
                          }
                          className="text-button"
                          onClick={() =>
                            onSetActiveTask(
                              task.id === activeTaskId ? null : task.id,
                            )
                          }
                          type="button"
                        >
                          {task.id === activeTaskId ? "Clear current" : "Set current"}
                        </button>
                      )}
                      <button
                        aria-label={`Edit ${task.title}`}
                        className="text-button"
                        onClick={() => onEdit(task)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${task.title}`}
                        className="text-button text-button--danger"
                        onClick={() => onDelete(task)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <p className="memory-note">
        Tasks and their Pomodoro progress are saved on this device.
      </p>
    </section>
  );
}

function ProfileView({
  courses,
  onSave,
  profile,
  rewards,
  sessionHistory,
  tasks,
  timerSettings,
}) {
  const statistics = getSessionStatistics(sessionHistory, courses);
  const levelProgress = getLevelProgress(rewards.totalXp);
  const currentStreak = getActiveStreakCount(rewards.streak);
  const taskCounts = getTaskCounts(tasks);
  const earnedAchievementCount = rewards.achievements.length;

  return (
    <section className="page-content profile-view" aria-labelledby="profile-page-title">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Student profile
          </div>
          <h1 id="profile-page-title">Your StudyForge journey</h1>
          <p className="page-copy">
            Your academic identity, focused work, and current study rhythm in one
            place.
          </p>
        </div>
      </div>
      <ProfilePanel profile={profile} onSave={onSave} />

      <section
        className="profile-snapshot"
        aria-labelledby="profile-snapshot-title"
      >
        <div className="profile-section-heading">
          <div>
            <p className="section-kicker">Personal study snapshot</p>
            <h2 id="profile-snapshot-title">The progress behind your profile</h2>
          </div>
          <p>
            These totals come from naturally completed Focus sessions and the
            work already saved on this device.
          </p>
        </div>

        <div className="profile-stat-grid">
          <article className="profile-stat-card profile-stat-card--level">
            <span>Current level</span>
            <strong>{levelProgress.level}</strong>
            <p>
              {formatVisibleXp(levelProgress.xpIntoLevel)} of{" "}
              {levelProgress.xpForNextLevel} XP
            </p>
            <div
              aria-label={`${Math.round(
                levelProgress.progressPercent,
              )}% toward Level ${levelProgress.level + 1}`}
              aria-valuemax={levelProgress.xpForNextLevel}
              aria-valuemin="0"
              aria-valuenow={formatVisibleXp(levelProgress.xpIntoLevel)}
              className="profile-stat-progress"
              role="progressbar"
            >
              <i
                style={{
                  "--profile-level-progress": `${levelProgress.progressPercent}%`,
                }}
              />
            </div>
          </article>

          <article className="profile-stat-card">
            <span>Current streak</span>
            <strong>{currentStreak}</strong>
            <p>{currentStreak === 1 ? "study day" : "study days"}</p>
          </article>

          <article className="profile-stat-card">
            <span>Focused work</span>
            <strong>{formatStudyMinutes(statistics.totalMinutes)}</strong>
            <p>
              {statistics.totalSessions}{" "}
              {statistics.totalSessions === 1 ? "session" : "sessions"}
            </p>
          </article>

          <article className="profile-stat-card">
            <span>Course library</span>
            <strong>{courses.length}</strong>
            <p>{courses.length === 1 ? "saved course" : "saved courses"}</p>
          </article>

          <article className="profile-stat-card">
            <span>Task progress</span>
            <strong>{taskCounts.completed}</strong>
            <p>
              {taskCounts.completed === 1 ? "completed task" : "completed tasks"} ·{" "}
              {taskCounts.active} active
            </p>
          </article>

          <article className="profile-stat-card profile-stat-card--achievement">
            <span>Achievements</span>
            <strong>{earnedAchievementCount}</strong>
            <p>
              of {ACHIEVEMENTS.length} earned
            </p>
          </article>
        </div>
      </section>

      <section
        className="profile-rhythm"
        aria-labelledby="profile-rhythm-title"
      >
        <div>
          <p className="section-kicker">Current timer rhythm</p>
          <h2 id="profile-rhythm-title">The pace you have saved</h2>
          <p>
            These preferences shape new timers. Active and paused countdowns
            still remain memory-only.
          </p>
        </div>
        <dl>
          <div>
            <dt>Focus</dt>
            <dd>{timerSettings.focusMinutes} min</dd>
          </div>
          <div>
            <dt>Short Break</dt>
            <dd>{timerSettings.shortBreakMinutes} min</dd>
          </div>
          <div>
            <dt>Long Break</dt>
            <dd>{timerSettings.longBreakMinutes} min</dd>
          </div>
          <div>
            <dt>Long Break after</dt>
            <dd>
              {timerSettings.focusSessionsPerCycle}{" "}
              {timerSettings.focusSessionsPerCycle === 1
                ? "Focus"
                : "Focus intervals"}
            </dd>
          </div>
        </dl>
      </section>
    </section>
  );
}

function TimerSettings({
  onRestoreDefaults,
  onSaveDurations,
  onToggleAutoStart,
  onToggleSound,
  settings,
}) {
  const [draftSettings, setDraftSettings] = useState({
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
    focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
  });
  const [settingsError, setSettingsError] = useState("");
  const [settingsErrorField, setSettingsErrorField] = useState(null);
  const durationInputRefs = useRef({});
  const cycleInputRef = useRef(null);

  useEffect(() => {
    setDraftSettings({
      focusMinutes: String(settings.focusMinutes),
      shortBreakMinutes: String(settings.shortBreakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
      focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
    });
    setSettingsError("");
    setSettingsErrorField(null);
  }, [
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
    settings.focusSessionsPerCycle,
  ]);

  function updateDraftSetting(key, value) {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const durationKeys = ["focusMinutes", "shortBreakMinutes", "longBreakMinutes"];
    const invalidDurationKey = durationKeys.find((key) => {
      const value = draftSettings[key];
      return !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 180;
    });
    const cycleValue = draftSettings.focusSessionsPerCycle;
    const cycleIsValid =
      /^\d+$/.test(cycleValue) && Number(cycleValue) >= 1 && Number(cycleValue) <= 99;

    if (invalidDurationKey) {
      setSettingsError("Enter each duration as a whole number from 1 to 180 minutes.");
      setSettingsErrorField("durations");
      durationInputRefs.current[invalidDurationKey]?.focus();
      return;
    }

    if (!cycleIsValid) {
      setSettingsError("Enter a Focus sessions value from 1 to 99.");
      setSettingsErrorField("cycle");
      cycleInputRef.current?.focus();
      return;
    }

    setSettingsError("");
    setSettingsErrorField(null);
    onSaveDurations({
      focusMinutes: Number(draftSettings.focusMinutes),
      shortBreakMinutes: Number(draftSettings.shortBreakMinutes),
      longBreakMinutes: Number(draftSettings.longBreakMinutes),
      focusSessionsPerCycle: Number(draftSettings.focusSessionsPerCycle),
    });
  }

  return (
    <section className="timer-settings" aria-labelledby="timer-settings-title">
      <div className="timer-settings-heading">
        <div>
          <p className="section-kicker">Preferences</p>
          <h2 id="timer-settings-title">Timer settings</h2>
        </div>
        <button
          className="text-button"
          onClick={onRestoreDefaults}
          type="button"
        >
          Restore defaults
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="timer-duration-fields">
          {[
            { key: "focusMinutes", label: "Focus" },
            { key: "shortBreakMinutes", label: "Short Break" },
            { key: "longBreakMinutes", label: "Long Break" },
          ].map((field) => (
            <label key={field.key}>
              <span className="field-label">{field.label}</span>
              <span className="number-input-wrap">
                <input
                  aria-describedby={settingsError ? "timer-settings-error" : undefined}
                  aria-invalid={settingsErrorField === "durations"}
                  className="text-input timer-number-input"
                  inputMode="numeric"
                max="180"
                min="1"
                onChange={(event) => updateDraftSetting(field.key, event.target.value)}
                ref={(element) => {
                  durationInputRefs.current[field.key] = element;
                }}
                step="1"
                  type="number"
                  value={draftSettings[field.key]}
                />
                <span>min</span>
              </span>
            </label>
          ))}
          <label>
            <span className="field-label">Focus sessions per cycle</span>
            <span className="number-input-wrap">
              <input
                aria-describedby={settingsError ? "timer-settings-error" : undefined}
                aria-invalid={settingsErrorField === "cycle"}
                className="text-input timer-number-input"
                inputMode="numeric"
                max="99"
                min="1"
                onChange={(event) =>
                  updateDraftSetting("focusSessionsPerCycle", event.target.value)
                }
                ref={cycleInputRef}
                step="1"
                type="number"
                value={draftSettings.focusSessionsPerCycle}
              />
              <span>sessions</span>
            </span>
          </label>
        </div>

        <div className="timer-settings-actions">
          <p
            className={`form-message${settingsError ? " form-message--error" : ""}`}
            id="timer-settings-error"
            role={settingsError ? "alert" : undefined}
          >
            {settingsError || "Changes reset the current timer without completing it."}
          </p>
          <button className="button button--secondary" type="submit">
            Apply settings
          </button>
        </div>
      </form>

      <div className="timer-toggles">
        <label className="toggle-row">
          <span>
            <strong>Auto-start next timer</strong>
            <small>Begin the next Focus or Break timer automatically.</small>
          </span>
          <input
            checked={settings.autoStart}
            onChange={(event) => onToggleAutoStart(event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-control" aria-hidden="true" />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Timer sounds</strong>
            <small>Play distinct sounds when a timer starts and finishes.</small>
          </span>
          <input
            checked={settings.soundEnabled}
            onChange={(event) => onToggleSound(event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-control" aria-hidden="true" />
        </label>
      </div>
    </section>
  );
}

function TimerView({
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
  onOpenPopout,
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
  const timerPanelRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const fullscreenIsAvailable =
    typeof document !== "undefined" &&
    document.fullscreenEnabled &&
    typeof Element !== "undefined" &&
    typeof Element.prototype.requestFullscreen === "function";

  useEffect(() => {
    function handleFullscreenChange() {
      const timerIsFullscreen =
        document.fullscreenElement === timerPanelRef.current;

      setIsFullscreen(timerIsFullscreen);
      setFullscreenMessage(
        timerIsFullscreen
          ? "Timer entered full screen. Press Escape to exit."
          : "",
      );
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleTimerFullscreen() {
    const timerPanel = timerPanelRef.current;

    if (!timerPanel || !fullscreenIsAvailable) {
      setFullscreenMessage("Full screen is not available in this browser.");
      return;
    }

    try {
      if (document.fullscreenElement === timerPanel) {
        await document.exitFullscreen();
      } else {
        await timerPanel.requestFullscreen();
      }
    } catch {
      setFullscreenMessage(
        "The timer could not enter full screen. Try the control again.",
      );
    }
  }

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
        aria-label={`${activeMode.label} timer`}
        ref={timerPanelRef}
      >
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
          onOpenPopout={onOpenPopout}
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

export default function App() {
  const [initialState] = useState(() => loadAppState());
  const [courses, setCourses] = useState(initialState.courses);
  const [profile, setProfile] = useState(initialState.profile);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [activeTaskId, setActiveTaskId] = useState(initialState.activeTaskId);
  const [sessionHistory, setSessionHistory] = useState(
    initialState.sessionHistory,
  );
  const [rewards, setRewards] = useState(initialState.rewards);
  const [activeView, setActiveView] = useState(initialState.activeView);
  const [timerModeId, setTimerModeId] = useState(TIMER_MODES[0].id);
  const [timerSettings, setTimerSettings] = useState(
    initialState.timerSettings,
  );
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => getTimerDurationSeconds(TIMER_MODES[0].id, timerSettings),
  );
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(
    () => getTimerDurationSeconds(TIMER_MODES[0].id, timerSettings),
  );
  const [timerStatus, setTimerStatus] = useState("idle");
  const [completedFocusSessions, setCompletedFocusSessions] = useState(
    initialState.completedFocusSessions,
  );
  const [focusCycleTarget, setFocusCycleTarget] = useState(
    timerSettings.focusSessionsPerCycle,
  );
  const [completionMessage, setCompletionMessage] = useState("");
  const [focusCompletionSummary, setFocusCompletionSummary] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [courseDeleteBlocked, setCourseDeleteBlocked] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteCompletedCount, setDeleteCompletedCount] = useState(0);
  const [removingTaskIds, setRemovingTaskIds] = useState([]);
  const [rewardNotice, setRewardNotice] = useState(null);
  const [rewardNoticePaused, setRewardNoticePaused] = useState(false);
  const [taskCompletionNotice, setTaskCompletionNotice] = useState(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState(
    initialState.recoveryMessage ?? "",
  );
  const [appStatusMessage, setAppStatusMessage] = useState(
    initialState.recoveryMessage ?? "",
  );
  const [timerPopoutRoot, setTimerPopoutRoot] = useState(null);
  const timerEndTimeRef = useRef(null);
  const timerTotalSecondsRef = useRef(
    getTimerDurationSeconds(TIMER_MODES[0].id, timerSettings),
  );
  const focusCycleTargetRef = useRef(timerSettings.focusSessionsPerCycle);
  const timerTaskOverrideRef = useRef(null);
  const completionHandledRef = useRef(false);
  const activeTaskIdRef = useRef(initialState.activeTaskId);
  const coursesRef = useRef(initialState.courses);
  const tasksRef = useRef(initialState.tasks);
  const sessionHistoryRef = useRef(initialState.sessionHistory);
  const rewardsRef = useRef(initialState.rewards);
  const audioContextRef = useRef(null);
  const timerPopoutWindowRef = useRef(null);
  const primaryNavRef = useRef(null);
  const activeNavButtonRef = useRef(null);

  coursesRef.current = courses;
  tasksRef.current = tasks;
  sessionHistoryRef.current = sessionHistory;
  rewardsRef.current = rewards;
  timerTotalSecondsRef.current = timerTotalSeconds;
  focusCycleTargetRef.current = focusCycleTarget;

  useLayoutEffect(() => {
    const navigation = primaryNavRef.current;
    const activeButton = activeNavButtonRef.current;

    if (!navigation || !activeButton) {
      return undefined;
    }

    function positionNavigationIndicator() {
      navigation.style.setProperty(
        "--nav-indicator-left",
        `${activeButton.offsetLeft}px`,
      );
      navigation.style.setProperty(
        "--nav-indicator-width",
        `${activeButton.offsetWidth}px`,
      );
      navigation.style.setProperty("--nav-indicator-opacity", "1");
    }

    positionNavigationIndicator();

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(positionNavigationIndicator)
        : null;

    resizeObserver?.observe(navigation);
    resizeObserver?.observe(activeButton);
    window.addEventListener("resize", positionNavigationIndicator);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", positionNavigationIndicator);
    };
  }, [activeView]);

  useEffect(() => {
    saveAppState({
      profile,
      courses,
      tasks,
      timerSettings,
      completedFocusSessions,
      activeTaskId,
      sessionHistory,
      rewards,
      activeView,
    });
  }, [
    activeTaskId,
    activeView,
    completedFocusSessions,
    courses,
    profile,
    rewards,
    sessionHistory,
    tasks,
    timerSettings,
  ]);

  useEffect(() => {
    if (
      activeTaskId &&
      !tasks.some(
        (task) => task.id === activeTaskId && !task.isCompleted,
      )
    ) {
      activeTaskIdRef.current = null;
      setActiveTaskId(null);
    }
  }, [activeTaskId, tasks]);

  useEffect(() => {
    if (timerStatus !== "running") {
      return undefined;
    }

    function updateRemainingTime() {
      if (timerEndTimeRef.current === null) {
        return;
      }

      const millisecondsLeft = Math.max(0, timerEndTimeRef.current - Date.now());
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
  }, [completedFocusSessions, timerModeId, timerSettings, timerStatus]);

  useEffect(
    () => () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
      timerPopoutWindowRef.current?.close();
      timerPopoutWindowRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!rewardNotice || rewardNoticePaused) {
      return undefined;
    }

    const noticeTimeout = window.setTimeout(() => setRewardNotice(null), 8000);
    return () => window.clearTimeout(noticeTimeout);
  }, [rewardNotice, rewardNoticePaused]);

  function closeTimerPopout() {
    const popupWindow = timerPopoutWindowRef.current;

    timerPopoutWindowRef.current = null;
    setTimerPopoutRoot(null);

    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }
  }

  async function openTimerPopout() {
    const existingPopup = timerPopoutWindowRef.current;

    if (existingPopup && !existingPopup.closed) {
      existingPopup.focus();
      setAppStatusMessage("The floating timer is already open.");
      return;
    }

    let popupWindow;
    let isPictureInPicture = false;

    if ("documentPictureInPicture" in window) {
      try {
        popupWindow = await window.documentPictureInPicture.requestWindow({
          height: 580,
          width: 390,
        });
        isPictureInPicture = true;
      } catch {
        setAppStatusMessage(
          "The floating timer was not opened. Try the Float control again.",
        );
        return;
      }
    } else {
      popupWindow = window.open(
        "",
        "studyforge-timer-popout",
        "popup=yes,width=410,height=620",
      );
    }

    if (!popupWindow) {
      setAppStatusMessage(
        "The floating timer could not open. Allow popups for StudyForge and try again.",
      );
      return;
    }

    const popupDocument = popupWindow.document;

    popupDocument.documentElement.lang = "en";
    popupDocument.head.replaceChildren();
    popupDocument.body.replaceChildren();
    popupDocument.title = "StudyForge floating timer";

    const viewportMeta = popupDocument.createElement("meta");
    viewportMeta.name = "viewport";
    viewportMeta.content = "width=device-width, initial-scale=1";
    popupDocument.head.append(viewportMeta);

    document
      .querySelectorAll('link[rel="stylesheet"], style')
      .forEach((stylesheet) => {
        const clonedStylesheet = stylesheet.cloneNode(true);

        if (stylesheet.tagName === "LINK") {
          clonedStylesheet.href = stylesheet.href;
        }

        popupDocument.head.append(clonedStylesheet);
      });

    popupDocument.body.className = "timer-popout-body";
    const popupRoot = popupDocument.createElement("div");
    popupRoot.id = "timer-popout-root";
    popupDocument.body.append(popupRoot);

    popupWindow.addEventListener(
      "pagehide",
      () => {
        if (timerPopoutWindowRef.current === popupWindow) {
          timerPopoutWindowRef.current = null;
          setTimerPopoutRoot(null);
        }
      },
      { once: true },
    );

    timerPopoutWindowRef.current = popupWindow;
    setTimerPopoutRoot(popupRoot);
    popupWindow.focus();
    setAppStatusMessage(
      isPictureInPicture
        ? "The timer is now floating above your other windows."
        : "The timer opened in a compact window.",
    );
  }

  function openAddForm() {
    setEditingCourse(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCourse(null);
  }

  function saveCourse(courseDetails) {
    if (editingCourse) {
      setCourses((currentCourses) =>
        currentCourses.map((course) =>
          course.id === editingCourse.id ? { ...course, ...courseDetails } : course,
        ),
      );
      setAppStatusMessage(`${courseDetails.name} was updated.`);
    } else {
      setCourses((currentCourses) => [
        ...currentCourses,
        { id: createCourseId(), ...courseDetails },
      ]);
      setAppStatusMessage(`${courseDetails.name} was added.`);
    }

    closeForm();
  }

  function editCourse(course) {
    setEditingCourse(course);
    setIsFormOpen(true);
  }

  function prepareCourseDeletion(course) {
    const linkedTaskCount = countTasksForCourse(tasks, course.id);

    if (linkedTaskCount > 0) {
      setCourseDeleteBlocked({ course, linkedTaskCount });
      return;
    }

    setCourseToDelete(course);
  }

  function deleteCourse() {
    const deletedCourseName = courseToDelete.name;
    const linkedTaskCount = countTasksForCourse(tasks, courseToDelete.id);

    if (linkedTaskCount > 0) {
      setCourseDeleteBlocked({ course: courseToDelete, linkedTaskCount });
      setCourseToDelete(null);
      return;
    }

    setCourses((currentCourses) =>
      currentCourses.filter((course) => course.id !== courseToDelete.id),
    );
    setCourseToDelete(null);
    setAppStatusMessage(`${deletedCourseName} was deleted.`);
  }

  function openAddTaskForm() {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }

  function closeTaskForm() {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  }

  function saveTask(taskDetails) {
    if (!courses.some((course) => course.id === taskDetails.courseId)) {
      return;
    }

    if (editingTask) {
      setTasks((currentTasks) =>
        saveTaskInList(
          currentTasks,
          taskDetails,
          editingTask.id,
          createTaskId,
        ),
      );
      setAppStatusMessage(`${taskDetails.title} was updated.`);
    } else {
      setTasks((currentTasks) =>
        saveTaskInList(currentTasks, taskDetails, null, createTaskId),
      );
      setAppStatusMessage(`${taskDetails.title} was added.`);
    }

    closeTaskForm();
  }

  function editTask(task) {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }

  function selectActiveTask(taskId) {
    if (taskId === null) {
      activeTaskIdRef.current = null;
      setActiveTaskId(null);
      setAppStatusMessage("The current study task was cleared.");
      return;
    }

    const taskCanBeSelected = tasks.some(
      (task) => task.id === taskId && !task.isCompleted,
    );
    const nextTaskId = taskCanBeSelected ? taskId : null;

    activeTaskIdRef.current = nextTaskId;
    setActiveTaskId(nextTaskId);

    const selectedTask = tasks.find((task) => task.id === nextTaskId);
    setAppStatusMessage(
      selectedTask
        ? `${selectedTask.title} is now the current study task.`
        : "The current study task was cleared.",
    );
  }

  function completeTask(taskId, source = "default") {
    const task = tasksRef.current.find(
      (candidate) => candidate.id === taskId && !candidate.isCompleted,
    );

    if (!task) {
      return;
    }

    const awardedAt = Date.now();
    const rewardResult = awardTaskCompletion(
      rewardsRef.current,
      task,
      awardedAt,
    );
    const nextTasks = toggleTaskInList(tasksRef.current, taskId);

    rewardsRef.current = rewardResult.rewards;
    tasksRef.current = nextTasks;
    setRewards(rewardResult.rewards);
    setTasks(nextTasks);

    if (activeTaskIdRef.current === taskId) {
      selectActiveTask(null);
    }

    if (source === "focus-summary") {
      setFocusCompletionSummary((currentSummary) =>
        currentSummary?.taskId === taskId
          ? {
              ...currentSummary,
              taskBonusXp: rewardResult.bonusXp,
              taskCompleted: true,
              totalXp: currentSummary.totalXp + rewardResult.bonusXp,
            }
          : currentSummary,
      );
    } else {
      setTaskCompletionNotice({
        bonusXp: rewardResult.bonusXp,
        task: { ...task, isCompleted: true },
      });
    }
    setAppStatusMessage(`${task.title} was marked complete.`);

    if (rewardResult.nextLevel > rewardResult.previousLevel) {
      setRewardNotice({
        levelUp: true,
        message: `Your task bonus moved you to Level ${rewardResult.nextLevel}.`,
        title: `Level ${rewardResult.nextLevel}`,
      });
    }
  }

  function toggleTaskComplete(taskId) {
    const task = tasksRef.current.find((candidate) => candidate.id === taskId);

    if (!task) {
      return;
    }

    if (!task.isCompleted) {
      completeTask(taskId);
      return;
    }

    const nextTasks = toggleTaskInList(tasksRef.current, taskId);
    tasksRef.current = nextTasks;
    setTasks(nextTasks);
    setAppStatusMessage(`${task.title} was reopened.`);

    if (taskCompletionNotice?.task.id === taskId) {
      setTaskCompletionNotice(null);
    }
  }

  function deleteTask() {
    if (!taskToDelete) {
      return;
    }

    const deletedTaskTitle = taskToDelete.title;
    const deletedTaskId = taskToDelete.id;

    if (activeTaskIdRef.current === taskToDelete.id) {
      selectActiveTask(null);
    }

    if (taskCompletionNotice?.task.id === taskToDelete.id) {
      setTaskCompletionNotice(null);
    }

    setTaskToDelete(null);
    setRemovingTaskIds((currentIds) => [...currentIds, deletedTaskId]);

    const removalDelay = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 190;

    window.setTimeout(() => {
      const nextTasks = deleteTaskFromList(tasksRef.current, deletedTaskId);
      tasksRef.current = nextTasks;
      setTasks(nextTasks);
      setRemovingTaskIds((currentIds) =>
        currentIds.filter((taskId) => taskId !== deletedTaskId),
      );
      setAppStatusMessage(`${deletedTaskTitle} was deleted.`);
    }, removalDelay);
  }

  function prepareCompletedTaskDeletion() {
    if (!taskCompletionNotice) {
      return;
    }

    setTaskToDelete(taskCompletionNotice.task);
    setTaskCompletionNotice(null);
  }

  function deleteAllCompletedTasks() {
    const completedTaskIds = tasksRef.current
      .filter((task) => task.isCompleted)
      .map((task) => task.id);
    const completedTaskCount = completedTaskIds.length;

    setDeleteCompletedCount(0);
    setTaskCompletionNotice(null);
    setRemovingTaskIds((currentIds) => [
      ...new Set([...currentIds, ...completedTaskIds]),
    ]);

    const removalDelay = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 190;

    window.setTimeout(() => {
      const nextTasks = tasksRef.current.filter((task) => !task.isCompleted);
      tasksRef.current = nextTasks;
      setTasks(nextTasks);
      setRemovingTaskIds((currentIds) =>
        currentIds.filter((taskId) => !completedTaskIds.includes(taskId)),
      );
      setAppStatusMessage(
        `${completedTaskCount} completed ${
          completedTaskCount === 1 ? "task was" : "tasks were"
        } deleted. Saved History and rewards were kept.`,
      );
    }, removalDelay);
  }

  function saveProfile(nextProfile) {
    setProfile(nextProfile);
    setAppStatusMessage("Your profile was saved.");
  }

  function viewBlockedCourseTasks() {
    setCourseDeleteBlocked(null);
    setActiveView("tasks");
  }

  function prepareTimerSounds(force = false) {
    if ((!timerSettings.soundEnabled && !force) || audioContextRef.current) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    audioContextRef.current = new AudioContext();
    audioContextRef.current.resume().catch(() => {
      // The timer and in-app feedback remain usable if audio is blocked.
    });
  }

  function createSoundBus(audioContext) {
    const compressor = audioContext.createDynamicsCompressor();

    compressor.threshold.setValueAtTime(-14, audioContext.currentTime);
    compressor.knee.setValueAtTime(8, audioContext.currentTime);
    compressor.ratio.setValueAtTime(4, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.3, audioContext.currentTime);
    compressor.connect(audioContext.destination);

    return compressor;
  }

  function playTone({
    audioContext,
    destination,
    duration,
    frequency,
    peakVolume,
    startTime,
    type = "sine",
  }) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  function playCompletionSound() {
    const audioContext = audioContextRef.current;

    if (!timerSettings.soundEnabled || !audioContext) {
      return;
    }

    try {
      const startTime = audioContext.currentTime;
      const bellBus = createSoundBus(audioContext);

      [
        { frequency: 659.25, peakVolume: 0.38, duration: 2.2 },
        { frequency: 1325.1, peakVolume: 0.18, duration: 1.75 },
        { frequency: 1964.6, peakVolume: 0.1, duration: 1.35 },
        { frequency: 2768.9, peakVolume: 0.06, duration: 0.9 },
      ].forEach((partial) => {
        playTone({
          audioContext,
          destination: bellBus,
          startTime,
          ...partial,
        });
      });
    } catch {
      // The visible completion message is the fallback when audio cannot play.
    }
  }

  function playStartSound() {
    const audioContext = audioContextRef.current;

    if (!timerSettings.soundEnabled || !audioContext) {
      return;
    }

    try {
      const startTime = audioContext.currentTime;
      const startBus = createSoundBus(audioContext);

      playTone({
        audioContext,
        destination: startBus,
        duration: 0.72,
        frequency: 392,
        peakVolume: 0.28,
        startTime,
        type: "triangle",
      });
      playTone({
        audioContext,
        destination: startBus,
        duration: 0.88,
        frequency: 587.33,
        peakVolume: 0.32,
        startTime: startTime + 0.2,
        type: "triangle",
      });
    } catch {
      // Starting the timer still works if audio cannot play.
    }
  }

  function finishTimer(completedAt = Date.now()) {
    if (completionHandledRef.current) {
      return;
    }

    completionHandledRef.current = true;
    timerEndTimeRef.current = null;

    const completedMode = getTimerMode(timerModeId);
    let nextModeId = "focus";

    if (timerModeId === "focus") {
      const durationMinutes = timerTotalSecondsRef.current / 60;
      const focusBonusXp = durationMinutes / 10;
      const selectedTaskId =
        timerTaskOverrideRef.current === "unassigned"
          ? null
          : activeTaskIdRef.current;
      const selectedTask =
        tasksRef.current.find(
          (task) => task.id === selectedTaskId && !task.isCompleted,
        ) ?? null;
      const selectedCourse =
        coursesRef.current.find(
          (course) => course.id === selectedTask?.courseId,
        ) ?? null;

      let updatedTask = null;

      if (selectedTask) {
        const nextTasks = incrementTaskPomodoroInList(
          tasksRef.current,
          selectedTask.id,
        );
        updatedTask = nextTasks.find(
          (task) => task.id === selectedTask.id,
        );

        tasksRef.current = nextTasks;
        setTasks(nextTasks);
      }

      const completedSession = createFocusSessionRecord({
        completedAt,
        course: selectedCourse,
        createId: createSessionId,
        durationMinutes,
        focusBonusXp,
        task: selectedTask,
      });
      const nextHistory = [...sessionHistoryRef.current, completedSession];
      const rewardResult = awardFocusCompletion(
        rewardsRef.current,
        nextHistory,
        completedAt,
      );

      sessionHistoryRef.current = nextHistory;
      rewardsRef.current = rewardResult.rewards;
      setSessionHistory(nextHistory);
      setRewards(rewardResult.rewards);

      if (
        rewardResult.nextLevel > rewardResult.previousLevel ||
        rewardResult.newAchievements.length > 0
      ) {
        const achievementNames = rewardResult.newAchievements
          .map((achievement) => getAchievementDetails(achievement.id)?.title)
          .filter(Boolean);
        const levelUp = rewardResult.nextLevel > rewardResult.previousLevel;

        setRewardNotice({
          levelUp,
          message: levelUp
            ? achievementNames.length
              ? `You also earned ${achievementNames.join(", ")}.`
              : `${formatVisibleXp(
                  rewardResult.rewards.totalXp,
                )} total XP earned so far.`
            : achievementNames.join(", "),
          title: levelUp
            ? `Level ${rewardResult.nextLevel}`
            : achievementNames.length === 1
              ? achievementNames[0]
              : `${achievementNames.length} achievements`,
        });
      }

      setFocusCompletionSummary({
        durationMinutes,
        focusBonusXp,
        focusXp: durationMinutes,
        taskBonusXp: 0,
        taskCompleted: false,
        taskId: updatedTask?.id ?? null,
        taskReachedEstimate: Boolean(
          updatedTask &&
            updatedTask.completedPomodoros === updatedTask.estimatedPomodoros,
        ),
        taskTitle: updatedTask?.title ?? null,
        totalXp: durationMinutes + focusBonusXp,
      });

      const nextFocusCount = completedFocusSessions + 1;
      const cycleIsComplete =
        nextFocusCount >= focusCycleTargetRef.current;

      nextModeId = cycleIsComplete ? "long-break" : "short-break";
      setCompletedFocusSessions(cycleIsComplete ? 0 : nextFocusCount);

      if (cycleIsComplete) {
        focusCycleTargetRef.current = timerSettings.focusSessionsPerCycle;
        setFocusCycleTarget(timerSettings.focusSessionsPerCycle);
      }

      timerTaskOverrideRef.current = null;
    }

    const nextMode = getTimerMode(nextModeId);
    const nextDurationSeconds = getTimerDurationSeconds(
      nextModeId,
      timerSettings,
    );
    const nextAction = timerSettings.autoStart
      ? `${nextMode.label} started automatically.`
      : `${nextMode.label} is ready.`;

    playCompletionSound();
    setCompletionMessage(
      timerModeId === "focus"
        ? `${completedMode.label} complete. +${formatVisibleXp(
            timerTotalSecondsRef.current / 60 +
              timerTotalSecondsRef.current / 600,
          )} XP. ${nextAction}`
        : `${completedMode.label} complete. ${nextAction}`,
    );
    setTimerModeId(nextModeId);
    setRemainingSeconds(nextDurationSeconds);
    timerTotalSecondsRef.current = nextDurationSeconds;
    setTimerTotalSeconds(nextDurationSeconds);

    if (timerSettings.autoStart) {
      completionHandledRef.current = false;
      timerEndTimeRef.current = completedAt + nextDurationSeconds * 1000;
      setTimerStatus("running");
    } else {
      setTimerStatus("idle");
    }
  }

  function startTimer() {
    if (remainingSeconds === 0) {
      return;
    }

    prepareTimerSounds();
    playStartSound();

    if (timerStatus !== "paused") {
      timerTaskOverrideRef.current = null;
    }

    completionHandledRef.current = false;
    timerEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setCompletionMessage("");
    setTimerStatus("running");
  }

  function pauseTimer() {
    if (timerEndTimeRef.current === null) {
      return;
    }

    const millisecondsLeft = Math.max(0, timerEndTimeRef.current - Date.now());
    const nextRemainingSeconds = Math.ceil(millisecondsLeft / 1000);

    if (nextRemainingSeconds === 0) {
      finishTimer(timerEndTimeRef.current);
      return;
    }

    timerEndTimeRef.current = null;
    setRemainingSeconds(nextRemainingSeconds);
    setTimerStatus("paused");
  }

  function resetTimer() {
    const resetDurationSeconds = getTimerDurationSeconds(
      timerModeId,
      timerSettings,
    );

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    timerTaskOverrideRef.current = null;
    timerTotalSecondsRef.current = resetDurationSeconds;
    setRemainingSeconds(resetDurationSeconds);
    setTimerTotalSeconds(resetDurationSeconds);
    setCompletionMessage("");
    setTimerStatus("idle");
  }

  function changeTimerMode(nextModeId) {
    const nextMode = getTimerMode(nextModeId);
    const nextDurationSeconds = getTimerDurationSeconds(
      nextMode.id,
      timerSettings,
    );

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    timerTaskOverrideRef.current = null;
    setTimerModeId(nextMode.id);
    timerTotalSecondsRef.current = nextDurationSeconds;
    setRemainingSeconds(nextDurationSeconds);
    setTimerTotalSeconds(nextDurationSeconds);
    setCompletionMessage("");
    setTimerStatus("idle");
  }

  function addMinuteToTimer() {
    const maximumDurationSeconds = 180 * 60;
    const secondsToAdd = Math.min(
      60,
      maximumDurationSeconds - timerTotalSecondsRef.current,
    );

    if (secondsToAdd <= 0) {
      setAppStatusMessage("This timer is already at the 180-minute limit.");
      return;
    }

    timerTotalSecondsRef.current += secondsToAdd;
    setTimerTotalSeconds(timerTotalSecondsRef.current);
    setRemainingSeconds((currentSeconds) => currentSeconds + secondsToAdd);

    if (timerEndTimeRef.current !== null) {
      timerEndTimeRef.current += secondsToAdd * 1000;
    }

    setAppStatusMessage("One minute was added to the current timer.");
  }

  function addFocusIntervalToCycle() {
    const nextTarget = Math.min(99, focusCycleTargetRef.current + 1);

    if (nextTarget === focusCycleTargetRef.current) {
      setAppStatusMessage("This Focus cycle is already at the 99-session limit.");
      return;
    }

    focusCycleTargetRef.current = nextTarget;
    setFocusCycleTarget(nextTarget);
    setAppStatusMessage(
      `This cycle now contains ${nextTarget} Focus intervals.`,
    );
  }

  function startDashboardQuickFocus() {
    const quickFocusSeconds = DEFAULT_TIMER_SETTINGS.focusMinutes * 60;

    prepareTimerSounds();
    playStartSound();
    completionHandledRef.current = false;
    timerTaskOverrideRef.current = "unassigned";
    timerTotalSecondsRef.current = quickFocusSeconds;
    timerEndTimeRef.current = Date.now() + quickFocusSeconds * 1000;
    setTimerModeId("focus");
    setTimerTotalSeconds(quickFocusSeconds);
    setRemainingSeconds(quickFocusSeconds);
    setCompletionMessage("");
    setTimerStatus("running");
    setAppStatusMessage(
      "A 25-minute Quick Focus session started without an active task.",
    );
  }

  function saveTimerDurations(nextValues) {
    const nextSettings = { ...timerSettings, ...nextValues };

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setTimerSettings(nextSettings);
    focusCycleTargetRef.current = nextSettings.focusSessionsPerCycle;
    setFocusCycleTarget(nextSettings.focusSessionsPerCycle);
    setCompletedFocusSessions((currentCount) =>
      Math.min(currentCount, nextSettings.focusSessionsPerCycle - 1),
    );
    const nextDurationSeconds = getTimerDurationSeconds(
      timerModeId,
      nextSettings,
    );
    timerTaskOverrideRef.current = null;
    timerTotalSecondsRef.current = nextDurationSeconds;
    setRemainingSeconds(nextDurationSeconds);
    setTimerTotalSeconds(nextDurationSeconds);
    setCompletionMessage("Timer settings applied.");
    setTimerStatus("idle");
  }

  function restoreTimerDefaults() {
    const defaultSettings = { ...DEFAULT_TIMER_SETTINGS };

    timerEndTimeRef.current = null;
    completionHandledRef.current = false;
    setTimerSettings(defaultSettings);
    focusCycleTargetRef.current = defaultSettings.focusSessionsPerCycle;
    setFocusCycleTarget(defaultSettings.focusSessionsPerCycle);
    setCompletedFocusSessions((currentCount) =>
      Math.min(currentCount, defaultSettings.focusSessionsPerCycle - 1),
    );
    const nextDurationSeconds = getTimerDurationSeconds(
      timerModeId,
      defaultSettings,
    );
    timerTaskOverrideRef.current = null;
    timerTotalSecondsRef.current = nextDurationSeconds;
    setRemainingSeconds(nextDurationSeconds);
    setTimerTotalSeconds(nextDurationSeconds);
    setCompletionMessage("Default timer settings restored.");
    setTimerStatus("idle");
  }

  function toggleAutoStart(isEnabled) {
    setTimerSettings((currentSettings) => ({
      ...currentSettings,
      autoStart: isEnabled,
    }));
  }

  function toggleCompletionSound(isEnabled) {
    if (isEnabled) {
      prepareTimerSounds(true);
    }

    setTimerSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled: isEnabled,
    }));
  }

  const activeTask =
    tasks.find(
      (task) => task.id === activeTaskId && !task.isCompleted,
    ) ?? null;
  const activeTaskCourse =
    courses.find((course) => course.id === activeTask?.courseId) ?? null;

  return (
    <div className="app-shell">
      <div className="ambient-glow ambient-glow--top" />
      <div className="ambient-glow ambient-glow--bottom" />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <button
          className="brand"
          onClick={() => setActiveView("dashboard")}
          type="button"
        >
          <BrandMark />
          <span>StudyForge</span>
        </button>
        <nav
          className="primary-nav"
          aria-label="Main navigation"
          ref={primaryNavRef}
        >
          {NAV_ITEMS.map((item) => (
            <button
              aria-current={activeView === item.id ? "page" : undefined}
              className="nav-button"
              key={item.id}
              onClick={() => setActiveView(item.id)}
              ref={activeView === item.id ? activeNavButtonRef : null}
              type="button"
            >
              <NavIcon id={item.id} />
              {item.label}
            </button>
          ))}
        </nav>
        <MiniLevelProgress rewards={rewards} />
      </header>

      {recoveryNotice && (
        <aside className="storage-recovery-notice" role="status">
          <span>{recoveryNotice}</span>
          <button
            aria-label="Dismiss saved-data message"
            onClick={() => setRecoveryNotice("")}
            type="button"
          >
            ×
          </button>
        </aside>
      )}

      <main className="main-content" id="main-content" tabIndex="-1">
        {activeView === "dashboard" && (
          <DashboardView
            activeTask={activeTask}
            completedFocusSessions={completedFocusSessions}
            courses={courses}
            focusCycleTarget={focusCycleTarget}
            onChangeTimerMode={changeTimerMode}
            onNavigate={setActiveView}
            onPauseTimer={pauseTimer}
            onQuickFocus={startDashboardQuickFocus}
            onResetTimer={resetTimer}
            onStartTimer={startTimer}
            profile={profile}
            rewards={rewards}
            sessionHistory={sessionHistory}
            tasks={tasks}
            timerModeId={timerModeId}
            timerRemainingSeconds={remainingSeconds}
            timerSettings={timerSettings}
            timerStatus={timerStatus}
            timerTotalSeconds={timerTotalSeconds}
          />
        )}
        {activeView === "courses" && (
          <CoursesView
            courses={courses}
            onAdd={openAddForm}
            onDelete={prepareCourseDeletion}
            onEdit={editCourse}
          />
        )}
        {activeView === "tasks" && (
          <TasksView
            activeTaskId={activeTaskId}
            courses={courses}
            onAdd={openAddTaskForm}
            onDelete={setTaskToDelete}
            onDeleteAllCompleted={() =>
              setDeleteCompletedCount(
                tasks.filter((task) => task.isCompleted).length,
              )
            }
            onEdit={editTask}
            onNavigate={setActiveView}
            onSetActiveTask={selectActiveTask}
            onToggleComplete={toggleTaskComplete}
            removingTaskIds={removingTaskIds}
            tasks={tasks}
          />
        )}
        {activeView === "profile" && (
          <ProfileView
            courses={courses}
            onSave={saveProfile}
            profile={profile}
            rewards={rewards}
            sessionHistory={sessionHistory}
            tasks={tasks}
            timerSettings={timerSettings}
          />
        )}
        {activeView === "history" && (
          <HistoryView courses={courses} sessionHistory={sessionHistory} />
        )}
        {activeView === "timer" && (
          <TimerView
            activeTask={activeTask}
            activeTaskCourse={activeTaskCourse}
            activeTaskId={activeTaskId}
            completedFocusSessions={completedFocusSessions}
            completionMessage={completionMessage}
            courses={courses}
            focusCycleTarget={focusCycleTarget}
            modeId={timerModeId}
            onAddFocusInterval={addFocusIntervalToCycle}
            onAddMinute={addMinuteToTimer}
            onCompleteTask={completeTask}
            onModeChange={changeTimerMode}
            onNavigate={setActiveView}
            onOpenPopout={openTimerPopout}
            onPause={pauseTimer}
            onReset={resetTimer}
            onRestoreDefaults={restoreTimerDefaults}
            onSaveDurations={saveTimerDurations}
            onStart={startTimer}
            onSetActiveTask={selectActiveTask}
            onToggleAutoStart={toggleAutoStart}
            onToggleSound={toggleCompletionSound}
            remainingSeconds={remainingSeconds}
            settings={timerSettings}
            status={timerStatus}
            tasks={tasks}
            totalSeconds={timerTotalSeconds}
          />
        )}
      </main>

      <footer>
        <span>Designed for calm, deliberate progress.</span>
        <span>StudyForge v0.11.5</span>
      </footer>

      <div
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {appStatusMessage}
      </div>

      <RewardNotice
        notice={rewardNotice}
        onClose={() => setRewardNotice(null)}
        onPauseChange={setRewardNoticePaused}
      />
      <TaskCompletionNotice
        notice={taskCompletionNotice}
        onClose={() => setTaskCompletionNotice(null)}
        onDelete={prepareCompletedTaskDeletion}
      />

      {isFormOpen && (
        <CourseForm course={editingCourse} onCancel={closeForm} onSave={saveCourse} />
      )}
      {courseToDelete && (
        <DeleteConfirmation
          course={courseToDelete}
          onCancel={() => setCourseToDelete(null)}
          onConfirm={deleteCourse}
        />
      )}
      {courseDeleteBlocked && (
        <CourseDeleteBlocked
          course={courseDeleteBlocked.course}
          linkedTaskCount={courseDeleteBlocked.linkedTaskCount}
          onClose={() => setCourseDeleteBlocked(null)}
          onViewTasks={viewBlockedCourseTasks}
        />
      )}
      {isTaskFormOpen && (
        <TaskForm
          courses={courses}
          onCancel={closeTaskForm}
          onSave={saveTask}
          task={editingTask}
        />
      )}
      {taskToDelete && (
        <TaskDeleteConfirmation
          onCancel={() => setTaskToDelete(null)}
          onConfirm={deleteTask}
          task={taskToDelete}
        />
      )}
      {deleteCompletedCount > 0 && (
        <DeleteCompletedTasksConfirmation
          count={deleteCompletedCount}
          onCancel={() => setDeleteCompletedCount(0)}
          onConfirm={deleteAllCompletedTasks}
        />
      )}
      {focusCompletionSummary && (
        <FocusCompletionSummary
          onClose={() => setFocusCompletionSummary(null)}
          onCompleteTask={(taskId) => completeTask(taskId, "focus-summary")}
          summary={focusCompletionSummary}
        />
      )}
      {timerPopoutRoot &&
        createPortal(
          <TimerPopout
            activeTask={activeTask}
            modeId={timerModeId}
            onClose={closeTimerPopout}
            onModeChange={changeTimerMode}
            onPause={pauseTimer}
            onReset={resetTimer}
            onStart={startTimer}
            remainingSeconds={remainingSeconds}
            status={timerStatus}
            totalSeconds={timerTotalSeconds}
          />,
          timerPopoutRoot,
        )}
    </div>
  );
}
