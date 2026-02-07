import { useState, useCallback } from 'react';
import { ArrowLeft, Zap, Trophy, Target, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuizDifficulty, QuizSession, QUESTIONS_PER_SESSION } from './types';
import { getSmartQuestions } from './quizData';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import QuizCard from './QuizCard';
import QuizResults from './QuizResults';
import DifficultySelector from './DifficultySelector';
import AnimatedNumber from './AnimatedNumber';
import CountdownTimer from './CountdownTimer';
import UnlockRequirements from './UnlockRequirements';

interface DriveTimeQuizProps {
  userId: string;
  onBack: () => void;
}

const DriveTimeQuiz = ({ userId, onBack }: DriveTimeQuizProps) => {
  const {
    progress, loading, recordAnswer, incrementDailyPlays,
    completeMediumSession, canPlayDifficulty, playsRemainingForDifficulty,
    isDifficultyUnlocked, overallAccuracy, difficultyAccuracy,
    mediumUnlockProgress, hardUnlockProgress,
  } = useQuizProgress(userId);

  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty>('easy');
  const [session, setSession] = useState<QuizSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Sync selected difficulty to highest unlocked
  const effectiveDifficulty = isDifficultyUnlocked(selectedDifficulty)
    ? selectedDifficulty
    : 'easy';

  const canPlay = canPlayDifficulty(effectiveDifficulty);
  const playsRemaining = playsRemainingForDifficulty(effectiveDifficulty);

  const startSession = useCallback(() => {
    if (!canPlay) return;

    const todayIds = progress.answeredQuestionIds.slice(-15);
    const questions = getSmartQuestions(
      QUESTIONS_PER_SESSION,
      effectiveDifficulty,
      progress.recentlySeenIds,
      todayIds,
      progress.topicAccuracy,
      0
    );

    if (questions.length === 0) return;

    setSession({
      questions,
      currentIndex: 0,
      sessionScore: 0,
      sessionCorrect: 0,
      sessionStreak: 0,
      answers: new Array(questions.length).fill(null),
      isComplete: false,
      difficulty: effectiveDifficulty,
      complexityBias: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
    });

    incrementDailyPlays(effectiveDifficulty);
  }, [canPlay, effectiveDifficulty, progress, incrementDailyPlays]);

  const handleAnswer = (answerIndex: number) => {
    if (showFeedback || !session) return;

    const currentQuestion = session.questions[session.currentIndex];
    const correct = answerIndex === currentQuestion.correctIndex;

    setSelectedAnswer(answerIndex);
    setIsCorrect(correct);
    setShowFeedback(true);

    recordAnswer(currentQuestion.id, correct, session.difficulty, currentQuestion.category);

    const newConsecutiveCorrect = correct ? session.consecutiveCorrect + 1 : 0;
    const newConsecutiveWrong = correct ? 0 : session.consecutiveWrong + 1;

    // Adaptive difficulty: silently adjust complexity bias
    let newBias = session.complexityBias;
    if (newConsecutiveCorrect >= 3) newBias = Math.min(1, newBias + 0.3);
    if (newConsecutiveWrong >= 2) newBias = Math.max(-1, newBias - 0.3);

    const newAnswers = [...session.answers];
    newAnswers[session.currentIndex] = answerIndex;

    setSession(prev => prev ? {
      ...prev,
      answers: newAnswers,
      sessionCorrect: prev.sessionCorrect + (correct ? 1 : 0),
      sessionScore: prev.sessionScore + (correct ? (10 * (prev.sessionStreak + 1)) : 0),
      sessionStreak: correct ? prev.sessionStreak + 1 : 0,
      complexityBias: newBias,
      consecutiveCorrect: newConsecutiveCorrect,
      consecutiveWrong: newConsecutiveWrong,
    } : null);

    setTimeout(() => advanceQuestion(), 1500);
  };

  const skipQuestion = () => {
    if (showFeedback || !session) return;
    const newAnswers = [...session.answers];
    newAnswers[session.currentIndex] = -1;

    setSession(prev => prev ? {
      ...prev,
      answers: newAnswers,
      sessionStreak: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: prev.consecutiveWrong + 1,
      complexityBias: Math.max(-1, prev.complexityBias - 0.15),
    } : null);

    advanceQuestion();
  };

  const advanceQuestion = () => {
    if (!session) return;

    setSelectedAnswer(null);
    setShowFeedback(false);

    if (session.currentIndex >= session.questions.length - 1) {
      setSession(prev => {
        if (!prev) return null;
        // Mark medium session complete
        if (prev.difficulty === 'medium') completeMediumSession();
        return { ...prev, isComplete: true };
      });
    } else {
      setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
    }
  };

  const handleExit = () => { setSession(null); onBack(); };
  const handlePlayAgain = () => { setSession(null); if (canPlay) startSession(); };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Pre-session screen
  if (!session) {
    const accuracyColor = overallAccuracy >= 80
      ? 'border-green-500/20 bg-green-500/5'
      : overallAccuracy >= 50
      ? 'border-yellow-500/20 bg-yellow-500/5'
      : 'border-border/20 bg-card';

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
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-auto py-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-fade-slide-up">
            <Zap className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Drive Time Q&A</h1>
          <p className="text-muted-foreground mb-6 max-w-xs text-sm">
            Test your automotive knowledge in quick {QUESTIONS_PER_SESSION}-question sessions
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs">
            <div className="bg-card rounded-xl p-3 border border-border/20">
              <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
              <AnimatedNumber value={progress.bestStreak} className="text-lg font-bold text-foreground block" />
              <div className="text-[10px] text-muted-foreground">Best Streak</div>
            </div>
            <div className={`rounded-xl p-3 border transition-colors duration-500 ${accuracyColor}`}>
              <Target className="w-5 h-5 text-primary mx-auto mb-1" />
              <AnimatedNumber value={overallAccuracy} suffix="%" className="text-lg font-bold text-foreground block" />
              <div className="text-[10px] text-muted-foreground">Accuracy</div>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border/20">
              <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
              <AnimatedNumber value={progress.totalQuestionsAnswered} className="text-lg font-bold text-foreground block" />
              <div className="text-[10px] text-muted-foreground">Answered</div>
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="mb-6">
            <DifficultySelector
              selected={selectedDifficulty}
              onSelect={setSelectedDifficulty}
              isUnlocked={isDifficultyUnlocked}
              playsRemaining={playsRemainingForDifficulty}
              mediumUnlockProgress={mediumUnlockProgress}
              hardUnlockProgress={hardUnlockProgress}
            />
          </div>

          {/* Unlock requirements for locked difficulty */}
          {!isDifficultyUnlocked(selectedDifficulty) && (
            <div className="mb-6">
              <UnlockRequirements
                difficulty={selectedDifficulty}
                mediumProgress={mediumUnlockProgress}
                hardProgress={hardUnlockProgress}
                totalAnswered={progress.totalQuestionsAnswered}
                accuracy={overallAccuracy}
                bestStreak={progress.bestStreak}
                mediumSessions={progress.mediumSessionsCompleted}
              />
            </div>
          )}

          {/* Daily plays / countdown */}
          <div className="mb-6">
            {canPlay ? (
              <span className="text-sm text-muted-foreground">
                {playsRemaining} {effectiveDifficulty} plays remaining today
              </span>
            ) : (
              <CountdownTimer />
            )}
          </div>

          {/* CTA */}
          <Button
            onClick={startSession}
            disabled={!canPlay || !isDifficultyUnlocked(selectedDifficulty)}
            className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40"
            size="lg"
          >
            {!isDifficultyUnlocked(selectedDifficulty)
              ? `Unlock ${selectedDifficulty} first`
              : canPlay
              ? 'Start Quiz'
              : 'No Plays Left'}
            {canPlay && isDifficultyUnlocked(selectedDifficulty) && <ChevronRight className="w-5 h-5 ml-1" />}
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

  // Active quiz screen
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
          <span className="text-muted-foreground">
            Score: <span className="text-foreground font-medium">{session.sessionScore}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={handleExit} className="text-muted-foreground">
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriveTimeQuiz;
