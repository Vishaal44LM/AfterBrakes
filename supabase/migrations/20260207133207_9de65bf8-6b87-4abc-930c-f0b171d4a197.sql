
-- Add new columns for enhanced quiz progress tracking
ALTER TABLE public.quiz_progress 
  ADD COLUMN IF NOT EXISTS easy_answered integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS easy_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_answered integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hard_answered integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hard_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_sessions_completed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS topic_accuracy jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recently_seen_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS medium_unlocked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS hard_unlocked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_session_date text,
  ADD COLUMN IF NOT EXISTS daily_easy_plays integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_medium_plays integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_hard_plays integer NOT NULL DEFAULT 0;
