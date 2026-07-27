import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  countTasksForCourse,
  deleteTaskFromList,
  saveTaskInList,
  toggleTaskInList,
} from "../domain/tasks.js";
import {
  loadAppState,
  saveAppState,
} from "../storage/appStorage.js";
import {
  awardTaskCompletion,
  getAchievementDetails,
} from "../domain/rewards.js";
import {
  SESSION_OUTCOMES,
} from "../domain/timer.js";
import { formatVisibleXp } from "../domain/formatters.js";
import {
  createCourseId,
  createSessionId,
  createTaskId,
} from "../domain/ids.js";
import { applyFocusSessionOutcome } from "../domain/focusCompletion.js";
import { CoursesView } from "../features/courses/CoursesView.jsx";
import { ProfileView } from "../features/profile/ProfileView.jsx";
import { DashboardView } from "../features/dashboard/DashboardView.jsx";
import { HistoryView } from "../features/history/HistoryView.jsx";
import { TasksView } from "../features/tasks/TasksView.jsx";
import { TimerView } from "../features/timer/TimerView.jsx";
import { useTimerEngine } from "../features/timer/useTimerEngine.js";
import { AppOverlays } from "./AppOverlays.jsx";
import { AppShell } from "./AppShell.jsx";

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
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [isResetCycleConfirmationOpen, setIsResetCycleConfirmationOpen] =
    useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState(
    initialState.recoveryMessage ?? "",
  );
  const [appStatusMessage, setAppStatusMessage] = useState(
    initialState.recoveryMessage ?? "",
  );
  const activeTaskIdRef = useRef(initialState.activeTaskId);
  const coursesRef = useRef(initialState.courses);
  const tasksRef = useRef(initialState.tasks);
  const sessionHistoryRef = useRef(initialState.sessionHistory);
  const rewardsRef = useRef(initialState.rewards);

  coursesRef.current = courses;
  tasksRef.current = tasks;
  sessionHistoryRef.current = sessionHistory;
  rewardsRef.current = rewards;
  const {
    addFocusInterval: addFocusIntervalToCycle,
    addMinute: addMinuteToTimer,
    changeMode: changeTimerMode,
    completedFocusSessions,
    completionMessage,
    focusCycleTarget,
    modeId: timerModeId,
    nextSession: moveToNextSession,
    pause: pauseTimer,
    remainingSeconds,
    requestCycleReset,
    resetCycle: performFocusCycleReset,
    restoreDefaults: restoreTimerDefaults,
    saveDurations: saveTimerDurations,
    settings: timerSettings,
    start: startTimer,
    startQuickFocus: startDashboardQuickFocus,
    status: timerStatus,
    toggleAutoStart,
    toggleSound: toggleCompletionSound,
    totalSeconds: timerTotalSeconds,
  } = useTimerEngine({
    initialCompletedFocusSessions: initialState.completedFocusSessions,
    initialSettings: initialState.timerSettings,
    onNaturalFocusComplete: handleNaturalFocusComplete,
    onStatusMessage: setAppStatusMessage,
  });

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
    if (!rewardNotice || rewardNoticePaused) {
      return undefined;
    }

    const noticeTimeout = window.setTimeout(() => setRewardNotice(null), 8000);
    return () => window.clearTimeout(noticeTimeout);
  }, [rewardNotice, rewardNoticePaused]);

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

  function navigateToView(nextView) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setActiveView(nextView);
  }

  function viewBlockedCourseTasks() {
    setCourseDeleteBlocked(null);
    navigateToView("tasks");
  }

  function handleNaturalFocusComplete({
    completedAt,
    durationMinutes,
    forceUnassigned,
  }) {
    const completion = applyFocusSessionOutcome({
      activeTaskId: activeTaskIdRef.current,
      completedAt,
      courses: coursesRef.current,
      createSessionId,
      durationMinutes,
      forceUnassigned,
      modeId: "focus",
      outcome: SESSION_OUTCOMES.NATURAL_COMPLETION,
      rewards: rewardsRef.current,
      sessionHistory: sessionHistoryRef.current,
      tasks: tasksRef.current,
    });

    tasksRef.current = completion.nextTasks;
    sessionHistoryRef.current = completion.nextHistory;
    rewardsRef.current = completion.nextRewards;
    setTasks(completion.nextTasks);
    setSessionHistory(completion.nextHistory);
    setRewards(completion.nextRewards);
    setFocusCompletionSummary(completion.summary);

    if (
      completion.rewardResult.nextLevel >
        completion.rewardResult.previousLevel ||
      completion.rewardResult.newAchievements.length > 0
    ) {
      const achievementNames = completion.rewardResult.newAchievements
        .map((achievement) => getAchievementDetails(achievement.id)?.title)
        .filter(Boolean);
      const levelUp =
        completion.rewardResult.nextLevel >
        completion.rewardResult.previousLevel;

      setRewardNotice({
        levelUp,
        message: levelUp
          ? achievementNames.length
            ? `You also earned ${achievementNames.join(", ")}.`
            : `${formatVisibleXp(
                completion.nextRewards.totalXp,
              )} total XP earned so far.`
          : achievementNames.join(", "),
        title: levelUp
          ? `Level ${completion.rewardResult.nextLevel}`
          : achievementNames.length === 1
            ? achievementNames[0]
            : `${achievementNames.length} achievements`,
      });
    }
  }

  function requestFocusCycleReset() {
    if (requestCycleReset()) {
      setIsResetCycleConfirmationOpen(true);
    }
  }

  function resetFocusCycle() {
    performFocusCycleReset();
    setIsResetCycleConfirmationOpen(false);
  }

  const activeTask =
    tasks.find(
      (task) => task.id === activeTaskId && !task.isCompleted,
    ) ?? null;
  const activeTaskCourse =
    courses.find((course) => course.id === activeTask?.courseId) ?? null;

  return (
    <AppShell
      activeView={activeView}
      onDismissRecovery={() => setRecoveryNotice("")}
      onNavigate={navigateToView}
      overlays={
        <AppOverlays
          courseDeleteBlocked={courseDeleteBlocked}
          courseToDelete={courseToDelete}
          courses={courses}
          deleteCompletedCount={deleteCompletedCount}
          editingCourse={editingCourse}
          editingTask={editingTask}
          focusCompletionSummary={focusCompletionSummary}
          isCourseFormOpen={isFormOpen}
          isProfileFormOpen={isProfileFormOpen}
          isResetCycleConfirmationOpen={isResetCycleConfirmationOpen}
          isTaskFormOpen={isTaskFormOpen}
          onCloseCourseForm={closeForm}
          onCloseProfileForm={() => setIsProfileFormOpen(false)}
          onCloseTaskForm={closeTaskForm}
          onCompleteFocusSummaryTask={(taskId) =>
            completeTask(taskId, "focus-summary")
          }
          onConfirmCourseDelete={deleteCourse}
          onConfirmDeleteAllCompleted={deleteAllCompletedTasks}
          onConfirmResetCycle={resetFocusCycle}
          onConfirmTaskDelete={deleteTask}
          onDismissCourseBlocked={() => setCourseDeleteBlocked(null)}
          onDismissCourseDelete={() => setCourseToDelete(null)}
          onDismissDeleteAllCompleted={() => setDeleteCompletedCount(0)}
          onDismissFocusSummary={() => setFocusCompletionSummary(null)}
          onDismissResetCycle={() =>
            setIsResetCycleConfirmationOpen(false)
          }
          onDismissRewardNotice={() => setRewardNotice(null)}
          onDismissTaskCompletion={() => setTaskCompletionNotice(null)}
          onDismissTaskDelete={() => setTaskToDelete(null)}
          onPauseRewardNotice={setRewardNoticePaused}
          onPrepareCompletedTaskDeletion={prepareCompletedTaskDeletion}
          onSaveCourse={saveCourse}
          onSaveProfile={(nextProfile) => {
            saveProfile(nextProfile);
            setIsProfileFormOpen(false);
          }}
          onSaveTask={saveTask}
          onViewBlockedCourseTasks={viewBlockedCourseTasks}
          profile={profile}
          rewardNotice={rewardNotice}
          taskCompletionNotice={taskCompletionNotice}
          taskToDelete={taskToDelete}
        />
      }
      recoveryNotice={recoveryNotice}
      rewards={rewards}
      statusMessage={appStatusMessage}
    >
        {activeView === "dashboard" && (
          <DashboardView
            activeTask={activeTask}
            completedFocusSessions={completedFocusSessions}
            courses={courses}
            focusCycleTarget={focusCycleTarget}
            onChangeTimerMode={changeTimerMode}
            onNavigate={navigateToView}
            onPauseTimer={pauseTimer}
            onQuickFocus={startDashboardQuickFocus}
            onResetTimer={requestFocusCycleReset}
            onStartTimer={startTimer}
            onEditProfile={() => setIsProfileFormOpen(true)}
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
            onNavigate={navigateToView}
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
            onNavigate={navigateToView}
            onNextSession={moveToNextSession}
            onPause={pauseTimer}
            onReset={requestFocusCycleReset}
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
    </AppShell>
  );
}
