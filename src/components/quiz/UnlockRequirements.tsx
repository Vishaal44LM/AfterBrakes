import { Lock, Check, Zap, Target, MessageSquare } from 'lucide-react';
import { QuizDifficulty, MEDIUM_UNLOCK, HARD_UNLOCK } from './types';

interface UnlockRequirementsProps {
  difficulty: QuizDifficulty;
  mediumProgress: { questions: number; accuracy: number; streak: number };
  hardProgress: { questions: number; accuracy: number; streak: number; mediumSessions: number };
  totalAnswered: number;
  accuracy: number;
  bestStreak: number;
  mediumSessions: number;
}

const ProgressBar = ({ progress, label, current, target }: {
  progress: number;
  label: string;
  current: string;
  target: string;
}) => {
  const isComplete = progress >= 100;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
        isComplete ? 'bg-primary/20' : 'bg-secondary/30'
      }`}>
        {isComplete ? (
          <Check className="w-3 h-3 text-primary" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`text-[10px] tabular-nums ${isComplete ? 'text-primary' : 'text-muted-foreground/60'}`}>
            {current} / {target}
          </span>
        </div>
        <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/60 transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const UnlockRequirements = ({
  difficulty,
  mediumProgress,
  hardProgress,
  totalAnswered,
  accuracy,
  bestStreak,
  mediumSessions,
}: UnlockRequirementsProps) => {
  if (difficulty === 'easy') return null;

  const isMedium = difficulty === 'medium';

  return (
    <div className="w-full max-w-xs bg-secondary/10 rounded-2xl p-4 border border-border/10 animate-fade-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Unlock {isMedium ? 'Medium' : 'Hard'} Difficulty
        </span>
      </div>

      <div className="space-y-3">
        <ProgressBar
          progress={isMedium ? mediumProgress.questions : hardProgress.questions}
          label="Questions answered"
          current={`${totalAnswered}`}
          target={`${isMedium ? MEDIUM_UNLOCK.minQuestions : HARD_UNLOCK.minQuestions}`}
        />
        <ProgressBar
          progress={isMedium ? mediumProgress.accuracy : hardProgress.accuracy}
          label="Overall accuracy"
          current={`${accuracy}%`}
          target={`${isMedium ? MEDIUM_UNLOCK.minAccuracy : HARD_UNLOCK.minAccuracy}%`}
        />
        <ProgressBar
          progress={isMedium ? mediumProgress.streak : hardProgress.streak}
          label="Best streak"
          current={`${bestStreak}`}
          target={`${isMedium ? MEDIUM_UNLOCK.minStreak : HARD_UNLOCK.minStreak}`}
        />
        {!isMedium && (
          <ProgressBar
            progress={hardProgress.mediumSessions}
            label="Medium sessions"
            current={`${mediumSessions}`}
            target={`${HARD_UNLOCK.minMediumSessions}`}
          />
        )}
      </div>
    </div>
  );
};

export default UnlockRequirements;
