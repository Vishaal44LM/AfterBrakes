import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const triviaData = [
  {
    question: "Which wears out faster, front or rear brake pads?",
    answer: "Front pads usually wear faster because they handle more braking force.",
    tip: "Ask your mechanic to check them at each service."
  },
  {
    question: "Why does your car pull to one side when braking?",
    answer: "It's often caused by uneven brake pad wear or a sticking caliper.",
    tip: "Get it checked soon—uneven braking affects safety."
  },
  {
    question: "How often should you rotate your tyres?",
    answer: "Every 8,000–10,000 km to ensure even wear.",
    tip: "Rotate them during every second oil change."
  },
  {
    question: "What's the most common cause of a check engine light?",
    answer: "A loose or faulty fuel cap is surprisingly common.",
    tip: "Check the cap first before panicking—tighten and reset."
  },
  {
    question: "Why does your steering wheel shake at high speeds?",
    answer: "Usually caused by unbalanced wheels or worn suspension parts.",
    tip: "Get your wheels balanced and alignment checked."
  },
  {
    question: "How long do wiper blades typically last?",
    answer: "About 6–12 months depending on usage and climate.",
    tip: "Replace them before monsoon season for best visibility."
  },
  {
    question: "What happens if you ignore low coolant levels?",
    answer: "Your engine can overheat, leading to serious damage.",
    tip: "Check coolant monthly and top up with the right mix."
  },
  {
    question: "Why does your car make a squealing noise when starting?",
    answer: "Often a worn or loose serpentine belt.",
    tip: "Have it inspected—belts are cheap, engine repairs aren't."
  }
];

const CarTriviaSnack = () => {
  const [currentIndex, setCurrentIndex] = useState(() => 
    Math.floor(Math.random() * triviaData.length)
  );
  const [revealed, setRevealed] = useState(false);

  const trivia = triviaData[currentIndex];

  const handleNextTrivia = () => {
    let newIndex = Math.floor(Math.random() * triviaData.length);
    while (newIndex === currentIndex && triviaData.length > 1) {
      newIndex = Math.floor(Math.random() * triviaData.length);
    }
    setCurrentIndex(newIndex);
    setRevealed(false);
  };

  return (
    <div className="card-vignette p-4 animate-fade-slide-up" style={{ animationDelay: "200ms" }}>
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          Drive Time Q&A
        </span>
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-foreground mb-3">
        Q: {trivia.question}
      </p>

      {/* Answer section */}
      {revealed ? (
        <div className="space-y-3 animate-fade-slide-up">
          <div className="bg-secondary/30 rounded-xl p-3">
            <p className="text-sm text-foreground">
              <span className="text-primary font-medium">A:</span> {trivia.answer}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
              <span className="text-primary">💡</span>
              {trivia.tip}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextTrivia}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Next trivia
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setRevealed(true)}
          className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-0"
          variant="outline"
        >
          Reveal answer
        </Button>
      )}
    </div>
  );
};

export default CarTriviaSnack;
