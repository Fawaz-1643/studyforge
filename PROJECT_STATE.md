# StudyForge Project State

## Current milestone

Milestones 1-5 are complete. Milestone 6, the course-linked task manager, is
next.

## Technical foundation

- React 19 with Vite and JavaScript
- Responsive dark interface with a violet primary accent
- A single-page application with Dashboard, Courses, Timer, and Profile views
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

Task data does not exist yet. Milestone 8 will introduce unified persistence for
tasks, cycle progress, active selections, and the rest of the core application
state.

## Important scope decisions

- The existing violet accent remains the product's primary action color.
- Manual mode switches, resets, and settings changes do not count as completed
  sessions.
- Timer completion uses in-app feedback and sound only; it does not use browser
  or operating-system notifications.
- Tasks will not affect the timer until Milestone 7.
- No session history, statistics, XP, streaks, levels, or achievements have
  been added.

## Verification

- Latest production command: `npm run build`
- Latest verified status: passing after Milestone 5
- Project version: 0.5.0

## Next milestone

Milestone 6 will add a course-linked task manager with create, edit, complete,
reopen, delete, filter, and Pomodoro-estimate features. It must not connect
tasks to timer completions or add task persistence early.
