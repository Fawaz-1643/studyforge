export const LEVEL_BASE_XP = 100;
export const LEVEL_XP_INCREASE = 25;
export const TASK_COMPLETION_XP_MULTIPLIER = 5;

export const ACHIEVEMENTS = [
  {
    id: "first-focus",
    title: "First Focus",
    description: "Complete your first Focus session.",
    requirement: { type: "sessions", value: 1 },
  },
  {
    id: "five-focus",
    title: "Focused Five",
    description: "Complete five Focus sessions.",
    requirement: { type: "sessions", value: 5 },
  },
  {
    id: "streak-3",
    title: "Three-Day Rhythm",
    description: "Study on three consecutive local calendar days.",
    requirement: { type: "streak", value: 3 },
  },
  {
    id: "streak-7",
    title: "Seven-Day Rhythm",
    description: "Study on seven consecutive local calendar days.",
    requirement: { type: "streak", value: 7 },
  },
  {
    id: "streak-14",
    title: "Two-Week Rhythm",
    description: "Study on 14 consecutive local calendar days.",
    requirement: { type: "streak", value: 14 },
  },
  {
    id: "streak-30",
    title: "Thirty-Day Rhythm",
    description: "Study on 30 consecutive local calendar days.",
    requirement: { type: "streak", value: 30 },
  },
];

const ACHIEVEMENT_IDS = new Set(
  ACHIEVEMENTS.map((achievement) => achievement.id),
);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeId(value) {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

function localDateParts(value) {
  const date = new Date(value);

  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function localDateKey(value) {
  const { day, month, year } = localDateParts(value);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function localDayNumber(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function achievementIsSatisfied(achievement, sessionCount, longestStreak) {
  return achievement.requirement.type === "sessions"
    ? sessionCount >= achievement.requirement.value
    : longestStreak >= achievement.requirement.value;
}

function normalizeAchievementRecords(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set();

  return value.flatMap((achievement) => {
    const id = normalizeId(achievement?.id);
    const earnedAtTimestamp =
      typeof achievement?.earnedAt === "string"
        ? Date.parse(achievement.earnedAt)
        : Number.NaN;

    if (
      !ACHIEVEMENT_IDS.has(id) ||
      seenIds.has(id) ||
      !Number.isFinite(earnedAtTimestamp)
    ) {
      return [];
    }

    seenIds.add(id);
    return [{ id, earnedAt: new Date(earnedAtTimestamp).toISOString() }];
  });
}

function normalizeRewardedTaskIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set();

  return value.flatMap((valueId) => {
    const id = normalizeId(valueId);

    if (!id || seenIds.has(id)) {
      return [];
    }

    seenIds.add(id);
    return [id];
  });
}

function normalizeTaskBonuses(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set();

  return value.flatMap((bonus) => {
    if (!isRecord(bonus)) {
      return [];
    }

    const taskId = normalizeId(bonus.taskId);
    const awardedAtTimestamp =
      typeof bonus.awardedAt === "string"
        ? Date.parse(bonus.awardedAt)
        : Number.NaN;

    if (
      !taskId ||
      seenIds.has(taskId) ||
      !Number.isSafeInteger(bonus.xp) ||
      bonus.xp < TASK_COMPLETION_XP_MULTIPLIER ||
      bonus.xp >
        TASK_COMPLETION_XP_MULTIPLIER * 99 ||
      bonus.xp % TASK_COMPLETION_XP_MULTIPLIER !== 0 ||
      !Number.isFinite(awardedAtTimestamp)
    ) {
      return [];
    }

    seenIds.add(taskId);
    return [
      {
        taskId,
        xp: bonus.xp,
        awardedAt: new Date(awardedAtTimestamp).toISOString(),
      },
    ];
  });
}

export function calculateStudyStreak(sessionHistory) {
  const studyDates = [
    ...new Set(sessionHistory.map((session) => localDateKey(session.completedAt))),
  ].sort((first, second) => localDayNumber(first) - localDayNumber(second));

  if (studyDates.length === 0) {
    return { count: 0, lastStudyDate: null, longest: 0 };
  }

  let currentRun = 1;
  let longest = 1;

  for (let index = 1; index < studyDates.length; index += 1) {
    const dayDifference =
      localDayNumber(studyDates[index]) - localDayNumber(studyDates[index - 1]);

    currentRun = dayDifference === 1 ? currentRun + 1 : 1;
    longest = Math.max(longest, currentRun);
  }

  return {
    count: currentRun,
    lastStudyDate: studyDates.at(-1),
    longest,
  };
}

export function getActiveStreakCount(streak, now = Date.now()) {
  if (!streak.lastStudyDate || streak.count === 0) {
    return 0;
  }

  const todayKey = localDateKey(now);
  const daysSinceLastStudy =
    localDayNumber(todayKey) - localDayNumber(streak.lastStudyDate);

  return daysSinceLastStudy === 0 || daysSinceLastStudy === 1
    ? streak.count
    : 0;
}

export function getLevelProgress(totalXp) {
  let level = 1;
  let xpIntoLevel = totalXp;
  let xpForNextLevel = LEVEL_BASE_XP;

  while (xpIntoLevel >= xpForNextLevel) {
    xpIntoLevel -= xpForNextLevel;
    level += 1;
    xpForNextLevel =
      LEVEL_BASE_XP + (level - 1) * LEVEL_XP_INCREASE;
  }

  return {
    level,
    progressPercent: (xpIntoLevel / xpForNextLevel) * 100,
    xpForNextLevel,
    xpIntoLevel,
    xpRemaining: xpForNextLevel - xpIntoLevel,
  };
}

export function normalizeRewards(value, sessionHistory, tasks) {
  const storedRewards = isRecord(value) ? value : {};
  const rewardedTaskIds = normalizeRewardedTaskIds(
    storedRewards.rewardedTaskIds,
  );
  const rewardedIdSet = new Set(rewardedTaskIds);
  const taskBonuses = normalizeTaskBonuses(storedRewards.taskBonuses);

  taskBonuses.forEach((bonus) => {
    if (!rewardedIdSet.has(bonus.taskId)) {
      rewardedIdSet.add(bonus.taskId);
      rewardedTaskIds.push(bonus.taskId);
    }
  });

  tasks.forEach((task) => {
    if (task.isCompleted && !rewardedIdSet.has(task.id)) {
      rewardedIdSet.add(task.id);
      rewardedTaskIds.push(task.id);
    }
  });

  const focusXp = sessionHistory.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );
  const taskXp = taskBonuses.reduce((total, bonus) => total + bonus.xp, 0);
  const streak = calculateStudyStreak(sessionHistory);
  const normalizedAchievements = normalizeAchievementRecords(
    storedRewards.achievements,
  ).filter((achievementRecord) => {
    const achievement = ACHIEVEMENTS.find(
      (candidate) => candidate.id === achievementRecord.id,
    );

    return (
      achievement &&
      achievementIsSatisfied(
        achievement,
        sessionHistory.length,
        streak.longest,
      )
    );
  });
  const earnedIds = new Set(
    normalizedAchievements.map((achievement) => achievement.id),
  );
  const fallbackEarnedAt =
    sessionHistory.at(-1)?.completedAt ?? new Date(0).toISOString();

  ACHIEVEMENTS.forEach((achievement) => {
    if (
      !earnedIds.has(achievement.id) &&
      achievementIsSatisfied(
        achievement,
        sessionHistory.length,
        streak.longest,
      )
    ) {
      earnedIds.add(achievement.id);
      normalizedAchievements.push({
        id: achievement.id,
        earnedAt: fallbackEarnedAt,
      });
    }
  });

  return {
    achievements: normalizedAchievements,
    rewardedTaskIds,
    streak,
    taskBonuses,
    totalXp: focusXp + taskXp,
  };
}

export function awardFocusCompletion(rewards, sessionHistory, completedAt) {
  const previousLevel = getLevelProgress(rewards.totalXp).level;
  const normalizedRewards = normalizeRewards(rewards, sessionHistory, []);
  const previousAchievementIds = new Set(
    rewards.achievements.map((achievement) => achievement.id),
  );
  const newAchievements = normalizedRewards.achievements.filter(
    (achievement) => !previousAchievementIds.has(achievement.id),
  );
  const nextLevel = getLevelProgress(normalizedRewards.totalXp).level;

  return {
    newAchievements,
    nextLevel,
    previousLevel,
    rewards: {
      ...normalizedRewards,
      achievements: normalizedRewards.achievements.map((achievement) =>
        newAchievements.some((candidate) => candidate.id === achievement.id)
          ? { ...achievement, earnedAt: new Date(completedAt).toISOString() }
          : achievement,
      ),
    },
  };
}

export function awardTaskCompletion(rewards, task, awardedAt) {
  if (rewards.rewardedTaskIds.includes(task.id)) {
    return {
      bonusXp: 0,
      nextLevel: getLevelProgress(rewards.totalXp).level,
      previousLevel: getLevelProgress(rewards.totalXp).level,
      rewards,
    };
  }

  const bonusXp =
    task.estimatedPomodoros * TASK_COMPLETION_XP_MULTIPLIER;
  const previousLevel = getLevelProgress(rewards.totalXp).level;
  const nextRewards = {
    ...rewards,
    rewardedTaskIds: [...rewards.rewardedTaskIds, task.id],
    taskBonuses: [
      ...rewards.taskBonuses,
      {
        taskId: task.id,
        xp: bonusXp,
        awardedAt: new Date(awardedAt).toISOString(),
      },
    ],
    totalXp: rewards.totalXp + bonusXp,
  };

  return {
    bonusXp,
    nextLevel: getLevelProgress(nextRewards.totalXp).level,
    previousLevel,
    rewards: nextRewards,
  };
}

export function getAchievementDetails(id) {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id) ?? null;
}
