import { useEffect, useRef, useState } from "react";

export function TimerSettings({
  onRestoreDefaults,
  onSaveDurations,
  onToggleAutoStart,
  onToggleSound,
  settings,
}) {
  const [draftSettings, setDraftSettings] = useState({
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
    focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
  });
  const [settingsError, setSettingsError] = useState("");
  const [settingsErrorField, setSettingsErrorField] = useState(null);
  const durationInputRefs = useRef({});
  const cycleInputRef = useRef(null);

  useEffect(() => {
    setDraftSettings({
      focusMinutes: String(settings.focusMinutes),
      shortBreakMinutes: String(settings.shortBreakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
      focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
    });
    setSettingsError("");
    setSettingsErrorField(null);
  }, [
    settings.focusMinutes,
    settings.shortBreakMinutes,
    settings.longBreakMinutes,
    settings.focusSessionsPerCycle,
  ]);

  function updateDraftSetting(key, value) {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const durationKeys = ["focusMinutes", "shortBreakMinutes", "longBreakMinutes"];
    const invalidDurationKey = durationKeys.find((key) => {
      const value = draftSettings[key];
      return !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 180;
    });
    const cycleValue = draftSettings.focusSessionsPerCycle;
    const cycleIsValid =
      /^\d+$/.test(cycleValue) && Number(cycleValue) >= 1 && Number(cycleValue) <= 99;

    if (invalidDurationKey) {
      setSettingsError("Enter each duration as a whole number from 1 to 180 minutes.");
      setSettingsErrorField("durations");
      durationInputRefs.current[invalidDurationKey]?.focus();
      return;
    }

    if (!cycleIsValid) {
      setSettingsError("Enter a Focus sessions value from 1 to 99.");
      setSettingsErrorField("cycle");
      cycleInputRef.current?.focus();
      return;
    }

    setSettingsError("");
    setSettingsErrorField(null);
    onSaveDurations({
      focusMinutes: Number(draftSettings.focusMinutes),
      shortBreakMinutes: Number(draftSettings.shortBreakMinutes),
      longBreakMinutes: Number(draftSettings.longBreakMinutes),
      focusSessionsPerCycle: Number(draftSettings.focusSessionsPerCycle),
    });
  }

  return (
    <section className="timer-settings" aria-labelledby="timer-settings-title">
      <div className="timer-settings-heading">
        <div>
          <p className="section-kicker">Preferences</p>
          <h2 id="timer-settings-title">Timer settings</h2>
        </div>
        <button
          className="text-button"
          onClick={onRestoreDefaults}
          type="button"
        >
          Restore defaults
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="timer-duration-fields">
          {[
            { key: "focusMinutes", label: "Focus" },
            { key: "shortBreakMinutes", label: "Short Break" },
            { key: "longBreakMinutes", label: "Long Break" },
          ].map((field) => (
            <label key={field.key}>
              <span className="field-label">{field.label}</span>
              <span className="number-input-wrap">
                <input
                  aria-describedby={settingsError ? "timer-settings-error" : undefined}
                  aria-invalid={settingsErrorField === "durations"}
                  className="text-input timer-number-input"
                  inputMode="numeric"
                max="180"
                min="1"
                onChange={(event) => updateDraftSetting(field.key, event.target.value)}
                ref={(element) => {
                  durationInputRefs.current[field.key] = element;
                }}
                step="1"
                  type="number"
                  value={draftSettings[field.key]}
                />
                <span>min</span>
              </span>
            </label>
          ))}
          <label>
            <span className="field-label">Focus sessions per cycle</span>
            <span className="number-input-wrap">
              <input
                aria-describedby={settingsError ? "timer-settings-error" : undefined}
                aria-invalid={settingsErrorField === "cycle"}
                className="text-input timer-number-input"
                inputMode="numeric"
                max="99"
                min="1"
                onChange={(event) =>
                  updateDraftSetting("focusSessionsPerCycle", event.target.value)
                }
                ref={cycleInputRef}
                step="1"
                type="number"
                value={draftSettings.focusSessionsPerCycle}
              />
              <span>sessions</span>
            </span>
          </label>
        </div>

        <div className="timer-settings-actions">
          <p
            className={`form-message${settingsError ? " form-message--error" : ""}`}
            id="timer-settings-error"
            role={settingsError ? "alert" : undefined}
          >
            {settingsError || "Changes reset the current timer without completing it."}
          </p>
          <button className="button button--secondary" type="submit">
            Apply settings
          </button>
        </div>
      </form>

      <div className="timer-toggles">
        <label className="toggle-row">
          <span>
            <strong>Auto-start next timer</strong>
            <small>Begin the next Focus or Break timer automatically.</small>
          </span>
          <input
            checked={settings.autoStart}
            onChange={(event) => onToggleAutoStart(event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-control" aria-hidden="true" />
        </label>
        <label className="toggle-row">
          <span>
            <strong>Timer sounds</strong>
            <small>Play distinct sounds when a timer starts and finishes.</small>
          </span>
          <input
            checked={settings.soundEnabled}
            onChange={(event) => onToggleSound(event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-control" aria-hidden="true" />
        </label>
      </div>
    </section>
  );
}
