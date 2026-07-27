export function DashboardIdentityCard({ onEdit, profile }) {
  const hasProfile = Boolean(profile.university || profile.fieldOfStudy);
  const title = hasProfile
    ? profile.fieldOfStudy || profile.university
    : "Set up your identity";
  const detail = hasProfile
    ? profile.fieldOfStudy && profile.university
      ? profile.university
      : "Saved on this device"
    : "Add your university or field of study.";

  return (
    <aside
      aria-label={hasProfile ? "Saved academic identity" : "Set up academic identity"}
      className={`dashboard-identity-card${
        hasProfile ? " dashboard-identity-card--saved" : ""
      }`}
    >
      <div className="dashboard-identity-mark" aria-hidden="true">
        <span />
      </div>
      <div className="dashboard-identity-copy">
        <p className="section-kicker">Academic identity</p>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <button
        className="button button--secondary"
        onClick={onEdit}
        type="button"
      >
        {hasProfile ? "Edit" : "Set up"}
      </button>
    </aside>
  );
}
