import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  QuizProgress,
  QuizDifficulty,
  TopicAccuracy,
  QUESTIONS_PER_SESSION,
  MAX_DAILY_PLAYS_PER_DIFFICULTY,
  MEDIUM_UNLOCK,
  HARD_UNLOCK,
} from '@/components/quiz/types';

const defaultProgress: QuizProgress = {
  totalQuestionsAnswered: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedAt: null,
  dailyPlaysToday: 0,
  dailyResetDate: new Date().toISOString().split('T')[0],
  unlockedDifficulty: ['easy'],
  answeredQuestionIds: [],
  easyAnswered: 0,
  easyCorrect: 0,
  mediumAnswered: 0,
  mediumCorrect: 0,
  hardAnswered: 0,
  hardCorrect: 0,
  mediumSessionsCompleted: 0,
  topicAccuracy: {},
  recentlySeenIds: [],
  mediumUnlockedAt: null,
  hardUnlockedAt: null,
  lastSessionDate: null,
  dailyEasyPlays: 0,
  dailyMediumPlays: 0,
  dailyHardPlays: 0,
};

export const useQuizProgress = (userId: string | undefined) => {
  const [progress, setProgress] = useState<QuizProgress>(defaultProgress);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    try {
      const { data, error } = await supabase
        .from('quiz_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const needsReset = data.daily_reset_date !== today;

        setProgress({
          totalQuestionsAnswered: data.total_questions_answered,
          correctAnswers: data.correct_answers,
          currentStreak: data.current_streak,
          bestStreak: data.best_streak,
          lastPlayedAt: data.last_played_at,
          dailyPlaysToday: needsReset ? 0 : data.daily_plays_today,
          dailyResetDate: today,
          unlockedDifficulty: data.unlocked_difficulty || ['easy'],
          answeredQuestionIds: data.answered_question_ids || [],
          easyAnswered: (data as any).easy_answered ?? 0,
          easyCorrect: (data as any).easy_correct ?? 0,
          mediumAnswered: (data as any).medium_answered ?? 0,
          mediumCorrect: (data as any).medium_correct ?? 0,
          hardAnswered: (data as any).hard_answered ?? 0,
          hardCorrect: (data as any).hard_correct ?? 0,
          mediumSessionsCompleted: (data as any).medium_sessions_completed ?? 0,
          topicAccuracy: (data as any).topic_accuracy ?? {},
          recentlySeenIds: (data as any).recently_seen_ids ?? [],
          mediumUnlockedAt: (data as any).medium_unlocked_at ?? null,
          hardUnlockedAt: (data as any).hard_unlocked_at ?? null,
          lastSessionDate: (data as any).last_session_date ?? null,
          dailyEasyPlays: needsReset ? 0 : ((data as any).daily_easy_plays ?? 0),
          dailyMediumPlays: needsReset ? 0 : ((data as any).daily_medium_plays ?? 0),
          dailyHardPlays: needsReset ? 0 : ((data as any).daily_hard_plays ?? 0),
        });

        if (needsReset) {
          await supabase
            .from('quiz_progress')
            .update({
              daily_plays_today: 0,
              daily_reset_date: today,
              daily_easy_plays: 0,
              daily_medium_plays: 0,
              daily_hard_plays: 0,
            } as any)
            .eq('user_id', userId);
        }
      }
    } catch (error) {
      console.error('Error fetching quiz progress:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const saveProgress = useCallback(async (updates: Partial<QuizProgress>) => {
    if (!userId) return;

    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);

    try {
      const { data: existing } = await supabase
        .from('quiz_progress')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const dbData: any = {
        user_id: userId,
        total_questions_answered: newProgress.totalQuestionsAnswered,
        correct_answers: newProgress.correctAnswers,
        current_streak: newProgress.currentStreak,
        best_streak: newProgress.bestStreak,
        last_played_at: new Date().toISOString(),
        daily_plays_today: newProgress.dailyPlaysToday,
        daily_reset_date: newProgress.dailyResetDate,
        unlocked_difficulty: newProgress.unlockedDifficulty,
        answered_question_ids: newProgress.answeredQuestionIds,
        easy_answered: newProgress.easyAnswered,
        easy_correct: newProgress.easyCorrect,
        medium_answered: newProgress.mediumAnswered,
        medium_correct: newProgress.mediumCorrect,
        hard_answered: newProgress.hardAnswered,
        hard_correct: newProgress.hardCorrect,
        medium_sessions_completed: newProgress.mediumSessionsCompleted,
        topic_accuracy: newProgress.topicAccuracy,
        recently_seen_ids: newProgress.recentlySeenIds,
        medium_unlocked_at: newProgress.mediumUnlockedAt,
        hard_unlocked_at: newProgress.hardUnlockedAt,
        last_session_date: newProgress.lastSessionDate,
        daily_easy_plays: newProgress.dailyEasyPlays,
        daily_medium_plays: newProgress.dailyMediumPlays,
        daily_hard_plays: newProgress.dailyHardPlays,
      };

      if (existing) {
        await supabase.from('quiz_progress').update(dbData).eq('user_id', userId);
      } else {
        await supabase.from('quiz_progress').insert(dbData);
      }
    } catch (error) {
      console.error('Error saving quiz progress:', error);
    }
  }, [userId, progress]);

  const recordAnswer = useCallback((
    questionId: string,
    isCorrect: boolean,
    difficulty: QuizDifficulty,
    category: string
  ) => {
    const newStreak = isCorrect ? progress.currentStreak + 1 : 0;
    const newBestStreak = Math.max(progress.bestStreak, newStreak);
    const newTotal = progress.totalQuestionsAnswered + 1;
    const newCorrect = progress.correctAnswers + (isCorrect ? 1 : 0);

    // Per-difficulty stats
    const diffKey = difficulty;
    const newDiffAnswered = progress[`${diffKey}Answered` as keyof QuizProgress] as number + 1;
    const newDiffCorrect = (progress[`${diffKey}Correct` as keyof QuizProgress] as number) + (isCorrect ? 1 : 0);

    // Topic accuracy
    const newTopicAccuracy = { ...progress.topicAccuracy };
    if (!newTopicAccuracy[category]) {
      newTopicAccuracy[category] = { answered: 0, correct: 0 };
    }
    newTopicAccuracy[category] = {
      answered: newTopicAccuracy[category].answered + 1,
      correct: newTopicAccuracy[category].correct + (isCorrect ? 1 : 0),
    };

    // Unlock logic
    const accuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;
    let newDifficulties = [...progress.unlockedDifficulty];
    let medUnlocked = progress.mediumUnlockedAt;
    let hardUnlocked = progress.hardUnlockedAt;

    if (
      !newDifficulties.includes('medium') &&
      newTotal >= MEDIUM_UNLOCK.minQuestions &&
      accuracy >= MEDIUM_UNLOCK.minAccuracy &&
      newBestStreak >= MEDIUM_UNLOCK.minStreak
    ) {
      newDifficulties.push('medium');
      medUnlocked = new Date().toISOString();
    }

    if (
      !newDifficulties.includes('hard') &&
      newTotal >= HARD_UNLOCK.minQuestions &&
      accuracy >= HARD_UNLOCK.minAccuracy &&
      newBestStreak >= HARD_UNLOCK.minStreak &&
      progress.mediumSessionsCompleted >= HARD_UNLOCK.minMediumSessions
    ) {
      newDifficulties.push('hard');
      hardUnlocked = new Date().toISOString();
    }

    // Recently seen (last 3 sessions × 5 = 15 IDs)
    const newRecentlySeen = [...progress.recentlySeenIds, questionId];
    if (newRecentlySeen.length > 15) newRecentlySeen.splice(0, newRecentlySeen.length - 15);

    // Answered IDs (keep last 30)
    const newAnsweredIds = [...progress.answeredQuestionIds];
    if (!newAnsweredIds.includes(questionId)) {
      newAnsweredIds.push(questionId);
      if (newAnsweredIds.length > 30) newAnsweredIds.shift();
    }

    saveProgress({
      totalQuestionsAnswered: newTotal,
      correctAnswers: newCorrect,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      unlockedDifficulty: newDifficulties,
      answeredQuestionIds: newAnsweredIds,
      [`${diffKey}Answered`]: newDiffAnswered,
      [`${diffKey}Correct`]: newDiffCorrect,
      topicAccuracy: newTopicAccuracy,
      recentlySeenIds: newRecentlySeen,
      mediumUnlockedAt: medUnlocked,
      hardUnlockedAt: hardUnlocked,
    } as any);
  }, [progress, saveProgress]);

  const incrementDailyPlays = useCallback((difficulty: QuizDifficulty) => {
    const keyMap: Record<QuizDifficulty, keyof QuizProgress> = {
      easy: 'dailyEasyPlays',
      medium: 'dailyMediumPlays',
      hard: 'dailyHardPlays',
    };
    const key = keyMap[difficulty];
    saveProgress({
      dailyPlaysToday: progress.dailyPlaysToday + 1,
      [key]: (progress[key] as number) + 1,
    } as any);
  }, [progress, saveProgress]);

  const completeMediumSession = useCallback(() => {
    saveProgress({
      mediumSessionsCompleted: progress.mediumSessionsCompleted + 1,
    });
  }, [progress, saveProgress]);

  // Derived state
  const canPlayDifficulty = useCallback((diff: QuizDifficulty): boolean => {
    const keyMap: Record<QuizDifficulty, keyof QuizProgress> = {
      easy: 'dailyEasyPlays',
      medium: 'dailyMediumPlays',
      hard: 'dailyHardPlays',
    };
    return (progress[keyMap[diff]] as number) < MAX_DAILY_PLAYS_PER_DIFFICULTY;
  }, [progress]);

  const playsRemainingForDifficulty = useCallback((diff: QuizDifficulty): number => {
    const keyMap: Record<QuizDifficulty, keyof QuizProgress> = {
      easy: 'dailyEasyPlays',
      medium: 'dailyMediumPlays',
      hard: 'dailyHardPlays',
    };
    return MAX_DAILY_PLAYS_PER_DIFFICULTY - (progress[keyMap[diff]] as number);
  }, [progress]);

  const isDifficultyUnlocked = useCallback((diff: QuizDifficulty): boolean => {
    return progress.unlockedDifficulty.includes(diff);
  }, [progress]);

  const overallAccuracy = useMemo(() => {
    return progress.totalQuestionsAnswered > 0
      ? Math.round((progress.correctAnswers / progress.totalQuestionsAnswered) * 100)
      : 0;
  }, [progress.correctAnswers, progress.totalQuestionsAnswered]);

  const difficultyAccuracy = useCallback((diff: QuizDifficulty): number => {
    const answered = progress[`${diff}Answered` as keyof QuizProgress] as number;
    const correct = progress[`${diff}Correct` as keyof QuizProgress] as number;
    return answered > 0 ? Math.round((correct / answered) * 100) : 0;
  }, [progress]);

  // Unlock progress percentages
  const mediumUnlockProgress = useMemo(() => ({
    questions: Math.min(100, (progress.totalQuestionsAnswered / MEDIUM_UNLOCK.minQuestions) * 100),
    accuracy: Math.min(100, (overallAccuracy / MEDIUM_UNLOCK.minAccuracy) * 100),
    streak: Math.min(100, (progress.bestStreak / MEDIUM_UNLOCK.minStreak) * 100),
    overall: Math.min(100, (
      Math.min(100, (progress.totalQuestionsAnswered / MEDIUM_UNLOCK.minQuestions) * 100) +
      Math.min(100, (overallAccuracy / MEDIUM_UNLOCK.minAccuracy) * 100) +
      Math.min(100, (progress.bestStreak / MEDIUM_UNLOCK.minStreak) * 100)
    ) / 3),
  }), [progress.totalQuestionsAnswered, overallAccuracy, progress.bestStreak]);

  const hardUnlockProgress = useMemo(() => ({
    questions: Math.min(100, (progress.totalQuestionsAnswered / HARD_UNLOCK.minQuestions) * 100),
    accuracy: Math.min(100, (overallAccuracy / HARD_UNLOCK.minAccuracy) * 100),
    streak: Math.min(100, (progress.bestStreak / HARD_UNLOCK.minStreak) * 100),
    mediumSessions: Math.min(100, (progress.mediumSessionsCompleted / HARD_UNLOCK.minMediumSessions) * 100),
    overall: Math.min(100, (
      Math.min(100, (progress.totalQuestionsAnswered / HARD_UNLOCK.minQuestions) * 100) +
      Math.min(100, (overallAccuracy / HARD_UNLOCK.minAccuracy) * 100) +
      Math.min(100, (progress.bestStreak / HARD_UNLOCK.minStreak) * 100) +
      Math.min(100, (progress.mediumSessionsCompleted / HARD_UNLOCK.minMediumSessions) * 100)
    ) / 4),
  }), [progress.totalQuestionsAnswered, overallAccuracy, progress.bestStreak, progress.mediumSessionsCompleted]);

  return {
    progress,
    loading,
    recordAnswer,
    incrementDailyPlays,
    completeMediumSession,
    canPlayDifficulty,
    playsRemainingForDifficulty,
    isDifficultyUnlocked,
    overallAccuracy,
    difficultyAccuracy,
    mediumUnlockProgress,
    hardUnlockProgress,
    refresh: fetchProgress,
  };
};
