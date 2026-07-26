# StudyForge

StudyForge is a dark-mode university study planner built one small milestone at
a time. This repository currently contains **Milestone 9: session history and
statistics**.

XP, levels, streaks, achievements, and other rewards belong to later
milestones.

## What Milestones 1–9 include

- Navigate between a dashboard, course library, task manager, timer, study
  history, and student profile
- Open Dashboard on a first visit and restore the last valid page after reload
- See a simple dashboard overview of saved profile and course information
- Add an optional university and field of study to a student profile
- Edit the profile and show saved details above the course library
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
- A responsive dark design that works on phones and larger screens

The profile, courses, tasks, task progress, timer settings, completed Focus
sessions in the current cycle, current-task selection, and completed Focus
history are stored only on the device and browser where they were created.
Clearing that browser's site data will also clear them.

The last open page is saved too. New visitors and invalid saved page values open
Dashboard, and the StudyForge logo returns there as the application home.

The active or paused countdown remains deliberately memory-only. Reloading does
not reconstruct its mode, status, target timestamp, or remaining seconds; the
timer returns to a fresh Focus session while retaining valid cycle progress.

StudyForge automatically migrates a valid Milestone 8 unified record and still
imports valid profile, course, and timer-setting data from the Milestones 1–7
storage keys when no usable unified state exists. Unavailable, malformed,
outdated, or partially invalid browser data falls back safely, and
browser-storage failures do not prevent in-memory use.

Task estimates remain planning values. A naturally completed Focus session
increments the selected task's completed-Pomodoro count and creates one history
record without changing its estimate or automatically completing the task.
Break completions, resets, pauses, settings changes, manual mode switches, and
cancellations do not themselves increment task progress or create history.

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
