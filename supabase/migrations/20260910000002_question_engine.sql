-- ============================================================================
-- AI Exam Tutor: Module 03 - Question Engine
-- Entities: questions, question_options, question_attempts
-- Statuses: draft, review, approved, archived
-- Difficulties: easy, medium, hard, exam_level
-- Telemetry: student, question, selected answer, correctness, time taken, confidence, attempt timestamp
-- ============================================================================

-- 1. EXTEND DIFFICULTY LEVEL ENUM
DO $$ BEGIN
    ALTER TYPE public.difficulty_level ADD VALUE IF NOT EXISTS 'exam_level';
EXCEPTION WHEN undefined_object THEN
    -- If difficulty_level is not an enum, ensure check constraints accommodate it
    null;
END $$;

-- 2. ENHANCE QUESTIONS TABLE
ALTER TABLE public.questions 
    ADD COLUMN IF NOT EXISTS question_text TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS estimated_time_seconds INT NOT NULL DEFAULT 90,
    ADD COLUMN IF NOT EXISTS source TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill question_text and source from legacy columns if empty
UPDATE public.questions 
SET question_text = content 
WHERE question_text IS NULL AND content IS NOT NULL;

UPDATE public.questions 
SET source = past_paper_source 
WHERE source IS NULL AND past_paper_source IS NOT NULL;

-- Add check constraint for question status
DO $$ BEGIN
    ALTER TABLE public.questions 
        ADD CONSTRAINT chk_question_status 
        CHECK (status IN ('draft', 'review', 'approved', 'archived'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. NORMALIZED QUESTION OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL, -- e.g. 'A', 'B', 'C', 'D' or 'opt-1'
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    explanation TEXT,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_question_option UNIQUE (question_id, option_key)
);

-- 4. ENHANCE QUESTION ATTEMPTS TABLE
ALTER TABLE public.question_attempts
    ADD COLUMN IF NOT EXISTS selected_answer TEXT,
    ADD COLUMN IF NOT EXISTS time_taken_seconds INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS confidence TEXT,
    ADD COLUMN IF NOT EXISTS client_token TEXT;

-- Backfill selected_answer and time_taken_seconds from legacy columns if empty
UPDATE public.question_attempts
SET selected_answer = selected_option_id
WHERE selected_answer IS NULL AND selected_option_id IS NOT NULL;

UPDATE public.question_attempts
SET time_taken_seconds = time_spent_seconds
WHERE time_taken_seconds = 0 AND time_spent_seconds > 0;

-- Check constraint for confidence
DO $$ BEGIN
    ALTER TABLE public.question_attempts
        ADD CONSTRAINT chk_attempt_confidence
        CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Unique constraint on client_token to prevent accidental duplicate submission
DO $$ BEGIN
    ALTER TABLE public.question_attempts
        ADD CONSTRAINT uq_attempt_client_token UNIQUE (client_token);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. INDEXES FOR HIGH-THROUGHPUT RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_skill ON public.questions(skill_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_objective ON public.questions(learning_objective_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(chapter_id);

CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.question_options(question_id, display_order);
CREATE INDEX IF NOT EXISTS idx_question_attempts_student ON public.question_attempts(student_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question ON public.question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_client_token ON public.question_attempts(client_token);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

-- Questions read policy: approved questions visible to all
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read approved questions" ON public.questions;
    CREATE POLICY "Public read approved questions" ON public.questions
        FOR SELECT USING (is_active = true AND status = 'approved');
EXCEPTION WHEN others THEN null;
END $$;

-- Options read policy
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read question options" ON public.question_options;
    CREATE POLICY "Public read question options" ON public.question_options
        FOR SELECT USING (true);
EXCEPTION WHEN others THEN null;
END $$;

-- Attempts policies: Students can read their own attempts and insert attempts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Students read own attempts" ON public.question_attempts;
    CREATE POLICY "Students read own attempts" ON public.question_attempts
        FOR SELECT USING (
            auth.uid() = student_id OR 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id AND is_demo = true)
        );
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students insert own attempts" ON public.question_attempts;
    CREATE POLICY "Students insert own attempts" ON public.question_attempts
        FOR INSERT WITH CHECK (
            auth.uid() = student_id OR 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id AND is_demo = true)
        );
EXCEPTION WHEN others THEN null;
END $$;
