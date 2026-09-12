-- ============================================================================
-- AI Exam Tutor (ECAT & MDCAT) - Initial Database Schema
-- Architecture: Data-driven curriculum, shared subjects across exams,
-- fine-grained telemetry for adaptive diagnostic, study plan & AI tutoring.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE exam_code AS ENUM ('ECAT', 'MDCAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_item_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    target_exam exam_code NOT NULL DEFAULT 'ECAT',
    exam_year INT NOT NULL DEFAULT 2026,
    target_score NUMERIC(5, 2),
    baseline_score NUMERIC(5, 2),
    current_score_estimate NUMERIC(5, 2),
    streak_days INT NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    avatar_url TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EXAMS
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code exam_code UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_marks INT NOT NULL,
    duration_minutes INT NOT NULL,
    negative_marking BOOLEAN NOT NULL DEFAULT true,
    negative_marking_penalty NUMERIC(4, 2) NOT NULL DEFAULT 0.25,
    passing_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBJECTS (Shared between ECAT and MDCAT, e.g. Physics, Chemistry, English)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- 'PHY', 'CHEM', 'ENG', 'MATH', 'BIO'
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EXAM_SUBJECTS (Join table allowing shared subjects with custom weighting per exam)
CREATE TABLE IF NOT EXISTS public.exam_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    weight_percentage NUMERIC(5, 2) NOT NULL,
    question_count INT NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(exam_id, subject_id)
);

-- 7. CHAPTERS
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    estimated_study_minutes INT NOT NULL DEFAULT 45,
    importance_rating INT NOT NULL DEFAULT 3, -- 1 to 5 scale
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SUBTOPICS
CREATE TABLE IF NOT EXISTS public.subtopics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. LEARNING OBJECTIVES & SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE SET NULL,
    statement TEXT NOT NULL,
    bloom_taxonomy_level TEXT NOT NULL DEFAULT 'apply',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. REUSABLE LEARNING UNITS (1 per topic)
CREATE TABLE IF NOT EXISTS public.learning_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID UNIQUE NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_formulas JSONB NOT NULL DEFAULT '[]'::jsonb,
    common_pitfalls JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_minutes INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. QUESTIONS (Universal question bank tagged by curriculum nodes & applicable exams)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    learning_objective_id UUID REFERENCES public.learning_objectives(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'single_choice',
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    content TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_id TEXT NOT NULL,
    comprehensive_explanation TEXT NOT NULL,
    tip_or_shortcut TEXT,
    applicable_exams TEXT[] NOT NULL DEFAULT '{"ECAT", "MDCAT"}',
    past_paper_source TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. QUESTION ATTEMPTS (Granular telemetry)
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id TEXT,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    source_context TEXT NOT NULL DEFAULT 'practice', -- 'diagnostic', 'practice', 'mock_exam'
    context_id UUID,
    notes TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. TOPIC MASTERY (Adaptive state engine)
CREATE TABLE IF NOT EXISTS public.topic_masteries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    mastery_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0, -- 0 to 100
    mastery_level TEXT NOT NULL DEFAULT 'novice',
    total_attempted INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    streak_count INT NOT NULL DEFAULT 0,
    last_tested_at TIMESTAMPTZ,
    needs_review BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
);

-- 15. DIAGNOSTICS & ATTEMPTS
CREATE TABLE IF NOT EXISTS public.diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_questions INT NOT NULL DEFAULT 30,
    time_limit_minutes INT NOT NULL DEFAULT 45,
    subject_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.diagnostic_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_id UUID NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    subject_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_diagnostic_summary TEXT
);

-- 16. STUDY PLANS & PLAN ITEMS
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    goal_exam_date DATE,
    total_estimated_hours INT NOT NULL DEFAULT 40,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    learning_unit_id UUID REFERENCES public.learning_units(id) ON DELETE SET NULL,
    priority_order INT NOT NULL DEFAULT 1,
    status plan_item_status NOT NULL DEFAULT 'pending',
    target_date DATE,
    completed_at TIMESTAMPTZ,
    priority_reason TEXT NOT NULL,
    estimated_minutes INT NOT NULL DEFAULT 45
);

-- 17. TUTOR SESSIONS
CREATE TABLE IF NOT EXISTS public.tutor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. MOCK EXAMS & ATTEMPTS
CREATE TABLE IF NOT EXISTS public.mock_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    year INT,
    is_official_format BOOLEAN NOT NULL DEFAULT true,
    total_questions INT NOT NULL DEFAULT 100,
    duration_minutes INT NOT NULL DEFAULT 100,
    negative_marking BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mock_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mock_exam_id UUID NOT NULL REFERENCES public.mock_exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    max_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    projected_rank_percentile NUMERIC(5, 2),
    subject_performance JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 19. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty ON public.questions(topic_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_student ON public.question_attempts(student_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_masteries_student ON public.topic_masteries(student_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_items_student ON public.study_plan_items(student_id, priority_order ASC);

-- 20. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_masteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;

-- Public read for curriculum & questions
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Public read on subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public read on exam_subjects" ON public.exam_subjects FOR SELECT USING (true);
CREATE POLICY "Public read on chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Public read on topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public read on learning_units" ON public.learning_units FOR SELECT USING (true);
CREATE POLICY "Public read on questions" ON public.questions FOR SELECT USING (is_active = true);

-- Student-specific policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own question attempts" ON public.question_attempts FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Users can insert own question attempts" ON public.question_attempts FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users can manage own topic mastery" ON public.topic_masteries FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own study plans" ON public.study_plans FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own study plan items" ON public.study_plan_items FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own tutor sessions" ON public.tutor_sessions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own diagnostic attempts" ON public.diagnostic_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Users can manage own mock attempts" ON public.mock_attempts FOR ALL USING (auth.uid() = student_id);

-- Demo Isolation: Allow read on demo student profile and demo student records
CREATE POLICY "Public read on demo profile" ON public.profiles FOR SELECT USING (is_demo = true);
CREATE POLICY "Public read on demo topic masteries" ON public.topic_masteries FOR SELECT USING (student_id = '00000000-0000-4000-a000-000000000001');
CREATE POLICY "Public read on demo study plans" ON public.study_plans FOR SELECT USING (student_id = '00000000-0000-4000-a000-000000000001');
CREATE POLICY "Public read on demo diagnostic attempts" ON public.diagnostic_attempts FOR SELECT USING (student_id = '00000000-0000-4000-a000-000000000001');

-- 21. AUTOMATIC PROFILE CREATION TRIGGER (Google OAuth & Auth Signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        target_exam,
        avatar_url,
        is_demo
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Student'),
        COALESCE((NEW.raw_user_meta_data->>'target_exam')::exam_code, 'ECAT'::exam_code),
        NEW.raw_user_meta_data->>'avatar_url',
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = 'Student' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

