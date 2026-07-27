import { useRef } from "react";
import { formatVisibleXp } from "../../domain/formatters.js";
import { useModalDialog } from "../../hooks/useModalDialog.js";

export function FocusCompletionSummary({
  onClose,
  onCompleteTask,
  summary,
}) {
  const continueButtonRef = useRef(null);
  const dialogRef = useModalDialog(onClose, continueButtonRef);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-describedby="focus-summary-description"
        aria-labelledby="focus-summary-title"
        aria-modal="true"
        className="modal modal--small focus-summary-modal"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <div className="focus-summary-symbol" aria-hidden="true">
          ✓
        </div>
        <p className="section-kicker">Focus complete</p>
        <h2 id="focus-summary-title">Beautiful work. You finished the session.</h2>
        <p className="modal-copy" id="focus-summary-description">
          Your focused time is safely recorded in History.
        </p>

        <dl className="focus-xp-breakdown">
          <div>
            <dt>{summary.durationMinutes} focused minutes</dt>
            <dd>+{formatVisibleXp(summary.focusXp)} XP</dd>
          </div>
          <div>
            <dt>Session completion bonus</dt>
            <dd>+{formatVisibleXp(summary.focusBonusXp)} XP</dd>
          </div>
          {summary.taskBonusXp > 0 && (
            <div>
              <dt>Task completion bonus</dt>
              <dd>+{formatVisibleXp(summary.taskBonusXp)} XP</dd>
            </div>
          )}
          <div className="focus-xp-total">
            <dt>Total gained this session</dt>
            <dd>{formatVisibleXp(summary.totalXp)} XP</dd>
          </div>
        </dl>

        {summary.taskReachedEstimate && !summary.taskCompleted && (
          <div className="focus-summary-task">
            <strong>“{summary.taskTitle}” reached its estimate.</strong>
            <p>
              Task completion stays your choice. Mark it complete now to include
              its one-time bonus in this session total.
            </p>
            <button
              className="button button--primary"
              onClick={() => onCompleteTask(summary.taskId)}
              type="button"
            >
              Mark task complete
            </button>
          </div>
        )}

        {summary.taskCompleted && (
          <p className="focus-summary-task-complete">
            “{summary.taskTitle}” was marked complete
            {summary.taskBonusXp > 0
              ? " and its one-time bonus was included."
              : ". Its one-time bonus had already been awarded."}
          </p>
        )}

        <div className="modal-actions">
          <button
            className="button button--secondary"
            onClick={onClose}
            ref={continueButtonRef}
            type="button"
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
