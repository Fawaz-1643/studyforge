import { awardFocusCompletion } from "./rewards.js";
import { createFocusSessionRecord } from "./statistics.js";
import { incrementTaskPomodoroInList } from "./tasks.js";
import {
  getFocusCompletionBonus,
  isCreditedFocusOutcome,
} from "./timer.js";

export function applyFocusSessionOutcome({
  activeTaskId,
  completedAt,
  courses,
  createSessionId,
  durationMinutes,
  forceUnassigned = false,
  modeId,
  outcome,
  rewards,
  sessionHistory,
  tasks,
}) {
  if (!isCreditedFocusOutcome({ modeId, outcome })) {
    return null;
  }

  const selectedTaskId = forceUnassigned ? null : activeTaskId;
  const selectedTask =
    tasks.find(
      (task) => task.id === selectedTaskId && !task.isCompleted,
    ) ?? null;
  const selectedCourse =
    courses.find((course) => course.id === selectedTask?.courseId) ?? null;
  const nextTasks = selectedTask
    ? incrementTaskPomodoroInList(tasks, selectedTask.id)
    : tasks;
  const updatedTask = selectedTask
    ? nextTasks.find((task) => task.id === selectedTask.id) ?? null
    : null;
  const focusBonusXp = getFocusCompletionBonus(durationMinutes);
  const completedSession = createFocusSessionRecord({
    completedAt,
    course: selectedCourse,
    createId: createSessionId,
    durationMinutes,
    focusBonusXp,
    task: selectedTask,
  });
  const nextHistory = [...sessionHistory, completedSession];
  const rewardResult = awardFocusCompletion(
    rewards,
    nextHistory,
    completedAt,
  );

  return {
    completedSession,
    nextHistory,
    nextRewards: rewardResult.rewards,
    nextTasks,
    rewardResult,
    summary: {
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
    },
    updatedTask,
  };
}
