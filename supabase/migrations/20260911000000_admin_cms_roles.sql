-- ============================================================================
-- AI Exam Tutor: Module 08 - Admin CMS Roles & Policies
-- Support for:
-- 1. Role-based access control (RBAC): student vs admin
-- 2. Curriculum management: exams, subjects, chapters, topics, learning objectives, skills
-- 3. Question Bank management: draft -> review -> approved -> archived workflow
-- 4. Protected Admin operations via Supabase RLS
-- ============================================================================

-- 1. ADD ROLE COLUMN TO PROFILES
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

DO $$ BEGIN
    ALTER TABLE public.profiles
        ADD CONSTRAINT chk_profile_role
        CHECK (role IN ('student', 'admin'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. HELPER FUNCTION TO CHECK IF CURRENT CALLER IS ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ADMIN CMS RLS POLICIES FOR QUESTIONS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins select all questions" ON public.questions;
    CREATE POLICY "Admins select all questions" ON public.questions
        FOR SELECT USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins insert questions" ON public.questions;
    CREATE POLICY "Admins insert questions" ON public.questions
        FOR INSERT WITH CHECK (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins update questions" ON public.questions;
    CREATE POLICY "Admins update questions" ON public.questions
        FOR UPDATE USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins delete questions" ON public.questions;
    CREATE POLICY "Admins delete questions" ON public.questions
        FOR DELETE USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

-- 4. ADMIN CMS RLS POLICIES FOR QUESTION OPTIONS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage question options" ON public.question_options;
    CREATE POLICY "Admins manage question options" ON public.question_options
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

-- 5. ADMIN CMS RLS POLICIES FOR CURRICULUM
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage exams" ON public.exams;
    CREATE POLICY "Admins manage exams" ON public.exams
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;
    CREATE POLICY "Admins manage subjects" ON public.subjects
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage exam_subjects" ON public.exam_subjects;
    CREATE POLICY "Admins manage exam_subjects" ON public.exam_subjects
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage chapters" ON public.chapters;
    CREATE POLICY "Admins manage chapters" ON public.chapters
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage topics" ON public.topics;
    CREATE POLICY "Admins manage topics" ON public.topics
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage learning_units" ON public.learning_units;
    CREATE POLICY "Admins manage learning_units" ON public.learning_units
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage subtopics" ON public.subtopics;
    CREATE POLICY "Admins manage subtopics" ON public.subtopics
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage learning_objectives" ON public.learning_objectives;
    CREATE POLICY "Admins manage learning_objectives" ON public.learning_objectives
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage skills" ON public.skills;
    CREATE POLICY "Admins manage skills" ON public.skills
        FOR ALL USING (public.is_admin());
EXCEPTION WHEN others THEN null;
END $$;
