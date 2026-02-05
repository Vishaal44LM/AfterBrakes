 import { useState, useEffect, useCallback } from 'react';
 import { ArrowLeft, Zap, Trophy, Target, ChevronRight } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 import { QuizQuestion, QuizSession, QUESTIONS_PER_SESSION } from './types';
 import { getRandomQuestions } from './quizData';
 import { useQuizProgress } from '@/hooks/useQuizProgress';
 import QuizCard from './QuizCard';
 import QuizResults from './QuizResults';
 
 interface DriveTimeQuizProps {
   userId: string;
   onBack: () => void;
 }
 
 const DriveTimeQuiz = ({ userId, onBack }: DriveTimeQuizProps) => {
   const { progress, loading, recordAnswer, incrementDailyPlays, canPlay, playsRemaining, accuracy } = useQuizProgress(userId);
   const [session, setSession] = useState<QuizSession | null>(null);
   const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
   const [showFeedback, setShowFeedback] = useState(false);
   const [isCorrect, setIsCorrect] = useState(false);
 
   // Start a new session
   const startSession = useCallback(() => {
     if (!canPlay) return;
 
     const questions = getRandomQuestions(
       QUESTIONS_PER_SESSION,
       progress.unlockedDifficulty,
       progress.answeredQuestionIds
     );
 
     if (questions.length === 0) {
       // Reset if all questions answered
       const allQuestions = getRandomQuestions(QUESTIONS_PER_SESSION, progress.unlockedDifficulty, []);
       setSession({
         questions: allQuestions,
         currentIndex: 0,
         sessionScore: 0,
         sessionCorrect: 0,
         sessionStreak: 0,
         answers: new Array(allQuestions.length).fill(null),
         isComplete: false
       });
     } else {
       setSession({
         questions,
         currentIndex: 0,
         sessionScore: 0,
         sessionCorrect: 0,
         sessionStreak: 0,
         answers: new Array(questions.length).fill(null),
         isComplete: false
       });
     }
 
     incrementDailyPlays();
   }, [canPlay, progress, incrementDailyPlays]);
 
   // Handle answer selection
   const handleAnswer = (answerIndex: number) => {
     if (showFeedback || !session) return;
 
     const currentQuestion = session.questions[session.currentIndex];
     const correct = answerIndex === currentQuestion.correctIndex;
 
     setSelectedAnswer(answerIndex);
     setIsCorrect(correct);
     setShowFeedback(true);
 
     // Record in progress
     recordAnswer(currentQuestion.id, correct);
 
     // Update session
     const newAnswers = [...session.answers];
     newAnswers[session.currentIndex] = answerIndex;
 
     setSession(prev => prev ? {
       ...prev,
       answers: newAnswers,
       sessionCorrect: prev.sessionCorrect + (correct ? 1 : 0),
       sessionScore: prev.sessionScore + (correct ? (10 * (prev.sessionStreak + 1)) : 0),
       sessionStreak: correct ? prev.sessionStreak + 1 : 0
     } : null);
 
     // Auto advance after delay
     setTimeout(() => {
       advanceQuestion();
     }, 1500);
   };
 
   // Skip question
   const skipQuestion = () => {
     if (showFeedback || !session) return;
     
     const newAnswers = [...session.answers];
     newAnswers[session.currentIndex] = -1; // -1 = skipped
 
     setSession(prev => prev ? {
       ...prev,
       answers: newAnswers,
       sessionStreak: 0
     } : null);
 
     advanceQuestion();
   };
 
   // Advance to next question
   const advanceQuestion = () => {
     if (!session) return;
 
     setSelectedAnswer(null);
     setShowFeedback(false);
 
     if (session.currentIndex >= session.questions.length - 1) {
       setSession(prev => prev ? { ...prev, isComplete: true } : null);
     } else {
       setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
     }
   };
 
   // End session and go back
   const handleExit = () => {
     setSession(null);
     onBack();
   };
 
   // Play again
   const handlePlayAgain = () => {
     setSession(null);
     if (canPlay) {
       startSession();
     }
   };
 
   if (loading) {
     return (
       <div className="fixed inset-0 bg-background flex items-center justify-center">
         <div className="animate-pulse text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   // Pre-session screen
   if (!session) {
     return (
       <div className="fixed inset-0 bg-background flex flex-col">
         {/* Header */}
         <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
           <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-secondary/30 -ml-2">
             <ArrowLeft className="w-4 h-4 mr-1" />
             <span className="text-sm">Back</span>
           </Button>
           <span className="text-sm font-medium text-foreground/80">Drive Time Q&A</span>
           <div className="w-16" />
         </div>
 
         {/* Content */}
         <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
           {/* Icon */}
           <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
             <Zap className="w-10 h-10 text-primary" />
           </div>
 
           <h1 className="text-2xl font-bold text-foreground mb-2">Drive Time Q&A</h1>
           <p className="text-muted-foreground mb-8 max-w-xs">
             Test your automotive knowledge in quick, {QUESTIONS_PER_SESSION}-question sessions
           </p>
 
           {/* Stats */}
           <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-xs">
             <div className="bg-card rounded-xl p-3 border border-border/20">
               <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
               <div className="text-lg font-bold text-foreground">{progress.bestStreak}</div>
               <div className="text-xs text-muted-foreground">Best Streak</div>
             </div>
             <div className="bg-card rounded-xl p-3 border border-border/20">
               <Target className="w-5 h-5 text-primary mx-auto mb-1" />
               <div className="text-lg font-bold text-foreground">{accuracy}%</div>
               <div className="text-xs text-muted-foreground">Accuracy</div>
             </div>
             <div className="bg-card rounded-xl p-3 border border-border/20">
               <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
               <div className="text-lg font-bold text-foreground">{progress.totalQuestionsAnswered}</div>
               <div className="text-xs text-muted-foreground">Answered</div>
             </div>
           </div>
 
           {/* Daily plays */}
           <div className="text-sm text-muted-foreground mb-4">
             {canPlay ? (
               <span>{playsRemaining} plays remaining today</span>
             ) : (
               <span className="text-accent">Come back tomorrow for more!</span>
             )}
           </div>
 
           {/* Difficulty badges */}
           <div className="flex gap-2 mb-8">
             {['easy', 'medium', 'hard'].map(diff => (
               <span
                 key={diff}
                 className={`px-3 py-1 rounded-full text-xs font-medium ${
                   progress.unlockedDifficulty.includes(diff)
                     ? 'bg-primary/20 text-primary'
                     : 'bg-secondary/30 text-muted-foreground/50'
                 }`}
               >
                 {diff.charAt(0).toUpperCase() + diff.slice(1)}
                 {!progress.unlockedDifficulty.includes(diff) && ' 🔒'}
               </span>
             ))}
           </div>
 
           {/* Start button */}
           <Button
             onClick={startSession}
             disabled={!canPlay}
             className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground"
             size="lg"
           >
             {canPlay ? 'Start Quiz' : 'No Plays Left'}
             {canPlay && <ChevronRight className="w-5 h-5 ml-1" />}
           </Button>
         </div>
       </div>
     );
   }
 
   // Results screen
   if (session.isComplete) {
     return (
       <QuizResults
         session={session}
         onPlayAgain={handlePlayAgain}
         onExit={handleExit}
         canPlayAgain={canPlay}
       />
     );
   }
 
   // Quiz screen
   const currentQuestion = session.questions[session.currentIndex];
   const progressPercent = ((session.currentIndex + 1) / session.questions.length) * 100;
 
   return (
     <div className="fixed inset-0 bg-background flex flex-col">
       {/* Header with progress */}
       <div className="px-4 pt-4 pb-2">
         <div className="flex items-center justify-between mb-2">
           <span className="text-xs text-muted-foreground">
             {session.currentIndex + 1} / {session.questions.length}
           </span>
           {session.sessionStreak > 0 && (
             <span className="flex items-center gap-1 text-xs text-primary">
               <Zap className="w-3 h-3" />
               {session.sessionStreak} streak
             </span>
           )}
         </div>
         <Progress value={progressPercent} className="h-1.5" />
       </div>
 
       {/* Question area */}
       <div className="flex-1 flex flex-col px-4 py-6">
         <QuizCard
           question={currentQuestion}
           selectedAnswer={selectedAnswer}
           showFeedback={showFeedback}
           isCorrect={isCorrect}
           onAnswer={handleAnswer}
           onSkip={skipQuestion}
         />
       </div>
 
       {/* Score footer */}
       <div className="px-4 py-3 border-t border-border/10">
         <div className="flex items-center justify-between text-sm">
           <span className="text-muted-foreground">Score: <span className="text-foreground font-medium">{session.sessionScore}</span></span>
           <Button variant="ghost" size="sm" onClick={handleExit} className="text-muted-foreground">
             Exit
           </Button>
         </div>
       </div>
     </div>
   );
 };
 
 export default DriveTimeQuiz;