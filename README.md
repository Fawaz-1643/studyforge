# StudyForge

StudyForge is a dark-mode university study planner built one small milestone at
a time. This repository currently contains **Milestone 11.5: interface
expansion**.

## What Milestones 1–11.5 include

- Navigate between a dashboard, course library, task manager, timer, study
  history, and student profile
- Open Dashboard on a first visit and restore the last valid page after reload
- See a Dashboard course grid and compact saved-profile summary
- Add an optional university and field of study to a student profile
- Edit the profile and show saved details in the dedicated Profile view and
  compact Dashboard summary
- Use a dedicated Profile journey view with academic identity, Level and XP,
  streak, completed Focus work, course and task totals, achievements, and the
  saved timer rhythm
- Save the profile in the browser's `localStorage`
- Add courses with a name and one of seven colors
- Edit an existing course's name or color
- Delete a course after a confirmation step
- Save the course list in the browser's `localStorage`
- Switch between Focus, Short Break, and Long Break timers
- Start, pause, resume, and reset the timer
- Keep the countdown accurate in inactive or throttled browser tabs by
  calculating from real timestamps
- Customize all three timer durations and restore their defaults
- Choose how many completed Focus sessions lead to a Long Break
- Automatically move from Focus to the correct Break and from a Break to Focus
- Optionally start the next timer automatically
- Show an in-app completion message and optionally play distinct start/resume
  and completion sounds
- Save timer durations, cycle length, auto-start, and sound preferences in
  `localStorage`
- Create a task with a required title, an existing course, and an estimated
  number of Pomodoro sessions
- Edit a task's title, linked course, and Pomodoro estimate
- Mark active tasks as completed and reopen completed tasks
- Delete a task after a confirmation step
- Filter tasks by status and course at the same time
- See total, active, and completed task counts
- Prevent deletion of a course while any active or completed task still links
  to it
- See clear empty states when courses, tasks, or filter matches are missing
- Select, change, or clear one current study task
- See the current task, its course color, and completed-versus-estimated
  Pomodoros beside the timer
- Increment the current task exactly once when a Focus session naturally
  finishes
- Record exactly one dated history entry for each naturally completed Focus
  session
- Record Focus sessions without a selected task without inventing a course
  association
- Ensure break completions, pauses, resets, settings changes, manual mode
  switches, and cancellations do not themselves create history or task progress
- Clear the current-task selection when that task is completed or deleted
- See active-task and overall task progress on the dashboard
- Restore tasks, task completion, completed task Pomodoros, current-cycle
  progress, and the current-task selection after a reload
- Load and save the durable app state through one versioned persistence layer
- Migrate valid profile, course, and timer-setting data from the earlier storage
  format
- Reject or safely repair malformed stored records without preventing the app
  from opening
- Migrate the complete Milestone 8 unified state into the Milestone 9 storage
  version
- Validate history records individually, preserving usable records while
  discarding malformed records and unsafe optional associations
- Keep only tasks linked to existing courses and only restore a current task
  when it exists and remains active
- See today's and the current week's completed Focus-session totals
- See a seven-day Focus trend, all-time course-time breakdown, and dated session
  list
- See clear history and statistics empty states before any Focus session has
  completed
- Earn one XP for each minute in a naturally completed Focus session
- Progress through levels whose XP requirements increase gradually by 25 XP
  per level
- See current-level XP, XP remaining, and a full-width progress bar beneath the
  main Dashboard study sections
- See a compact level and XP bar in the site navigation header
- Build a study streak from valid Focus sessions on consecutive local calendar
  dates
- Earn first-session, five-session, 3-day, 7-day, 14-day, and 30-day
  achievements only once
- See brief in-app feedback for XP, achievements, and level progression
- Manually complete the current task from the Timer without changing its
  estimate or completing it automatically
- Receive a one-time task bonus equal to five XP per estimated Pomodoro
- Choose whether to complete a task when a Focus session reaches its estimate
- Keep or delete a task from its completion message
- Delete all completed tasks from the Completed task filter after confirming
  the exact number being removed
- Restore XP, level progress, streak data, achievements, and one-time task
  rewards safely after reload
- Migrate the complete Milestone 9 state into the Milestone 10 storage version
  and repair malformed or partially valid reward data
- Use a wider but bounded responsive layout with deliberate desktop, tablet,
  and mobile gutters
- Navigate with a keyboard using consistent visible focus indicators and a
  skip-to-content link
- Open dialogs with sensible initial focus, keep keyboard focus inside them,
  close them with Escape, and restore focus safely afterward
- Keep dialogs usable in short browser windows without clipping their controls
- Give repeated controls specific accessible names and associate validation
  errors with the field that needs attention
- Announce saved, updated, completed, reopened, and deleted actions without
  interrupting the interface
- Pause temporary reward feedback while it is hovered or keyboard-focused
- Explain when malformed saved data was repaired or replaced with safe defaults
- Preserve reduced-motion behavior and the established StudyForge visual design
- Use restrained motion for page changes, navigation selection, timer state,
  dropdowns, dialogs, buttons, task completion, progress changes, chart
  reveals, and meaningful reward feedback
- Give running timers a slow mode-colored breathing glow, while leaving idle
  and paused timers still
- Animate FAQ answers, course-card responses, and the Pomodoro illustration
  without delaying access to their content
- Animate FAQ answers on every open and close action with synchronized
  `aria-expanded` and region visibility
- Provide mouse and keyboard chart details through animated, accessible
  tooltips
- Collapse confirmed task deletions briefly before removal while preserving all
  existing History and reward data
- Disable the motion path comprehensively when the operating system requests
  reduced motion
- Show a responsive circular countdown whose remaining ring gradually drains in
  violet for Focus, teal for Short Break, and blue for Long Break
- Keep the circular timer above its optional task chooser, place play or pause
  inside the ring, and provide surrounding controls to add one minute, add one
  Focus interval to the current cycle, reset, or float the timer
- Open the complete Timer panel in browser full screen, exit through the same
  control or Escape, and keep the shared countdown and completion path intact
- Use larger circular timer rings with more restrained time numerals on both
  the Timer page and Dashboard Quick Focus widget
- Open an always-on-top floating timer with Document Picture-in-Picture when the
  browser supports it, with a compact popup fallback elsewhere
- Share the floating timer's countdown, modes, controls, task selection, and
  exactly-once completion path with the main application
- Award an exact Focus-completion bonus equal to 10% of completed Focus minutes,
  while presenting all XP totals as whole-number portions in the interface
- Show a completion summary with minute XP, the Focus-completion bonus, the
  optional one-time task bonus, and the combined XP gained in that session
- Start an unassigned default 25-minute Quick Focus session directly from the
  Dashboard using the same in-memory timer engine
- Switch the shared Dashboard timer between Focus, Short Break, and Long Break
  with the same mode colors and cancellation rules as the full Timer page
- Use a longer Dashboard landing experience with current-task direction,
  today/week totals, a seven-day trend, recent Focus sessions, and an
  introductory guide to the Pomodoro Technique
- Replace the former 2×2 overview with a responsive per-course grid showing
  active tasks, recorded Focus time, and completed-versus-estimated Pomodoros
- Keep student profile information in a compact section near the bottom of the
  Dashboard
- Present the Pomodoro introduction as a distinct illustrated editorial section
  with a visual Focus-and-break rhythm and keyboard-accessible FAQ accordions
- Measure and center every desktop navigation label and icon inside a precisely
  matching moving selection indicator, including after responsive resizing
- Use consistent green page-status dots, including the Study Timer eyebrow
- Give major Dashboard sections deliberately varied vertical breathing room
  while keeping the mini profile and local-data note visually related
- Use custom dark themed dropdowns for task-course selection, task filtering,
  and active-task selection, with keyboard, touch, and screen-reader behavior
- Keep the Timer page’s active-task dropdown above the settings surface while
  its options are open

The profile, courses, tasks, task progress, timer settings, completed Focus
sessions in the current cycle, current-task selection, completed Focus history,
XP, streak, achievements, and task-reward records are stored only on the device
and browser where they were created. Clearing that browser's site data will also
clear them.

The last open page is saved too. New visitors and invalid saved page values open
Dashboard, and the StudyForge logo returns there as the application home.

The active or paused countdown remains deliberately memory-only. Reloading does
not reconstruct its mode, status, target timestamp, or remaining seconds; the
timer returns to a fresh Focus session while retaining valid cycle progress.

StudyForge automatically migrates valid Milestone 8 and Milestone 9 unified
records and the complete Milestone 10 reward state into storage version 4. It
still imports valid profile, course, and timer-setting data from the Milestones
1–7 storage keys when no usable unified state exists. Earlier History records
remain worth their original minute-based XP and do not receive retroactive
Focus-completion bonuses. Previously completed tasks are treated as already
handled without receiving retroactive task bonuses. Unavailable, malformed,
outdated, or partially invalid browser data falls back safely, and
browser-storage failures do not prevent in-memory use.

Task estimates remain planning values. A naturally completed Focus session
increments the selected task's completed-Pomodoro count and creates one history
record without changing its estimate or automatically completing the task.
Break completions, resets, pauses, settings changes, manual mode switches, and
cancellations do not themselves increment task progress, create history, or
award rewards. Task completion is always a deliberate user action. Its XP bonus
can be earned only once for a given task, even if that task is reopened.
Naturally completed Focus sessions also earn an exact bonus equal to 10% of
their focused minutes. Fractional XP remains part of the saved calculation, but
StudyForge displays only the whole-number portion.

## Run the project locally

You need a current version of [Node.js](https://nodejs.org/) installed.

1. Open a terminal in this project folder.
2. Install the project's packages:

   ```bash
   npm install
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

4. Open the local address printed in the terminal, usually
   `http://localhost:5173`.
5. Press `Ctrl+C` in the terminal when you want to stop the server.

Vite automatically refreshes the page when you save a code change.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts a local development server |
| `npm run build` | Creates the optimized production site in `dist/` |
| `npm run preview` | Previews the production build locally |

## Project map

```text
studyforge/
├── src/
│   ├── App.jsx       # The visible React screen
│   ├── main.jsx      # Connects React to the web page
│   ├── persistence.js # Unified storage, validation, and legacy migration
│   ├── rewardUtils.js # XP, levels, streaks, achievements, and reward repair
│   ├── statisticsUtils.js # Session creation and study-statistic calculations
│   ├── taskUtils.js  # Task validation, filtering, and list rules
│   └── styles.css    # The complete visual theme
├── .gitignore        # Files Git should not track
├── index.html        # The browser's starting document
├── package.json      # Project packages and commands
├── PROJECT_STATE.md  # Completed work, persistence, and next milestone
├── vercel.json       # Vercel deployment settings
└── vite.config.js    # Vite and React configuration
```

## Deploy to Vercel later

When the project is pushed to GitHub, import the repository in Vercel. The
included `vercel.json` tells Vercel to use the Vite build and publish the
`dist` folder.
