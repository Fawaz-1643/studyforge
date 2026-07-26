# StudyForge Project State

## Current milestone

Milestones 1-6 are complete. Milestone 7, the active-task session workflow, is
next.

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
- Timer as the default landing view

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
- Memory-only task data with no task `localStorage` persistence

## Current persistence

Stored in `localStorage`:

- Courses
- Student profile
- Timer durations
- Focus sessions per cycle
- Auto-start preference
- Timer-sound preference

Kept in memory and reset on reload:

- Current timer mode, status, and remaining time
- Completed Focus sessions in the current cycle
- All tasks and their completion status

Milestone 8 will introduce unified persistence for tasks, cycle progress,
active selections, and the rest of the core application state.

## Important scope decisions

- The existing violet accent remains the product's primary action color.
- Manual mode switches, resets, and settings changes do not count as completed
  sessions.
- Timer completion uses in-app feedback and sound only; it does not use browser
  or operating-system notifications.
- Tasks do not affect the timer in Milestone 6.
- Pomodoro estimates are planning values and do not change when timer sessions
  finish.
- Every task must reference an existing course, and a course with linked tasks
  cannot be deleted.
- No session history, statistics, XP, streaks, levels, or achievements have
  been added.

## Verification

- Latest production command: `npm run build`
- Latest verified status: passing after Milestone 6
- Project version: 0.6.0

## Next milestone

Milestone 7 will connect a selected active task to completed Focus sessions,
show that task near the timer, and add task progress to the dashboard. It must
increment progress exactly once per completed Focus session without changing
the task's estimate.
