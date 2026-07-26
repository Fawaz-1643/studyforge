# StudyForge Project State

## Current milestone

Milestones 1-12 are complete. StudyForge version 1.0.0 is publicly released at
[studyforge-gray-eight.vercel.app](https://studyforge-gray-eight.vercel.app).

## Technical foundation

- React 19 with Vite and JavaScript
- Responsive dark interface with a violet primary accent
- A single-page application with Dashboard, Courses, Tasks, Timer, History, and
  Profile views
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
- Start, pause, resume, confirmed cycle reset, next-session skipping, and
  manual mode switching
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

### Milestone 10 - Restrained gamification

- One XP per focused minute awarded for every validated naturally completed
  Focus-session history record
- One history record, at most one selected-task Pomodoro increment, and one
  Focus XP award behind the same exactly-once natural-completion guard
- Gradual level progression beginning at 100 XP and increasing the next-level
  requirement by 25 XP at each level
- A full-width dashboard progress section beneath the balanced 2x2 overview,
  with total XP, current level, XP remaining, and a level-progress bar
- A compact level and XP bar in the site navigation header, replacing the
  milestone badge and adapting cleanly on narrow screens
- A local-calendar study streak based only on valid completed Focus sessions,
  with multiple sessions on the same date counting as one study day
- Six one-time achievements for the first session, five sessions, and 3-day,
  7-day, 14-day, and 30-day streaks
- Brief, dismissible in-app feedback for XP, newly earned achievements, and
  level progression
- Manual task completion available from the Timer at any progress count, with a
  prompt when a natural Focus completion lands exactly on the task estimate
- One-time manual task-completion XP equal to five times the task's estimated
  Pomodoros, protected from repeat awards after reopen and re-completion
- A restrained task-completion message showing the bonus and offering confirmed
  deletion
- Confirmed bulk deletion of completed tasks from the Completed task filter,
  while preserving History snapshots, statistics, and earned rewards
- Migration of the complete Milestone 9 unified state into storage version 3,
  deriving migrated Focus rewards from validated History records and treating
  previously completed tasks as already handled without retroactive bonuses
- Field-level reward repair for missing, malformed, outdated, duplicate, or
  partially valid XP, task-reward, streak, and achievement data
- Existing History statistics, page restoration, dashboard symmetry, brand-home
  navigation, course safeguards, task estimates, and memory-only countdown
  behavior preserved

### Milestone 11 - Quality and polish

- The established dark visual identity, violet action color, restrained amber
  reward color, balanced Dashboard, card treatments, and navigation model were
  preserved rather than redesigned
- Shared page width increased responsively to a bounded 1440px maximum, with
  deliberate desktop, tablet, and mobile edge gutters
- A semantic main-content region and keyboard skip link were added without
  changing the visible navigation structure
- Keyboard focus indicators remain consistent across buttons, links, fields,
  timer modes, toggles, and course-color controls
- Every modal now receives sensible initial focus, contains Tab and Shift+Tab
  navigation, closes with Escape, makes background content inert, locks
  background scrolling, and restores focus safely
- Destructive confirmations initially focus the safe action and retain explicit
  language about what will be removed or preserved
- Modal content can scroll within short browser windows so headings, fields,
  errors, and actions are not clipped
- Repeated course, task, active-task, and timer actions have specific accessible
  names
- Task and timer-setting validation identifies the invalid field, associates
  its error text, and moves focus to the field that needs correction
- Screen-reader status feedback was added for profile, course, task, active-task,
  completion, reopen, and deletion actions
- Reward feedback remains brief and dismissible but pauses while hovered or
  keyboard-focused
- Malformed or partially repaired unified saved data produces a dismissible,
  readable recovery message while safe defaults and in-memory operation remain
  available
- Existing reduced-motion behavior, long-content wrapping, empty states,
  disabled states, and responsive navigation were reviewed and retained
- All Milestones 1-10 timer, task, History, persistence, reward, achievement,
  migration, and exactly-once completion rules remain unchanged

### Milestone 11.5 - Interface expansion

- The Timer now uses a responsive circular SVG progress ring that drains as the
  in-memory countdown advances
- Focus uses the existing violet action family, Short Break uses restrained
  teal, and Long Break uses blue while amber remains reserved for rewards
- The time, active mode, and running, paused, or ready status remain readable
  inside the circular timer at desktop, tablet, and mobile sizes
- Timer-page and Dashboard rings use a more spacious scale with smaller timer
  numerals so the mode, time, play control, and status do not feel crowded
- Reduced-motion preferences disable the ring and dropdown transitions without
  hiding progress or state
- The optional activity chooser now follows the Timer so the complete timer is
  the first major control visible on the page
- Play and pause sit inside the ring, with four labelled surrounding controls
  for adding one minute, adding one Focus interval to the current cycle,
  resetting the complete cycle, and skipping to the next session
- A separate centred Full screen control sits beneath the larger cycle-progress
  label and expands the complete Timer panel with responsive spacing; the same
  control or the browser's Escape behavior exits full screen
- Fullscreen changes are detected through the browser event so the accessible
  name and visible label stay accurate, failures receive a polite status
  message, and unsupported browsers expose a disabled control
- Fullscreen presentation remains entirely ephemeral and continues using the
  original memory-only countdown, task, History, and exactly-once reward path
- Fullscreen remains available on laptops and uses a fixed, non-scrolling
  layout; small touch devices request portrait orientation and fall back to a
  dedicated rotate-device state when the browser cannot lock orientation
- Adding a Focus interval changes only the temporary current-cycle target; it
  does not add 25 minutes, persist a countdown, or award any progress
- Next session cancels the unfinished interval without History, XP, task,
  achievement, streak, or cycle-progress effects, then prepares Short Break
  after Focus or Focus after either break
- Reset cycle returns to an idle Focus timer, clears current-cycle progress,
  restores the saved cycle target, and preserves all previously earned History,
  XP, achievements, and task progress; a safe-action-first confirmation protects
  running, paused, extended, or partially completed cycles
- Each naturally completed Focus session now earns an exact completion bonus of
  10% of its focused minutes in addition to its minute-based XP
- Fractional XP is retained internally and in persistence, while all visible XP
  values show only their whole-number portion
- The Focus-completion dialog itemizes minute XP, the completion bonus, an
  optional one-time task bonus, and the combined session gain
- When the selected task reaches its estimate, the completion dialog retains
  manual task completion and can add the one-time task bonus to the same summary
- The Dashboard is now a richer, naturally scrollable landing page while the six
  navigation views remain separate
- Dashboard additions use only existing task and History data: current-task
  direction, today and current-week focus totals, active task count, seven-day
  Focus trend, and the three most recent sessions
- A Dashboard Quick Focus widget starts an unassigned default 25-minute Focus
  session through the shared timer engine, without task progress
- The Dashboard timer now includes compact Focus, Short Break, and Long Break
  mode controls; selecting one updates the shared timer and its violet, teal, or
  blue treatment
- The former 2x2 overview was replaced by a responsive course grid with one
  color-linked card per course, including active-task count, recorded Focus
  time, and completed-versus-estimated Pomodoros
- Profile information now appears in a compact section near the bottom of the
  Dashboard instead of occupying a large overview card
- The Profile view is now headed “Your journey,” and its saved
  identity panel uses “Your academic identity” instead of the generic “Your
  study space”
- A personal study snapshot on Profile derives current Level and visible XP,
  active streak, all-time Focus time and sessions, course count, active and
  completed task counts, and earned achievements from existing validated state
- A separate Profile rhythm section summarizes the saved Focus, Short Break,
  Long Break, and intervals-per-cycle settings while reiterating that active
  countdown state remains memory-only
- Profile snapshot and rhythm cards respond subtly on hover and collapse to
  readable two-column and single-column arrangements at tablet and mobile sizes
- A responsive educational section introduces the technique's origin, focus and
  break rhythm, and broader planning method with an official source link and
  clear non-affiliation note
- The educational section has its own editorial treatment, CSS-built
  tomato-timer illustration, visual three-step rhythm, and accessible FAQ
  accordions covering duration, breaks, interruptions, unassigned sessions, and
  Long Break timing
- FAQ panels retain their content in the layout animation path so both opening
  and closing animate on every interaction while `aria-expanded` and region
  visibility remain synchronized
- The full-width reward progress, achievements, compact header XP bar, and
  local-data note remain intact
- All native application dropdowns were replaced with one themed combobox and
  listbox component for task-course selection, course filtering, and active-task
  selection
- The themed dropdown supports mouse and touch selection plus Enter, Space,
  Escape, Tab, Home, End, and Arrow-key behavior, visible focus, selected-state
  feedback, long labels, and bounded scrolling
- The active-task dropdown receives a raised stacking layer while open so its
  option list overlays the Timer settings panel instead of appearing beneath it
- Existing manual task completion, fixed estimates, one-time task bonuses,
  course deletion safeguards, memory-only countdown rules, and exactly-once
  Focus updates remain unchanged
- A restrained interaction-motion system now covers page entrance, the moving
  desktop navigation indicator, button presses, dropdown and dialog entrance,
  FAQ answers, course-card hover response, task completion and deletion,
  progress bars, and History chart reveals
- The desktop navigation indicator now measures the active button's rendered
  position and width, including after responsive resizing, so every label and
  icon remains precisely centered inside the violet surface
- The Study Timer eyebrow uses the same green status dot as the other views
- Major Dashboard sections use larger vertical intervals for clearer hierarchy,
  while related profile and local-storage information remain grouped
- Those Dashboard intervals are intentionally non-uniform: timer and editorial
  transitions receive the largest pauses, data grids receive moderate spacing,
  and the profile/local-data pair remains comparatively close
- Additional hover response was added to Dashboard sections, recent-session
  rows, profile identity, Pomodoro rhythm icons, and the active navigation icon
- Running timer rings use a slow breathing glow in the active mode color;
  pausing, resetting, or leaving the running state stops the ambient motion
- Focus completion adds a small amber ring-burst around its existing summary
  symbol without introducing full-screen confetti or reward-game visuals
- The Pomodoro illustration uses very slow orbit and label movement, while
  seven-day chart bars expose concise details on mouse hover and keyboard focus
- Confirmed task deletion receives a short visual collapse before removal; the
  underlying deletion rules still retain History snapshots, statistics, XP,
  achievements, and one-time reward records
- `prefers-reduced-motion` reduces animations and transitions to effectively
  immediate state changes across the whole application
- The version 1.0 release preparation added a compact Dashboard academic
  identity tile beside the main heading. It shows a setup state when no profile
  exists, opens the same accessible local profile workflow in a modal, and
  updates to the saved university or field of study without adding accounts or
  cloud persistence.

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
- Per-session Focus-completion bonus XP for new Milestone 11.5 sessions
- XP, level progress, local-date streak data, earned achievements, and one-time
  task-completion reward records
- Last open application page

Kept in memory and reset on reload:

- Current timer mode and status
- Active countdown target timestamp and remaining time
- In-app timer completion feedback

StudyForge saves the current schema as storage version 4. It migrates valid
Milestone 8 and Milestone 9 unified records and the complete Milestone 10 reward
state without awarding retroactive Focus-completion bonuses. Valid History
records remain the durable source for Focus XP and streak progress. Previously
completed tasks are marked as already handled without receiving retroactive
task bonuses. When a usable unified record does not exist, StudyForge still
migrates valid profile, course, and timer-setting values from the Milestones
1-7 storage keys. Loaded records, individual History entries, reward data, and
new per-session Focus bonuses are validated before use, and storage-access
failures fall back to in-memory operation.

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
- Focus rewards use one XP per completed minute plus an exact completion bonus
  equal to 10% of the session duration. Manual task completion uses a one-time
  bonus of five XP per estimated Pomodoro; reopening a task cannot earn that
  bonus again.
- Levels and achievements are derived from validated progress so contradictory
  saved reward values cannot create false unlocks.
- No coins, currency, shops, purchasable rewards, avatars, fantasy artwork,
  leaderboards, social comparison, sharing, goals, recommendations, heatmaps,
  or advanced analytics have been added.

## Verification

- Latest production command: `npm run build`
- Latest verified status: production release checks passing on July 27, 2026
- Build result: 33 modules transformed; production bundle completed
  successfully in 426 ms
- Production output: 0.65 kB HTML, 82.54 kB CSS, and 295.26 kB JavaScript
  before gzip
- Focused utility checks passed for valid and invalid task input, fixed
  estimates, completion filtering, supported storage migration, no retroactive
  Focus bonus, fractional XP restoration, malformed-data fallback,
  storage-access failure, one-time task bonuses, History snapshots, statistics,
  and level progression
- The pre-release browser audit passed all six views at wide desktop, tablet,
  and narrow mobile widths without horizontal page overflow or console errors
- Fresh-origin Dashboard landing, restoration of every valid last-open view,
  and StudyForge brand navigation back to Dashboard passed
- The Dashboard identity setup and edit dialog passed desktop and mobile layout,
  initial-focus, focus-containment, Escape, inert-background, scroll-lock,
  focus-restoration, save, immediate tile update, and reload-persistence checks
- The custom course filter passed Enter, Home, End, and Escape selection
  checks; destructive dialogs retained safe initial focus
- A natural one-minute Focus session created exactly one History record,
  incremented the selected task exactly once, and awarded the expected
  minute-based and 10% completion XP exactly once
- Pause, add-minute, add-cycle, reset, next-session, interrupted-reload, and
  fullscreen-control checks preserved History, task progress, XP, and the
  memory-only countdown rules
- The Timer ring measured exactly centred at laptop, tablet, and mobile widths
  with no horizontal overflow; fullscreen remained fixed and non-scrolling,
  and the simulated small-touch landscape fallback exposed a visible
  rotate-device message and fullscreen exit control
- Seven privacy-safe repository screenshots were captured and visually checked
  for readability, current interface accuracy, relative paths, and absence of
  private data or browser chrome
- Vercel detected the Vite application correctly with project root `./`, build
  command `npm run build`, output directory `dist`, and no environment
  variables
- The first production deployment reached Vercel `Ready` status from release
  source commit `f424dffa0d57d35873b87b71b51b9f4153b0987f`
- The public application passed all six views at wide desktop and narrow mobile
  widths without horizontal page or navigation overflow
- A fresh production origin opened Dashboard, direct reloads succeeded, the
  last valid view restored, and StudyForge brand navigation returned home
- Profile setup updated the production Dashboard immediately and survived a
  normal reload through device-local browser storage
- A running production countdown returned to a fresh idle `25:00` Focus session
  after reload without adding History, task progress, or XP
- The public browser console remained free of warnings and errors
- The production project has zero function invocations and adds no account
  system, backend, database, environment variables, or cloud persistence
- Malformed-data and unavailable-storage fallback checks passed against the
  exact release source before deployment; the deployed bundle is built from
  that unchanged commit
- Public URL:
  [studyforge-gray-eight.vercel.app](https://studyforge-gray-eight.vercel.app)
- Project version: 1.0.0

## Release status

Milestone 12 is complete. The remaining repository action is the
documentation-only follow-up that records the public URL and these production
verification results.

No Stage 1 or Stage 2 expansion work is part of this release.
