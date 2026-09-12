-- ============================================================================
-- AI Exam Tutor: Module 04 - Diagnostic Engine
-- Entities: diagnostic_tests, diagnostic_attempts
-- Features:
--   - Baseline knowledge assessment for ECAT & MDCAT
--   - Topic-level classification: strong, developing, weak, unknown
--   - Multi-dimensional telemetry: overall, subject, topic, difficulty, time, confidence
--   - Direct recommendation linking into Learning Units
-- ============================================================================

-- 1. DIAGNOSTIC TESTS TABLE
CREATE TABLE IF NOT EXISTS public.diagnostic_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL DEFAULT 'ECAT', -- 'ECAT' or 'MDCAT'
    name TEXT NOT NULL,
    description TEXT,
    total_questions INT NOT NULL DEFAULT 15,
    time_limit_minutes INT NOT NULL DEFAULT 30,
    test_configuration JSONB NOT NULL DEFAULT '{"subjectBreakdown": []}'::jsonb,
    question_ids TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill diagnostic_tests from legacy diagnostics table if present
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diagnostics') THEN
        INSERT INTO public.diagnostic_tests (id, exam_id, exam_type, name, description, total_questions, time_limit_minutes, test_configuration, is_active, created_at)
        SELECT 
            d.id,
            d.exam_id,
            COALESCE(e.code::TEXT, 'ECAT'),
            d.name,
            d.description,
            d.total_questions,
            d.time_limit_minutes,
            jsonb_build_object('subjectBreakdown', d.subject_breakdown),
            d.is_active,
            d.created_at
        FROM public.diagnostics d
        LEFT JOIN public.exams e ON e.id = d.exam_id
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 2. ENHANCE DIAGNOSTIC ATTEMPTS TABLE
ALTER TABLE public.diagnostic_attempts
    ADD COLUMN IF NOT EXISTS diagnostic_test_id UUID REFERENCES public.diagnostic_tests(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'ECAT',
    ADD COLUMN IF NOT EXISTS total_questions INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS attempted_questions INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overall_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subject_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS topic_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS difficulty_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS time_performance JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS confidence_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS weak_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS strong_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS developing_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS unknown_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS recommended_next_step JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Populate diagnostic_test_id from diagnostic_id if currently null
UPDATE public.diagnostic_attempts
SET diagnostic_test_id = diagnostic_id
WHERE diagnostic_test_id IS NULL AND diagnostic_id IS NOT NULL;

-- 3. INDEXES FOR DIAGNOSTIC QUERYING
CREATE INDEX IF NOT EXISTS idx_diag_tests_exam_type ON public.diagnostic_tests(exam_type);
CREATE INDEX IF NOT EXISTS idx_diag_tests_is_active ON public.diagnostic_tests(is_active);
CREATE INDEX IF NOT EXISTS idx_diag_attempts_student ON public.diagnostic_attempts(student_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_diag_attempts_test_id ON public.diagnostic_attempts(diagnostic_test_id);
CREATE INDEX IF NOT EXISTS idx_diag_attempts_exam_type ON public.diagnostic_attempts(exam_type);
CREATE INDEX IF NOT EXISTS idx_diag_attempts_status ON public.diagnostic_attempts(status);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.diagnostic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_attempts ENABLE ROW LEVEL SECURITY;

-- diagnostic_tests policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read access to active diagnostic tests" ON public.diagnostic_tests;
    CREATE POLICY "Public read access to active diagnostic tests"
        ON public.diagnostic_tests FOR SELECT
        USING (is_active = true);
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- diagnostic_attempts policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Students can view own diagnostic attempts" ON public.diagnostic_attempts;
    CREATE POLICY "Students can view own diagnostic attempts"
        ON public.diagnostic_attempts FOR SELECT
        USING (auth.uid() = student_id OR student_id = '00000000-0000-4000-a000-000000000001'::uuid);

    DROP POLICY IF EXISTS "Students can insert own diagnostic attempts" ON public.diagnostic_attempts;
    CREATE POLICY "Students can insert own diagnostic attempts"
        ON public.diagnostic_attempts FOR INSERT
        WITH CHECK (auth.uid() = student_id OR student_id = '00000000-0000-4000-a000-000000000001'::uuid);

    DROP POLICY IF EXISTS "Students can update own diagnostic attempts" ON public.diagnostic_attempts;
    CREATE POLICY "Students can update own diagnostic attempts"
        ON public.diagnostic_attempts FOR UPDATE
        USING (auth.uid() = student_id OR student_id = '00000000-0000-4000-a000-000000000001'::uuid);
EXCEPTION WHEN undefined_object THEN null;
END $$;
