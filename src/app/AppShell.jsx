import { useLayoutEffect, useRef } from "react";
import {
  BrandMark,
  NavIcon,
} from "../components/icons/AppIcons.jsx";
import { MiniLevelProgress } from "../features/rewards/MiniLevelProgress.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "courses", label: "Courses" },
  { id: "tasks", label: "Tasks" },
  { id: "timer", label: "Timer" },
  { id: "history", label: "History" },
  { id: "profile", label: "Profile" },
];

export function AppShell({
  activeView,
  children,
  onDismissRecovery,
  onNavigate,
  overlays,
  recoveryNotice,
  rewards,
  statusMessage,
}) {
  const primaryNavRef = useRef(null);
  const activeNavButtonRef = useRef(null);

  useLayoutEffect(() => {
    const navigation = primaryNavRef.current;
    const activeButton = activeNavButtonRef.current;

    if (!navigation || !activeButton) {
      return undefined;
    }

    function positionNavigationIndicator() {
      navigation.style.setProperty(
        "--nav-indicator-left",
        `${activeButton.offsetLeft}px`,
      );
      navigation.style.setProperty(
        "--nav-indicator-width",
        `${activeButton.offsetWidth}px`,
      );
      navigation.style.setProperty("--nav-indicator-opacity", "1");
    }

    positionNavigationIndicator();

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(positionNavigationIndicator)
        : null;

    resizeObserver?.observe(navigation);
    resizeObserver?.observe(activeButton);
    window.addEventListener("resize", positionNavigationIndicator);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", positionNavigationIndicator);
    };
  }, [activeView]);

  return (
    <div className="app-shell">
      <div className="ambient-glow ambient-glow--top" />
      <div className="ambient-glow ambient-glow--bottom" />
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <button
          className="brand"
          onClick={() => onNavigate("dashboard")}
          type="button"
        >
          <BrandMark />
          <span>StudyForge</span>
        </button>
        <nav
          className="primary-nav"
          aria-label="Main navigation"
          ref={primaryNavRef}
        >
          {NAV_ITEMS.map((item) => (
            <button
              aria-current={activeView === item.id ? "page" : undefined}
              className="nav-button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              ref={activeView === item.id ? activeNavButtonRef : null}
              type="button"
            >
              <NavIcon id={item.id} />
              {item.label}
            </button>
          ))}
        </nav>
        <MiniLevelProgress rewards={rewards} />
      </header>

      {recoveryNotice && (
        <aside className="storage-recovery-notice" role="status">
          <span>{recoveryNotice}</span>
          <button
            aria-label="Dismiss saved-data message"
            onClick={onDismissRecovery}
            type="button"
          >
            ×
          </button>
        </aside>
      )}

      <main className="main-content" id="main-content" tabIndex="-1">
        {children}
      </main>

      <footer>
        <span>© 2026 Fawaz Ahmed.</span>
        <span>StudyForge v1.0.1</span>
      </footer>

      <div
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {statusMessage}
      </div>

      {overlays}
    </div>
  );
}
