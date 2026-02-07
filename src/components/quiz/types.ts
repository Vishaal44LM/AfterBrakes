export type QuizCategory = 'general' | 'motorsport' | 'tech' | 'road-rules' | 'brand-history' | 'safety';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  category: QuizCategory;
  difficulty: QuizDifficulty;
  /** Internal complexity tier within a difficulty (1=easiest, 3=hardest) */
  complexity?: 1 | 2 | 3;
}

export interface TopicAccuracy {
  [topic: string]: { answered: number; correct: number };
}

export interface QuizProgress {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: string | null;
  dailyPlaysToday: number;
  dailyResetDate: string;
  unlockedDifficulty: string[];
  answeredQuestionIds: string[];
  // Per-difficulty stats
  easyAnswered: number;
  easyCorrect: number;
  mediumAnswered: number;
  mediumCorrect: number;
  hardAnswered: number;
  hardCorrect: number;
  mediumSessionsCompleted: number;
  // Topic accuracy
  topicAccuracy: TopicAccuracy;
  // Anti-repetition
  recentlySeenIds: string[];
  // Unlock timestamps
  mediumUnlockedAt: string | null;
  hardUnlockedAt: string | null;
  // Per-difficulty daily limits
  lastSessionDate: string | null;
  dailyEasyPlays: number;
  dailyMediumPlays: number;
  dailyHardPlays: number;
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  sessionScore: number;
  sessionCorrect: number;
  sessionStreak: number;
  answers: (number | null)[];
  isComplete: boolean;
  difficulty: QuizDifficulty;
  /** Adaptive complexity bias: shifts up/down silently */
  complexityBias: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

export const QUESTIONS_PER_SESSION = 5;
export const MAX_DAILY_PLAYS_PER_DIFFICULTY = 3;

// Unlock conditions
export const MEDIUM_UNLOCK = {
  minQuestions: 20,
  minAccuracy: 65,
  minStreak: 5,
};

export const HARD_UNLOCK = {
  minQuestions: 60,
  minAccuracy: 80,
  minStreak: 10,
  minMediumSessions: 5,
};
