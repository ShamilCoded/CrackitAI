-- ============================================================================
-- AI Exam Tutor: Module 02 - Core PostgreSQL Data Model & Curriculum Engine
-- Hierarchy: Exam → Subject → Chapter → Topic → Subtopic → Learning Objective → Skill
-- Shared subjects: Physics, Chemistry, English (ECAT & MDCAT)
-- Specific subjects: Mathematics (ECAT), Biology, Logical Reasoning (MDCAT)
-- ============================================================================

-- 1. STUDENT PROFILES VIEW (Compatibility alias for public.profiles)
CREATE OR REPLACE VIEW public.student_profiles AS 
SELECT * FROM public.profiles;

-- 2. HIERARCHY INDEXES FOR HIGH-THROUGHPUT NAVIGATION
CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam ON public.exam_subjects(exam_id, display_order);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_subject ON public.exam_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON public.topics(chapter_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic ON public.subtopics(topic_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_learning_objectives_topic ON public.learning_objectives(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_objectives_subtopic ON public.learning_objectives(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_skills_subject ON public.skills(subject_id);

-- 3. RLS FOR SUBTOPICS, SKILLS, AND LEARNING OBJECTIVES
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_objectives ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read on subtopics" ON public.subtopics;
    CREATE POLICY "Public read on subtopics" ON public.subtopics FOR SELECT USING (true);
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read on skills" ON public.skills;
    CREATE POLICY "Public read on skills" ON public.skills FOR SELECT USING (true);
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read on learning_objectives" ON public.learning_objectives;
    CREATE POLICY "Public read on learning_objectives" ON public.learning_objectives FOR SELECT USING (true);
EXCEPTION WHEN others THEN null;
END $$;

-- 4. SEED DATA FOR DEMO & TESTING ENVIRONMENTS
-- Insert Exams
INSERT INTO public.exams (id, code, name, description, total_marks, duration_minutes, negative_marking, negative_marking_penalty, passing_percentage, is_active)
VALUES
    ('00000000-0000-0000-0001-000000000001', 'ECAT', 'Engineering College Admission Test (UET ECAT)', 'Engineering entrance exam for UET Lahore, Taxila, and affiliated engineering universities across Pakistan.', 400, 100, true, 1.00, 50.0, true),
    ('00000000-0000-0000-0001-000000000002', 'MDCAT', 'Medical & Dental College Admission Test (PMDC MDCAT)', 'Standardized medical entrance exam administered by PMDC for MBBS and BDS admissions in Pakistan.', 200, 210, false, 0.00, 55.0, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    total_marks = EXCLUDED.total_marks,
    duration_minutes = EXCLUDED.duration_minutes;

-- Insert Subjects
INSERT INTO public.subjects (id, code, name, icon, color, description)
VALUES
    ('00000000-0000-0000-0002-000000000001', 'PHY', 'Physics', 'Zap', 'blue', 'Mechanics, Electromagnetism, Modern Physics, and Waves across ECAT & MDCAT.'),
    ('00000000-0000-0000-0002-000000000002', 'CHEM', 'Chemistry', 'FlaskConical', 'emerald', 'Physical, Inorganic, and Organic Chemistry with emphasis on reaction stoichiometry and equilibria.'),
    ('00000000-0000-0000-0002-000000000003', 'ENG', 'English', 'Languages', 'amber', 'Grammar concord, vocabulary in context, reading comprehension, and sentence structure.'),
    ('00000000-0000-0000-0002-000000000004', 'MATH', 'Mathematics', 'Binary', 'indigo', 'Calculus, Algebra, Analytic Geometry, and Trigonometry specifically for ECAT engineering candidates.'),
    ('00000000-0000-0000-0002-000000000005', 'BIO', 'Biology', 'Dna', 'teal', 'Cell Biology, Genetics, Human Physiology, and Biotechnology for MDCAT pre-medical aspirants.'),
    ('00000000-0000-0000-0002-000000000006', 'LOGIC', 'Logical Reasoning', 'BrainCircuit', 'purple', 'Critical thinking, categorical deduction, syllogisms, and pattern analysis for MDCAT.')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description;

-- Insert Exam-Subject Mappings (Shared Subjects & Specific Weights)
-- ECAT Mappings
INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 30.0, 30, 1, true FROM public.exams e, public.subjects s WHERE e.code = 'ECAT' AND s.code = 'MATH'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 30.0, 30, 2, true FROM public.exams e, public.subjects s WHERE e.code = 'ECAT' AND s.code = 'PHY'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 30.0, 30, 3, true FROM public.exams e, public.subjects s WHERE e.code = 'ECAT' AND s.code = 'CHEM'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 10.0, 10, 4, true FROM public.exams e, public.subjects s WHERE e.code = 'ECAT' AND s.code = 'ENG'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

-- MDCAT Mappings
INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 34.0, 68, 1, true FROM public.exams e, public.subjects s WHERE e.code = 'MDCAT' AND s.code = 'BIO'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 27.0, 54, 2, true FROM public.exams e, public.subjects s WHERE e.code = 'MDCAT' AND s.code = 'CHEM'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 27.0, 54, 3, true FROM public.exams e, public.subjects s WHERE e.code = 'MDCAT' AND s.code = 'PHY'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 9.0, 18, 4, true FROM public.exams e, public.subjects s WHERE e.code = 'MDCAT' AND s.code = 'ENG'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;

INSERT INTO public.exam_subjects (exam_id, subject_id, weight_percentage, question_count, display_order, is_active)
SELECT e.id, s.id, 3.0, 6, 5, true FROM public.exams e, public.subjects s WHERE e.code = 'MDCAT' AND s.code = 'LOGIC'
ON CONFLICT (exam_id, subject_id) DO UPDATE SET weight_percentage = EXCLUDED.weight_percentage, question_count = EXCLUDED.question_count;
