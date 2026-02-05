-- Create quiz_progress table to store user quiz data
CREATE TABLE public.quiz_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  daily_plays_today INTEGER NOT NULL DEFAULT 0,
  daily_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  unlocked_difficulty TEXT[] NOT NULL DEFAULT ARRAY['easy']::TEXT[],
  answered_question_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_quiz_progress UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own quiz progress" 
ON public.quiz_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz progress" 
ON public.quiz_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz progress" 
ON public.quiz_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quiz_progress_updated_at
BEFORE UPDATE ON public.quiz_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();