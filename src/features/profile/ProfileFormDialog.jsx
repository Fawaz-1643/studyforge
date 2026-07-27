import { useRef, useState } from "react";
import { useModalDialog } from "../../hooks/useModalDialog.js";

export function ProfileFormDialog({ onCancel, onSave, profile }) {
  const [university, setUniversity] = useState(profile.university);
  const [fieldOfStudy, setFieldOfStudy] = useState(profile.fieldOfStudy);
  const universityInputRef = useRef(null);
  const dialogRef = useModalDialog(onCancel, universityInputRef);
  const hasProfile = Boolean(profile.university || profile.fieldOfStudy);

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      university: university.trim(),
      fieldOfStudy: fieldOfStudy.trim(),
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        aria-describedby="dashboard-profile-form-description"
        aria-labelledby="dashboard-profile-form-title"
        aria-modal="true"
        className="modal profile-form-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="modal-heading">
          <div>
            <p className="section-kicker">
              {hasProfile ? "Update profile" : "Student profile"}
            </p>
            <h2 id="dashboard-profile-form-title">
              {hasProfile ? "Edit your identity" : "Set up your identity"}
            </h2>
          </div>
          <button
            aria-label="Close profile editor"
            className="icon-button"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <p className="modal-copy" id="dashboard-profile-form-description">
          Add either detail to give your Dashboard and Profile a little academic
          context. Both stay only on this device.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="profile-form-dialog-fields">
            <label>
              <span className="field-label">
                University <span className="optional-label">Optional</span>
              </span>
              <input
                autoComplete="organization"
                className="text-input"
                maxLength={80}
                onChange={(event) => setUniversity(event.target.value)}
                placeholder="e.g. Khalifa University"
                ref={universityInputRef}
                value={university}
              />
            </label>
            <label>
              <span className="field-label">
                Field of study <span className="optional-label">Optional</span>
              </span>
              <input
                autoComplete="off"
                className="text-input"
                maxLength={80}
                onChange={(event) => setFieldOfStudy(event.target.value)}
                placeholder="e.g. Electrical Engineering"
                value={fieldOfStudy}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button
              className="button button--secondary"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button button--primary"
              disabled={!university.trim() && !fieldOfStudy.trim()}
              type="submit"
            >
              {hasProfile ? "Save changes" : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
