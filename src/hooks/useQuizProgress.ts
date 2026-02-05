 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { QuizProgress, QUESTIONS_PER_SESSION, MAX_DAILY_PLAYS } from '@/components/quiz/types';
 
 const defaultProgress: QuizProgress = {
   totalQuestionsAnswered: 0,
   correctAnswers: 0,
   currentStreak: 0,
   bestStreak: 0,
   lastPlayedAt: null,
   dailyPlaysToday: 0,
   dailyResetDate: new Date().toISOString().split('T')[0],
   unlockedDifficulty: ['easy'],
   answeredQuestionIds: []
 };
 
 export const useQuizProgress = (userId: string | undefined) => {
   const [progress, setProgress] = useState<QuizProgress>(defaultProgress);
   const [loading, setLoading] = useState(true);
 
   // Fetch progress
   const fetchProgress = useCallback(async () => {
     if (!userId) {
       setLoading(false);
       return;
     }
 
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
           answeredQuestionIds: data.answered_question_ids || []
         });
 
         // Reset daily plays if new day
         if (needsReset) {
           await supabase
             .from('quiz_progress')
             .update({ 
               daily_plays_today: 0, 
               daily_reset_date: today 
             })
             .eq('user_id', userId);
         }
       }
     } catch (error) {
       console.error('Error fetching quiz progress:', error);
     } finally {
       setLoading(false);
     }
   }, [userId]);
 
   useEffect(() => {
     fetchProgress();
   }, [fetchProgress]);
 
   // Save progress
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
 
       const dbData = {
         user_id: userId,
         total_questions_answered: newProgress.totalQuestionsAnswered,
         correct_answers: newProgress.correctAnswers,
         current_streak: newProgress.currentStreak,
         best_streak: newProgress.bestStreak,
         last_played_at: new Date().toISOString(),
         daily_plays_today: newProgress.dailyPlaysToday,
         daily_reset_date: newProgress.dailyResetDate,
         unlocked_difficulty: newProgress.unlockedDifficulty,
         answered_question_ids: newProgress.answeredQuestionIds
       };
 
       if (existing) {
         await supabase
           .from('quiz_progress')
           .update(dbData)
           .eq('user_id', userId);
       } else {
         await supabase
           .from('quiz_progress')
           .insert(dbData);
       }
     } catch (error) {
       console.error('Error saving quiz progress:', error);
     }
   }, [userId, progress]);
 
   // Record answer
   const recordAnswer = useCallback((questionId: string, isCorrect: boolean) => {
     const newStreak = isCorrect ? progress.currentStreak + 1 : 0;
     const newBestStreak = Math.max(progress.bestStreak, newStreak);
     
     // Unlock medium at 70% accuracy with 10+ questions
     // Unlock hard at 80% accuracy with 20+ questions
     const newTotal = progress.totalQuestionsAnswered + 1;
     const newCorrect = progress.correctAnswers + (isCorrect ? 1 : 0);
     const accuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;
     
     let newDifficulties = [...progress.unlockedDifficulty];
     if (!newDifficulties.includes('medium') && newTotal >= 10 && accuracy >= 70) {
       newDifficulties.push('medium');
     }
     if (!newDifficulties.includes('hard') && newTotal >= 20 && accuracy >= 80) {
       newDifficulties.push('hard');
     }
 
     const newAnsweredIds = [...progress.answeredQuestionIds];
     if (!newAnsweredIds.includes(questionId)) {
       newAnsweredIds.push(questionId);
       // Keep only last 20 to allow repeats eventually
       if (newAnsweredIds.length > 20) {
         newAnsweredIds.shift();
       }
     }
 
     saveProgress({
       totalQuestionsAnswered: newTotal,
       correctAnswers: newCorrect,
       currentStreak: newStreak,
       bestStreak: newBestStreak,
       unlockedDifficulty: newDifficulties,
       answeredQuestionIds: newAnsweredIds
     });
   }, [progress, saveProgress]);
 
   // Increment daily plays
   const incrementDailyPlays = useCallback(() => {
     saveProgress({
       dailyPlaysToday: progress.dailyPlaysToday + 1
     });
   }, [progress.dailyPlaysToday, saveProgress]);
 
   // Check if can play
   const canPlay = progress.dailyPlaysToday < MAX_DAILY_PLAYS;
   const playsRemaining = MAX_DAILY_PLAYS - progress.dailyPlaysToday;
   const accuracy = progress.totalQuestionsAnswered > 0 
     ? Math.round((progress.correctAnswers / progress.totalQuestionsAnswered) * 100) 
     : 0;
 
   return {
     progress,
     loading,
     recordAnswer,
     incrementDailyPlays,
     canPlay,
     playsRemaining,
     accuracy,
     refresh: fetchProgress
   };
 };