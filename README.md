# StudyForge

StudyForge is a dark-mode university study planner built one small milestone at
a time. This repository currently contains **Milestone 5: timer settings,
automatic session cycles, and completion feedback**.

Tasks, statistics, persistence for timer data, and the XP system belong to later
milestones.

## What Milestones 1–5 include

- Navigate between a dashboard, course library, timer, and student profile
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
- Show an in-app completion message and optionally play a short sound
- A responsive dark design that works on phones and larger screens

The profile and courses are stored only on the device and browser where they
were created. Clearing that browser's site data will also clear them. The timer,
timer settings, and cycle progress are kept only in memory and reset when the
page is reloaded.

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
│   └── styles.css    # The complete visual theme
├── .gitignore        # Files Git should not track
├── index.html        # The browser's starting document
├── package.json      # Project packages and commands
├── vercel.json       # Vercel deployment settings
└── vite.config.js    # Vite and React configuration
```

## Deploy to Vercel later

When the project is pushed to GitHub, import the repository in Vercel. The
included `vercel.json` tells Vercel to use the Vite build and publish the
`dist` folder.
