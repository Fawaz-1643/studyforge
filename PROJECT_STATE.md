# StudyForge Project State

## Current milestone

Milestones 1-9 are complete. Milestone 10, restrained gamification, is next.

## Technical foundation

- React 19 with Vite and JavaScript
- Responsive dark interface with a violet primary accent
- A single-page application with Dashboard, Courses, Tasks, Timer, and Profile
  views
- Browser `localStorage` for approved device-local persistence
- No login, backend, database, paid API, social feature, or university
  integration

## Completed work

### Milestone 1 - Foundation and visual system

- React/Vite project foundation
- Responsive dark shell, typography, design tokens, and reusable interface
  styles
- README and production-build commands

### Milestone 2 - Navigation, dashboard, and course library

- Navigation between the main application views
- Dashboard overview
- Create, edit, color-code, and delete courses
- Course deletion confirmation and useful empty states
- Course persistence in `localStorage`

### Milestone 3 - Student profile

- Optional university and field-of-study details
- Profile display and edit flow
- Profile persistence in `localStorage`

### Milestone 4 - Reliable focus timer

- Focus, Short Break, and Long Break modes
- Start, pause, resume, reset, and manual mode switching
- Timestamp-based countdown calculations using `Date.now()`
- Accurate remaining time after inactive or throttled browser tabs

### Milestone 5 - Timer settings and session rules

- Custom Focus, Short Break, and Long Break durations
- Configurable Focus sessions before a Long Break
- Automatic Focus-to-Break and Break-to-Focus cycles
- Optional auto-start for the next timer
- In-app completion feedback, a layered bell chime, and a distinct start/resume
  chime
- Timer settings persistence with validation and safe defaults
- Timer was made the default landing view at this milestone

### Milestone 6 - Course-linked task manager

- Dedicated Tasks navigation and task-management view
- Create and edit tasks with a required trimmed title, an existing course, and
  a whole-number Pomodoro estimate
- Complete, reopen, and delete tasks with clear status presentation and delete
  confirmation
- Combined status and course filters
- Total, active, and completed task counts
- Course names and colors shown on linked tasks
- Empty states for missing courses, missing tasks, and filters with no matches
- Course deletion protection while any linked tasks remain
- Task data remained memory-only at this milestone

### Milestone 7 - Active-task session workflow

- One current study task can be selected, changed, or cleared
- Completed tasks are excluded from active-task selection
- The timer shows the current task, linked course and color, and completed
  Pomodoros compared with its estimate
- Each naturally completed Focus session increments the selected task exactly
  once
- Break completions and manual timer actions do not increment task progress
- Auto-start cycles preserve the exactly-once Focus increment rule
- Completing or deleting the current task safely clears the selection
- Missing or deleted tasks cannot receive progress
- Task estimates remain unchanged and reaching an estimate does not complete a
  task automatically
- The dashboard shows current-task and overall task progress
- Task progress and current-task selection remained memory-only at this
  milestone

### Milestone 8 - Unified local persistence

- One centralized, versioned save/load layer for all durable application state
- Device-local persistence for profile, courses, tasks, task completion,
  completed task Pomodoros, timer settings, current-cycle Focus progress, and
  active-task selection
- Migration of valid profile, course, and timer-setting data from the
  Milestones 1-7 storage keys
- Field-level validation and safe defaults for profile and timer settings
- Individual validation of course and task records, including duplicate-record
  rejection
- Rejection of tasks whose linked course is missing
- Restoration of an active-task selection only when the task exists and is not
  completed
- Restoration of current-cycle progress only when it is a whole number valid
  for the restored cycle setting
- Graceful fallback when browser storage is missing, malformed, outdated,
  partially valid, or unavailable
- Dashboard as the first-visit and invalid-data landing view, with the last
  valid page restored after reload
- StudyForge brand navigation returns to Dashboard as the application home
- Existing active-task clearing, course deletion safeguards, and exactly-once
  natural Focus completion behavior preserved

### Milestone 9 - Session history and statistics

- One dated device-local history record for every naturally completed Focus
  session
- One history record and at most one selected-task Pomodoro increment behind the
  same exactly-once natural-completion guard
- Focus duration plus optional task and course snapshots preserved in each
  record
- Coherent history entries for Focus sessions completed without a selected task,
  with no invented course association
- Break completions, pauses, resets, settings changes, manual mode switches, and
  cancellations do not themselves create history or task progress
- Today and Monday-based current-week completed Focus-session totals
- A local-date seven-day trend showing completed sessions and focused minutes
- An all-time course-time breakdown, including an explicit unassigned category
  for sessions without a course
- A dated session list and clear pre-history empty state
- Dedicated History navigation with restoration after reload
- Migration of the complete Milestone 8 unified state into storage version 2
- Individual session-record validation, duplicate-ID rejection, safe optional
  snapshot repair, and graceful handling of malformed or unavailable storage
- Existing dashboard landing, 2x2 overview, brand-home navigation, task rules,
  course deletion safeguards, and memory-only countdown behavior preserved

## Current persistence

Stored together in one versioned `localStorage` record:

- Courses
- Student profile
- Tasks and their completion status
- Completed Pomodoro counts for tasks
- Timer durations and Focus sessions per cycle
- Auto-start and timer-sound preferences
- Completed Focus sessions in the current timer cycle
- Active-task selection
- Dated completed Focus-session history
- Last open application page

Kept in memory and reset on reload:

- Current timer mode and status
- Active countdown target timestamp and remaining time
- In-app timer completion feedback

StudyForge migrates valid Milestone 8 unified records into storage version 2.
When a usable unified record does not exist, it still migrates valid profile,
course, and timer-setting values from the Milestones 1-7 storage keys. Loaded
records and individual history entries are validated before use, and storage
access failures fall back to in-memory operation.

## Important scope decisions

- The existing violet accent remains the product's primary action color.
- Manual mode switches, resets, and settings changes do not count as completed
  sessions.
- Timer completion uses in-app feedback and sound only; it does not use browser
  or operating-system notifications.
- Only naturally completed Focus sessions update the selected task.
- Breaks, pauses, resets, settings changes, and manual mode switches do not
  update task progress.
- Pomodoro estimates are planning values and do not change when timer sessions
  finish.
- Reaching a task estimate does not automatically complete the task.
- Every task must reference an existing course, and a course with linked tasks
  cannot be deleted.
- Historical task and course labels are snapshots; later edits or deletion do
  not rewrite already completed sessions.
- No XP, streaks, levels, achievements, coins, rewards, goals, recommendations,
  heatmaps, or advanced analytics have been added.

## Verification

- Latest production command: `npm run build`
- Latest verified status: passing after Milestone 9 on July 26, 2026
- Build result: 32 modules transformed; production bundle completed successfully
- Project version: 0.9.0

## Next milestone

Milestone 10 will add restrained gamification: XP for valid completed Focus
sessions, level progress, a simple streak, a few earned achievements, and brief
reward feedback. It must not reward cancelled sessions or introduce coins,
shops, avatars, or fantasy-style systems.
