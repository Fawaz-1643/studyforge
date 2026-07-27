import { useId, useState } from "react";
import { formatStudyMinutes, formatVisibleXp } from "../../domain/formatters.js";
import { ACHIEVEMENTS, getActiveStreakCount, getLevelProgress } from "../../domain/rewards.js";
import { getSessionStatistics } from "../../domain/statistics.js";
import { getTaskCounts } from "../../domain/tasks.js";
import { getTimerMode, TIMER_MODES } from "../../domain/timer.js";
import { DEFAULT_TIMER_SETTINGS } from "../../storage/appStorage.js";
import { TimerDial } from "../timer/TimerDial.jsx";
import { DashboardIdentityCard } from "./DashboardIdentityCard.jsx";

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
              Reset cycle
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

export function DashboardView({
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
  onEditProfile,
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
        <DashboardIdentityCard onEdit={onEditProfile} profile={profile} />
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
            answer="Pause if you expect to return, use Next session to skip without counting the interval, or reset the cycle when you want a completely fresh start. None of those actions earn Focus XP or create History records."
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
