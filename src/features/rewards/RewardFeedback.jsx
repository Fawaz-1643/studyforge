export function RewardNotice({ notice, onClose, onPauseChange }) {
  if (!notice) {
    return null;
  }

  return (
    <aside
      aria-atomic="true"
      aria-live="polite"
      className="reward-notice"
      onBlur={() => onPauseChange(false)}
      onFocus={() => onPauseChange(true)}
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
      role="status"
    >
      <div className="reward-notice-mark" aria-hidden="true">
        {notice.levelUp ? "↑" : "★"}
      </div>
      <div>
        <p>{notice.levelUp ? "Level up" : "Achievement earned"}</p>
        <strong>{notice.title}</strong>
        <span>{notice.message}</span>
      </div>
      <button aria-label="Dismiss reward message" onClick={onClose} type="button">
        ×
      </button>
    </aside>
  );
}

export function TaskCompletionNotice({ notice, onClose, onDelete }) {
  if (!notice) {
    return null;
  }

  return (
    <aside
      aria-atomic="true"
      aria-live="polite"
      className="task-completion-notice"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      role="status"
    >
      <div>
        <p>Task complete</p>
        <strong>Nice work on “{notice.task.title}”.</strong>
        <span>
          {notice.bonusXp
            ? `You earned ${notice.bonusXp} bonus XP.`
            : "This task’s one-time XP bonus was already awarded."}
        </span>
      </div>
      <div className="task-completion-notice-actions">
        <button className="text-button" onClick={onClose} type="button">
          Keep task
        </button>
        <button className="text-button text-button--danger" onClick={onDelete} type="button">
          Delete task
        </button>
      </div>
    </aside>
  );
}
