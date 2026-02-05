 import { Trophy, Target, Zap, RotateCcw, Home } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { QuizSession } from './types';
 
 interface QuizResultsProps {
   session: QuizSession;
   onPlayAgain: () => void;
   onExit: () => void;
   canPlayAgain: boolean;
 }
 
 const QuizResults = ({ session, onPlayAgain, onExit, canPlayAgain }: QuizResultsProps) => {
   const accuracy = Math.round((session.sessionCorrect / session.questions.length) * 100);
   const skipped = session.answers.filter(a => a === -1).length;
 
   // Determine message based on performance
   const getMessage = () => {
     if (accuracy >= 80) return { emoji: '🏆', text: 'Outstanding!' };
     if (accuracy >= 60) return { emoji: '🎉', text: 'Great job!' };
     if (accuracy >= 40) return { emoji: '👍', text: 'Nice effort!' };
     return { emoji: '💪', text: 'Keep practicing!' };
   };
 
   const message = getMessage();
 
   return (
     <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
       {/* Result icon */}
       <div className="text-6xl mb-4 animate-scale-in">{message.emoji}</div>
       <h1 className="text-2xl font-bold text-foreground mb-2">{message.text}</h1>
       <p className="text-muted-foreground mb-8">Session complete</p>
 
       {/* Stats cards */}
       <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
         <div className="bg-card rounded-xl p-4 border border-border/20 text-center">
           <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
           <div className="text-2xl font-bold text-foreground">{session.sessionScore}</div>
           <div className="text-xs text-muted-foreground">Score</div>
         </div>
         <div className="bg-card rounded-xl p-4 border border-border/20 text-center">
           <Target className="w-6 h-6 text-primary mx-auto mb-2" />
           <div className="text-2xl font-bold text-foreground">{accuracy}%</div>
           <div className="text-xs text-muted-foreground">Accuracy</div>
         </div>
         <div className="bg-card rounded-xl p-4 border border-border/20 text-center">
           <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
           <div className="text-2xl font-bold text-foreground">{session.sessionCorrect}/{session.questions.length}</div>
           <div className="text-xs text-muted-foreground">Correct</div>
         </div>
       </div>
 
       {/* Details */}
       <div className="text-sm text-muted-foreground mb-8 text-center">
         {skipped > 0 && <p>{skipped} question{skipped > 1 ? 's' : ''} skipped</p>}
         {session.sessionStreak > 0 && <p>Best streak this session: {session.sessionStreak}</p>}
       </div>
 
       {/* Actions */}
       <div className="flex flex-col gap-3 w-full max-w-xs">
         <Button
           onClick={onPlayAgain}
           disabled={!canPlayAgain}
           className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
           size="lg"
         >
           <RotateCcw className="w-4 h-4 mr-2" />
           {canPlayAgain ? 'Play Again' : 'No Plays Left'}
         </Button>
         <Button
           variant="outline"
           onClick={onExit}
           className="w-full"
           size="lg"
         >
           <Home className="w-4 h-4 mr-2" />
           Back to Home
         </Button>
       </div>
     </div>
   );
 };
 
 export default QuizResults;