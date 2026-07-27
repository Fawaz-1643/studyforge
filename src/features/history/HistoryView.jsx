import { ClockIcon } from "../../components/icons/AppIcons.jsx";
import { formatStudyMinutes } from "../../domain/formatters.js";
import { getSessionStatistics } from "../../domain/statistics.js";

export function HistoryView({ courses, sessionHistory }) {
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
