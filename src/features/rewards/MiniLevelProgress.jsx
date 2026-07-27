import { formatVisibleXp } from "../../domain/formatters.js";
import { getLevelProgress } from "../../domain/rewards.js";

export function MiniLevelProgress({ rewards }) {
  const levelProgress = getLevelProgress(rewards.totalXp);
  const visibleXpIntoLevel = formatVisibleXp(levelProgress.xpIntoLevel);

  return (
    <div
      aria-label={`Level ${levelProgress.level}: ${visibleXpIntoLevel} of ${levelProgress.xpForNextLevel} XP`}
      className="mini-level-progress"
    >
      <div className="mini-level-copy">
        <strong>Level {levelProgress.level}</strong>
        <span>
          {visibleXpIntoLevel}/{levelProgress.xpForNextLevel} XP
        </span>
      </div>
      <div
        aria-hidden="true"
        className="mini-level-track"
      >
        <span
          style={{ "--mini-level-progress": `${levelProgress.progressPercent}%` }}
        />
      </div>
    </div>
  );
}
