import { ACHIEVEMENTS, getActiveStreakCount, getLevelProgress } from "../../domain/rewards.js";
import { getSessionStatistics } from "../../domain/statistics.js";
import { getTaskCounts } from "../../domain/tasks.js";
import { formatStudyMinutes, formatVisibleXp } from "../../domain/formatters.js";
import { ProfilePanel } from "./ProfilePanel.jsx";

export function ProfileView({
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
          <h1 id="profile-page-title">Your journey</h1>
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
