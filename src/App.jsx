const foundationItems = [
  "React component structure",
  "Responsive dark theme",
  "Git-friendly project files",
  "Vercel-ready production build",
];

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="check-icon"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path d="m5 10 3 3 7-7" />
    </svg>
  );
}

export default function App() {
  return (
    <main className="app-shell">
      <div className="ambient-glow ambient-glow--top" />
      <div className="ambient-glow ambient-glow--bottom" />

      <header className="site-header">
        <a className="brand" href="/" aria-label="StudyForge home">
          <BrandMark />
          <span>StudyForge</span>
        </a>
        <span className="milestone-badge">Milestone 1</span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="eyebrow">
          <span className="status-dot" />
          Foundation online
        </div>

        <h1 id="page-title">
          Build better study days,
          <span> one focused session at a time.</span>
        </h1>

        <p className="hero-copy">
          StudyForge now has a solid home. We’ll add planning, focus, and
          progress tools carefully in the milestones ahead.
        </p>

        <div className="foundation-card">
          <div className="card-heading">
            <div>
              <p className="card-kicker">Project status</p>
              <h2>Foundation complete</h2>
            </div>
            <span className="progress-value">01 / —</span>
          </div>

          <div className="progress-track" aria-hidden="true">
            <span />
          </div>

          <ul className="foundation-list">
            {foundationItems.map((item) => (
              <li key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="next-step">
          Next up <span>•</span> The first real planner feature
        </p>
      </section>

      <footer>
        <span>Designed for calm, deliberate progress.</span>
        <span>StudyForge v0.1</span>
      </footer>
    </main>
  );
}
