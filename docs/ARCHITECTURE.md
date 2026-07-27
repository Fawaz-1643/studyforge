# StudyForge architecture

StudyForge 1.0.1 keeps the released product behavior and storage format while
separating application coordination, feature presentation, pure rules, and
browser persistence. The structure is intentionally plain React and JavaScript:
there is no global state library, UI framework, backend, or runtime service.

## Dependency direction

```text
main.jsx
  -> app
       -> features
            -> shared components and hooks
            -> domain
       -> storage
            -> domain

styles/index.css
  -> ordered base, shared, feature, responsive, and motion stylesheets
```

Domain and storage modules never import React presentation components. Shared
components do not import feature views. Feature views receive the state and
mutations they need from the application coordinator instead of writing
persistence independently.

## Folder responsibilities

### `src/app`

- `App.jsx` owns durable application state and coordinates mutations across
  features.
- `AppShell.jsx` owns the page shell, navigation, active indicator, header XP
  display, live status, recovery notice, and footer.
- `AppOverlays.jsx` composes existing feature dialogs and feedback overlays.

App remains the single authority for courses, profile, tasks, active task,
History, rewards, active view, and saved Timer-cycle progress. It persists one
coherent snapshot through the storage boundary.

### `src/features`

- `dashboard` renders the existing overview, Quick Focus entry point, progress,
  identity, statistics, recent sessions, and educational content.
- `courses` owns course view markup plus course forms and confirmations.
- `tasks` owns task view markup plus task forms and confirmations.
- `timer` owns Timer presentation and the Timer-specific hooks described below.
- `history` renders validated session statistics and History records.
- `profile` renders and edits the local academic identity and journey summary.
- `rewards` renders level progress, completion summaries, and reward feedback.

Feature modules own presentation and feature interaction details. They do not
become alternate owners of durable state.

### `src/components`

- `icons` contains the shared inline SVG icon set.
- `ui` contains the existing accessible themed select control.

Shared UI remains deliberately small. Feature-specific forms and dialogs stay
beside their feature instead of being forced into a generic component system.

### `src/hooks`

`useModalDialog` centralizes focus placement, focus containment, Escape
handling, scroll locking, background inertness, and focus restoration for the
existing dialogs.

### `src/domain`

Pure JavaScript modules hold predictable rules and calculations:

- `courses.js` contains course colors and form validation.
- `tasks.js` contains task validation, filtering, counts, progress, completion,
  and list mutations.
- `timer.js` contains mode durations, natural and skipped transitions, cycle
  reset decisions, extension bounds, outcome policy, and the exactly-once
  natural-completion guard.
- `focusCompletion.js` applies one credited natural Focus outcome to tasks,
  History, and rewards and returns the next coherent state.
- `statistics.js` derives session statistics from validated History.
- `rewards.js` derives XP, levels, streaks, achievements, and one-time task
  rewards.
- `formatters.js` and `ids.js` contain shared formatting and identifier helpers.

These functions take explicit inputs and have no direct DOM, React, or
`localStorage` access.

### `src/storage`

- `schema.js` defines storage key `studyforge:app-state`, schema version 4,
  supported historical versions, legacy keys, valid views, and safe defaults.
- `normalizers.js` validates and repairs fields and individual records.
- `migrations.js` detects supported versions and migrates them into the current
  in-memory model without changing historical reward rules.
- `appStorage.js` performs guarded JSON reads and writes and serializes only
  approved durable state.

The running or paused countdown, target timestamp, remaining seconds, current
mode, and other in-progress Timer state are intentionally excluded. Reloading
therefore starts a fresh idle Focus session and cannot fabricate a completion.

The schema and key are unchanged from 1.0.0. There is no runtime compatibility
shim: existing schema versions 1-4 and the earlier split storage keys continue
through the same validated migration behavior. The default Timer settings
re-export in `appStorage.js` remains a small source-level convenience, not a
second implementation.

### `src/styles`

`index.css` imports the original CSS in a fixed order:

- `base.css` for tokens, reset, typography, shell, and navigation
- `dashboard.css`, `courses.css`, `tasks.css`, `timer.css`, `history.css`, and
  `profile.css` for feature presentation
- `shared-ui.css` for shared controls, dialogs, feedback, and utilities
- `responsive.css` for existing breakpoints and fullscreen adaptations
- `motion.css` for motion and reduced-motion behavior

The existing selectors and declaration order were retained so the refactor does
not become a redesign.

## Timer and credited-outcome boundary

`useTimerEngine` is the only owner of the in-memory countdown, target timestamp,
mode, running status, temporary cycle target, and natural-completion guard. It
uses `Date.now()` to calculate remaining time; it does not decrement an
authoritative counter once per interval.

Timer presentation calls explicit engine actions for start, pause, resume, mode
change, add minute, add Focus interval, next session, settings, and reset cycle.
Audio and fullscreen/orientation behavior are isolated in `useTimerAudio` and
`useTimerFullscreen`.

The domain outcome vocabulary already distinguishes natural completion, early
completion, skip, cancellation, and cycle reset. In 1.0.1, only a natural Focus
outcome is creditable. The engine consumes that boundary once and sends one
`onNaturalFocusComplete` event to `App`.

`App` passes that event once to `applyFocusSessionOutcome`, which returns the
next task list, one History entry, next rewards, and the existing completion
summary. Skip, reset, pause, settings changes, manual mode changes, breaks, and
reloads never call this path.

Future credited outcomes can extend the domain policy and this one event
boundary without adding independent effects that watch Timer state.

## Extension map for Milestones 13-18

- Milestone 13 belongs primarily in `domain/tasks.js`,
  `features/tasks`, and an approved storage-schema migration for extended task
  fields and date/priority/type selectors.
- Milestone 14 belongs in new goal domain and feature modules, with
  History-derived aggregations in `domain/statistics.js`.
- Milestone 15 should add import/export validation beside `src/storage`; PWA,
  offline, and notification integration should remain outside pure domain code.
- Milestone 16 should add dated semester and assessment domain modules plus a
  calendar or agenda feature, with schema changes only when implemented.
- Milestone 17 should add pure workload and recommendation calculations that
  consume validated task, course, and History data.
- Milestone 18 should expand cross-feature regression coverage, review every
  migration, remove obsolete code, and finalize release documentation.

No future fields, placeholder interfaces, navigation items, calculations, or
product behavior are included in Milestone 12.5.

## Verification boundaries

`npm test` runs focused pure-domain and storage regression tests with Node's
built-in test runner. `npm run build` verifies the production compilation.
Responsive layout, focus behavior, fullscreen/orientation behavior, live
browser storage, and sound require the practical browser checklist recorded in
`PROJECT_STATE.md`.
