-- ============================================================================
-- AI Exam Tutor (ECAT & MDCAT) - Topic Mastery Engine Migration
-- Module: Centralized Topic Mastery Engine
-- Tables: topic_mastery, topic_mastery_history
-- ============================================================================

-- 1. TOPIC_MASTERY (Centralized Topic Mastery Entity)
CREATE TABLE IF NOT EXISTS public.topic_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    mastery_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
    status TEXT NOT NULL DEFAULT 'unassessed' CHECK (status IN ('unassessed', 'weak', 'developing', 'strong', 'mastered')),
    last_assessed_at TIMESTAMPTZ,
    last_practiced_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_attempted INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    accuracy_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    streak_count INT NOT NULL DEFAULT 0,
    needs_review BOOLEAN NOT NULL DEFAULT false,
    mastery_level TEXT NOT NULL DEFAULT 'novice',
    UNIQUE(student_id, topic_id)
);

-- 2. TOPIC_MASTERY_HISTORY (Auditable timeline for progress visualization)
CREATE TABLE IF NOT EXISTS public.topic_mastery_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mastery_id UUID REFERENCES public.topic_mastery(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    previous_score NUMERIC(5, 2) NOT NULL,
    new_score NUMERIC(5, 2) NOT NULL,
    delta NUMERIC(5, 2) NOT NULL,
    source_context TEXT NOT NULL DEFAULT 'practice' CHECK (source_context IN ('diagnostic', 'practice', 'mastery_test', 'mock_exam')),
    attempt_count INT NOT NULL DEFAULT 0,
    accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR FAST RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_topic_mastery_student ON public.topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_student_topic ON public.topic_mastery(student_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_status ON public.topic_mastery(student_id, status);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_score ON public.topic_mastery(student_id, mastery_score);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_history_student ON public.topic_mastery_history(student_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_history_created_at ON public.topic_mastery_history(created_at DESC);

-- 4. VIEW ALIAS FOR BACKWARD COMPATIBILITY
CREATE OR REPLACE VIEW public.topic_masteries AS
    SELECT * FROM public.topic_mastery;
