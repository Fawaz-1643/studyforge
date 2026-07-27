import {
  CourseDeleteBlocked,
  DeleteConfirmation,
} from "../features/courses/CourseDialogs.jsx";
import { CourseForm } from "../features/courses/CourseFormDialog.jsx";
import { ProfileFormDialog } from "../features/profile/ProfileFormDialog.jsx";
import { FocusCompletionSummary } from "../features/rewards/FocusCompletionDialog.jsx";
import {
  RewardNotice,
  TaskCompletionNotice,
} from "../features/rewards/RewardFeedback.jsx";
import {
  DeleteCompletedTasksConfirmation,
  TaskDeleteConfirmation,
} from "../features/tasks/TaskDialogs.jsx";
import { TaskForm } from "../features/tasks/TaskFormDialog.jsx";
import { ResetCycleConfirmation } from "../features/timer/ResetCycleDialog.jsx";

export function AppOverlays({
  courseDeleteBlocked,
  courseToDelete,
  courses,
  deleteCompletedCount,
  editingCourse,
  editingTask,
  focusCompletionSummary,
  isCourseFormOpen,
  isProfileFormOpen,
  isResetCycleConfirmationOpen,
  isTaskFormOpen,
  onCloseCourseForm,
  onCloseProfileForm,
  onCloseTaskForm,
  onCompleteFocusSummaryTask,
  onConfirmCourseDelete,
  onConfirmDeleteAllCompleted,
  onConfirmResetCycle,
  onConfirmTaskDelete,
  onDismissCourseBlocked,
  onDismissCourseDelete,
  onDismissDeleteAllCompleted,
  onDismissFocusSummary,
  onDismissResetCycle,
  onDismissRewardNotice,
  onDismissTaskCompletion,
  onDismissTaskDelete,
  onPauseRewardNotice,
  onPrepareCompletedTaskDeletion,
  onSaveCourse,
  onSaveProfile,
  onSaveTask,
  onViewBlockedCourseTasks,
  profile,
  rewardNotice,
  taskCompletionNotice,
  taskToDelete,
}) {
  return (
    <>
      <RewardNotice
        notice={rewardNotice}
        onClose={onDismissRewardNotice}
        onPauseChange={onPauseRewardNotice}
      />
      <TaskCompletionNotice
        notice={taskCompletionNotice}
        onClose={onDismissTaskCompletion}
        onDelete={onPrepareCompletedTaskDeletion}
      />

      {isCourseFormOpen && (
        <CourseForm
          course={editingCourse}
          onCancel={onCloseCourseForm}
          onSave={onSaveCourse}
        />
      )}
      {courseToDelete && (
        <DeleteConfirmation
          course={courseToDelete}
          onCancel={onDismissCourseDelete}
          onConfirm={onConfirmCourseDelete}
        />
      )}
      {courseDeleteBlocked && (
        <CourseDeleteBlocked
          course={courseDeleteBlocked.course}
          linkedTaskCount={courseDeleteBlocked.linkedTaskCount}
          onClose={onDismissCourseBlocked}
          onViewTasks={onViewBlockedCourseTasks}
        />
      )}
      {isTaskFormOpen && (
        <TaskForm
          courses={courses}
          onCancel={onCloseTaskForm}
          onSave={onSaveTask}
          task={editingTask}
        />
      )}
      {isProfileFormOpen && (
        <ProfileFormDialog
          onCancel={onCloseProfileForm}
          onSave={onSaveProfile}
          profile={profile}
        />
      )}
      {taskToDelete && (
        <TaskDeleteConfirmation
          onCancel={onDismissTaskDelete}
          onConfirm={onConfirmTaskDelete}
          task={taskToDelete}
        />
      )}
      {deleteCompletedCount > 0 && (
        <DeleteCompletedTasksConfirmation
          count={deleteCompletedCount}
          onCancel={onDismissDeleteAllCompleted}
          onConfirm={onConfirmDeleteAllCompleted}
        />
      )}
      {isResetCycleConfirmationOpen && (
        <ResetCycleConfirmation
          onCancel={onDismissResetCycle}
          onConfirm={onConfirmResetCycle}
        />
      )}
      {focusCompletionSummary && (
        <FocusCompletionSummary
          onClose={onDismissFocusSummary}
          onCompleteTask={onCompleteFocusSummaryTask}
          summary={focusCompletionSummary}
        />
      )}
    </>
  );
}
