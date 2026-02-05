 export interface QuizQuestion {
   id: string;
   question: string;
   answers: string[];
   correctIndex: number;
   category: 'general' | 'motorsport' | 'tech' | 'road-rules' | 'brand-history';
   difficulty: 'easy' | 'medium' | 'hard';
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
 }
 
 export interface QuizSession {
   questions: QuizQuestion[];
   currentIndex: number;
   sessionScore: number;
   sessionCorrect: number;
   sessionStreak: number;
   answers: (number | null)[];
   isComplete: boolean;
 }
 
 export const QUESTIONS_PER_SESSION = 5;
 export const MAX_DAILY_PLAYS = 3;