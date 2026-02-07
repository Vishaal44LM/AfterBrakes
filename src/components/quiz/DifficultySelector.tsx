import { Lock, Check } from 'lucide-react';
import { QuizDifficulty, MEDIUM_UNLOCK, HARD_UNLOCK } from './types';

interface DifficultySelectorProps {
  selected: QuizDifficulty;
  onSelect: (diff: QuizDifficulty) => void;
  isUnlocked: (diff: QuizDifficulty) => boolean;
  playsRemaining: (diff: QuizDifficulty) => number;
  mediumUnlockProgress: { overall: number; questions: number; accuracy: number; streak: number };
  hardUnlockProgress: { overall: number; questions: number; accuracy: number; streak: number; mediumSessions: number };
}

const ProgressRing = ({ progress, size = 52, stroke = 3, children }: {
  progress: number;
  size?: number;
  stroke?: number;
  children: React.ReactNode;
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          opacity={0.3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          opacity={progress > 0 ? 0.8 : 0}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const DifficultySelector = ({
  selected,
  onSelect,
  isUnlocked,
  playsRemaining,
  mediumUnlockProgress,
  hardUnlockProgress,
}: DifficultySelectorProps) => {
  const difficulties: { key: QuizDifficulty; label: string; color: string }[] = [
    { key: 'easy', label: 'Easy', color: 'text-green-400' },
    { key: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { key: 'hard', label: 'Hard', color: 'text-red-400' },
  ];

  const getUnlockHint = (diff: QuizDifficulty): string | null => {
    if (diff === 'medium' && !isUnlocked('medium')) {
      return `${MEDIUM_UNLOCK.minQuestions} Q's · ${MEDIUM_UNLOCK.minAccuracy}% acc · ${MEDIUM_UNLOCK.minStreak} streak`;
    }
    if (diff === 'hard' && !isUnlocked('hard')) {
      return `${HARD_UNLOCK.minQuestions} Q's · ${HARD_UNLOCK.minAccuracy}% acc · ${HARD_UNLOCK.minStreak} streak · ${HARD_UNLOCK.minMediumSessions} med sessions`;
    }
    return null;
  };

  const getProgress = (diff: QuizDifficulty): number => {
    if (diff === 'medium' && !isUnlocked('medium')) return mediumUnlockProgress.overall;
    if (diff === 'hard' && !isUnlocked('hard')) return hardUnlockProgress.overall;
    return 100;
  };

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-center gap-4">
        {difficulties.map(({ key, label, color }) => {
          const unlocked = isUnlocked(key);
          const isSelected = selected === key;
          const remaining = playsRemaining(key);
          const progress = getProgress(key);
          const hint = getUnlockHint(key);

          return (
            <button
              key={key}
              onClick={() => unlocked && onSelect(key)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${
                !unlocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ProgressRing progress={unlocked ? 100 : progress}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected && unlocked
                      ? 'bg-primary/30 border-2 border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]'
                      : unlocked
                      ? 'bg-secondary/50 border border-border/30 hover:border-primary/30'
                      : 'bg-secondary/20 border border-border/20'
                  }`}
                >
                  {!unlocked ? (
                    <Lock className="w-4 h-4 text-muted-foreground animate-pulse-slow" />
                  ) : isSelected ? (
                    <Check className={`w-4 h-4 ${color}`} />
                  ) : (
                    <span className={`text-xs font-bold ${color}`}>
                      {label[0]}
                    </span>
                  )}
                </div>
              </ProgressRing>

              <span className={`text-xs font-medium ${
                isSelected && unlocked ? color : 'text-muted-foreground'
              }`}>
                {label}
              </span>

              {unlocked ? (
                <span className="text-[10px] text-muted-foreground/70">
                  {remaining} left
                </span>
              ) : hint ? (
                <span className="text-[9px] text-muted-foreground/50 max-w-[80px] text-center leading-tight">
                  {Math.round(progress)}% unlocked
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultySelector;
