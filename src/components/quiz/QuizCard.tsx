 import { QuizQuestion } from './types';
 import { Check, X, SkipForward } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 interface QuizCardProps {
   question: QuizQuestion;
   selectedAnswer: number | null;
   showFeedback: boolean;
   isCorrect: boolean;
   onAnswer: (index: number) => void;
   onSkip: () => void;
 }
 
 const QuizCard = ({
   question,
   selectedAnswer,
   showFeedback,
   isCorrect,
   onAnswer,
   onSkip
 }: QuizCardProps) => {
   return (
     <div className="flex flex-col h-full">
       {/* Difficulty badge */}
       <div className="flex justify-center mb-4">
         <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-medium ${
           question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
           question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
           'bg-red-500/20 text-red-400'
         }`}>
           {question.difficulty}
         </span>
       </div>
 
       {/* Question */}
       <div className="flex-1 flex items-center justify-center px-2 mb-6">
         <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center leading-tight">
           {question.question}
         </h2>
       </div>
 
       {/* Answers */}
       <div className="space-y-3">
         {question.answers.map((answer, idx) => {
           const isSelected = selectedAnswer === idx;
           const isCorrectAnswer = idx === question.correctIndex;
           
           let cardStyle = 'bg-card border-border/30 hover:border-primary/40 hover:bg-primary/5';
           
           if (showFeedback) {
             if (isCorrectAnswer) {
               cardStyle = 'bg-green-500/10 border-green-500/50';
             } else if (isSelected && !isCorrectAnswer) {
               cardStyle = 'bg-red-500/10 border-red-500/50 animate-shake';
             } else {
               cardStyle = 'bg-card/50 border-border/10 opacity-50';
             }
           }
 
           return (
             <button
               key={idx}
               onClick={() => onAnswer(idx)}
               disabled={showFeedback}
               className={`w-full p-4 rounded-xl border text-left transition-all ${cardStyle}`}
             >
               <div className="flex items-center justify-between">
                 <span className="text-base text-foreground">{answer}</span>
         {showFeedback && isCorrectAnswer && (
                   <Check className="w-5 h-5 text-accent animate-scale-in" />
                 )}
                 {showFeedback && isSelected && !isCorrectAnswer && (
                   <X className="w-5 h-5 text-destructive animate-scale-in" />
                 )}
               </div>
             </button>
           );
         })}
       </div>
 
       {/* Skip button */}
       {!showFeedback && (
         <div className="mt-6 flex justify-center">
           <Button
             variant="ghost"
             size="sm"
             onClick={onSkip}
             className="text-muted-foreground hover:text-foreground"
           >
             <SkipForward className="w-4 h-4 mr-1" />
             Skip
           </Button>
         </div>
       )}
 
       {/* Feedback message */}
       {showFeedback && (
         <div className={`mt-6 text-center animate-fade-slide-up ${isCorrect ? 'text-accent' : 'text-destructive'}`}>
           <span className="text-lg font-medium">
             {isCorrect ? '🎉 Correct!' : '❌ Not quite'}
           </span>
         </div>
       )}
     </div>
   );
 };
 
 export default QuizCard;