function startOfLocalDay(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date, numberOfDays) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + numberOfDays);
}

function getLocalDayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getCurrentWeekStart(now) {
  const today = startOfLocalDay(now);
  const daysSinceMonday = (today.getDay() + 6) % 7;
  return addLocalDays(today, -daysSinceMonday);
}

export function createFocusSessionRecord({
  completedAt,
  course,
  createId,
  durationMinutes,
  focusBonusXp = 0,
  task,
}) {
  const session = {
    id: createId(),
    completedAt: new Date(completedAt).toISOString(),
    durationMinutes,
    focusBonusXp,
  };

  if (!task) {
    return session;
  }

  session.taskId = task.id;
  session.taskTitle = task.title;

  if (course) {
    session.courseId = course.id;
    session.courseName = course.name;
    session.courseColor = course.color;
  }

  return session;
}

export function getSessionStatistics(sessionHistory, courses, now = Date.now()) {
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = addLocalDays(todayStart, 1);
  const weekStart = getCurrentWeekStart(now);
  const nextWeekStart = addLocalDays(weekStart, 7);
  const sevenDayStart = addLocalDays(todayStart, -6);
  const courseLookup = new Map(courses.map((course) => [course.id, course]));
  const sevenDayTrend = Array.from({ length: 7 }, (_, index) => {
    const dayStart = addLocalDays(sevenDayStart, index);

    return {
      date: dayStart,
      key: getLocalDayKey(dayStart),
      minutes: 0,
      sessions: 0,
    };
  });
  const trendLookup = new Map(
    sevenDayTrend.map((trendDay) => [trendDay.key, trendDay]),
  );
  const courseTotals = new Map();
  let todaySessions = 0;
  let todayMinutes = 0;
  let weekSessions = 0;
  let weekMinutes = 0;

  sessionHistory.forEach((session) => {
    const completedAt = new Date(session.completedAt);
    const timestamp = completedAt.getTime();

    if (timestamp >= todayStart.getTime() && timestamp < tomorrowStart.getTime()) {
      todaySessions += 1;
      todayMinutes += session.durationMinutes;
    }

    if (timestamp >= weekStart.getTime() && timestamp < nextWeekStart.getTime()) {
      weekSessions += 1;
      weekMinutes += session.durationMinutes;
    }

    if (timestamp >= sevenDayStart.getTime() && timestamp < tomorrowStart.getTime()) {
      const trendDay = trendLookup.get(getLocalDayKey(completedAt));

      if (trendDay) {
        trendDay.sessions += 1;
        trendDay.minutes += session.durationMinutes;
      }
    }

    const groupKey = session.courseId ?? "unassigned";
    const currentCourse = session.courseId
      ? courseLookup.get(session.courseId)
      : undefined;
    const existingTotal = courseTotals.get(groupKey);

    courseTotals.set(groupKey, {
      color:
        currentCourse?.color ??
        session.courseColor ??
        "rgba(150, 155, 171, 0.7)",
      courseId: session.courseId ?? null,
      minutes: (existingTotal?.minutes ?? 0) + session.durationMinutes,
      name:
        currentCourse?.name ??
        session.courseName ??
        "No course selected",
      sessions: (existingTotal?.sessions ?? 0) + 1,
    });
  });

  const courseTimeBreakdown = [...courseTotals.values()].sort(
    (first, second) =>
      second.minutes - first.minutes || first.name.localeCompare(second.name),
  );
  const totalMinutes = sessionHistory.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );

  return {
    courseTimeBreakdown,
    sevenDayTrend,
    todayMinutes,
    todaySessions,
    totalMinutes,
    totalSessions: sessionHistory.length,
    weekMinutes,
    weekSessions,
  };
}
