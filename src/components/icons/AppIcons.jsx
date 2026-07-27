export function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export function ClockIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path d="M6.5 1.5h3" />
      <circle cx="8" cy="8.5" r="5.25" />
      <path d="M8 5v3.5l2.45 2.15" />
      <circle className="clock-icon-center" cx="8" cy="8.5" r="0.65" />
    </svg>
  );
}

export function NavIcon({ id }) {
  const sharedProps = {
    "aria-hidden": true,
    className: `nav-icon nav-icon--${id}`,
    fill: "none",
    viewBox: "0 0 16 16",
  };

  if (id === "dashboard") {
    return (
      <svg {...sharedProps}>
        <rect height="5" rx="1.25" width="5" x="1.5" y="1.5" />
        <rect height="5" rx="1.25" width="5" x="9.5" y="1.5" />
        <rect height="5" rx="1.25" width="5" x="1.5" y="9.5" />
        <rect height="5" rx="1.25" width="5" x="9.5" y="9.5" />
      </svg>
    );
  }

  if (id === "courses") {
    return (
      <svg {...sharedProps}>
        <rect height="4.5" rx="1.25" width="13" x="1.5" y="2" />
        <rect height="4.5" rx="1.25" width="13" x="1.5" y="9.5" />
      </svg>
    );
  }

  if (id === "tasks") {
    return (
      <svg {...sharedProps}>
        <rect height="13" rx="2.25" width="13" x="1.5" y="1.5" />
        <path d="m4.75 8.2 2.05 2.05 4.55-4.7" />
      </svg>
    );
  }

  if (id === "timer") {
    return <ClockIcon className={sharedProps.className} />;
  }

  if (id === "history") {
    return (
      <svg {...sharedProps}>
        <path d="M2 13.75h12" />
        <path d="M3.5 11V7.75h2V11M7 11V3.5h2V11M10.5 11V6h2V11" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <circle cx="8" cy="5" r="3" />
      <path d="M2.75 14c.35-3.1 2.1-4.65 5.25-4.65S12.9 10.9 13.25 14Z" />
    </svg>
  );
}

export function PlusIcon() {
  return <span className="plus-icon" aria-hidden="true" />;
}
