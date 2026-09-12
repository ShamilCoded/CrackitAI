/**
 * Database definitions matching the PostgreSQL schema in Supabase.
 * Generated / maintained for strict TypeScript typing with @supabase/supabase-js.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          target_exam: 'ECAT' | 'MDCAT';
          exam_year: number;
          target_score: number | null;
          baseline_score: number | null;
          current_score_estimate: number | null;
          streak_days: number;
          last_active_at: string | null;
          avatar_url: string | null;
          is_demo: boolean;
          role: 'student' | 'admin' | 'parent';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          target_exam: 'ECAT' | 'MDCAT';
          exam_year?: number;
          target_score?: number | null;
          baseline_score?: number | null;
          current_score_estimate?: number | null;
          streak_days?: number;
          last_active_at?: string | null;
          avatar_url?: string | null;
          is_demo?: boolean;
          role?: 'student' | 'admin' | 'parent';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          target_exam?: 'ECAT' | 'MDCAT';
          exam_year?: number;
          target_score?: number | null;
          baseline_score?: number | null;
          current_score_estimate?: number | null;
          streak_days?: number;
          last_active_at?: string | null;
          avatar_url?: string | null;
          is_demo?: boolean;
          role?: 'student' | 'admin' | 'parent';
          updated_at?: string;
        };
      };
      exams: {
        Row: {
          id: string;
          code: 'ECAT' | 'MDCAT';
          name: string;
          description: string;
          total_marks: number;
          duration_minutes: number;
          negative_marking: boolean;
          negative_marking_penalty: number;
          passing_percentage: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: 'ECAT' | 'MDCAT';
          name: string;
          description: string;
          total_marks: number;
          duration_minutes: number;
          negative_marking?: boolean;
          negative_marking_penalty?: number;
          passing_percentage?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: 'ECAT' | 'MDCAT';
          name?: string;
          description?: string;
          total_marks?: number;
          duration_minutes?: number;
          negative_marking?: boolean;
          negative_marking_penalty?: number;
          passing_percentage?: number;
          is_active?: boolean;
        };
      };
      subjects: {
        Row: {
          id: string;
          code: string;
          name: string;
          icon: string | null;
          color: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          description?: string | null;
        };
      };
      exam_subjects: {
        Row: {
          id: string;
          exam_id: string;
          subject_id: string;
          weight_percentage: number;
          question_count: number;
          display_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          exam_id: string;
          subject_id: string;
          weight_percentage: number;
          question_count: number;
          display_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          exam_id?: string;
          subject_id?: string;
          weight_percentage?: number;
          question_count?: number;
          display_order?: number;
          is_active?: boolean;
        };
      };
      chapters: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          code: string;
          sequence_order: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          code: string;
          sequence_order?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          name?: string;
          code?: string;
          sequence_order?: number;
          description?: string | null;
        };
      };
      topics: {
        Row: {
          id: string;
          chapter_id: string;
          subject_id: string;
          name: string;
          code: string;
          sequence_order: number;
          estimated_study_minutes: number;
          importance_rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          subject_id: string;
          name: string;
          code: string;
          sequence_order?: number;
          estimated_study_minutes?: number;
          importance_rating?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          subject_id?: string;
          name?: string;
          code?: string;
          sequence_order?: number;
          estimated_study_minutes?: number;
          importance_rating?: number;
        };
      };
      learning_units: {
        Row: {
          id: string;
          topic_id: string;
          title: string;
          summary: string;
          key_concepts: string[];
          key_formulas: string[];
          common_pitfalls: string[];
          estimated_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          title: string;
          summary: string;
          key_concepts: string[];
          key_formulas: string[];
          common_pitfalls: string[];
          estimated_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          title?: string;
          summary?: string;
          key_concepts?: string[];
          key_formulas?: string[];
          common_pitfalls?: string[];
          estimated_minutes?: number;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          subject_id: string;
          chapter_id: string;
          topic_id: string;
          subtopic_id: string | null;
          skill_id: string | null;
          learning_objective_id: string | null;
          type: string;
          difficulty: 'easy' | 'medium' | 'hard' | 'exam_level';
          content: string;
          question_text: string | null;
          options: Json;
          correct_option_id: string;
          comprehensive_explanation: string;
          tip_or_shortcut: string | null;
          applicable_exams: string[];
          past_paper_source: string | null;
          source: string | null;
          status: 'draft' | 'review' | 'approved' | 'archived';
          estimated_time_seconds: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          chapter_id: string;
          topic_id: string;
          subtopic_id?: string | null;
          skill_id?: string | null;
          learning_objective_id?: string | null;
          type?: string;
          difficulty?: 'easy' | 'medium' | 'hard' | 'exam_level';
          content: string;
          question_text?: string | null;
          options?: Json;
          correct_option_id: string;
          comprehensive_explanation: string;
          tip_or_shortcut?: string | null;
          applicable_exams: string[];
          past_paper_source?: string | null;
          source?: string | null;
          status?: 'draft' | 'review' | 'approved' | 'archived';
          estimated_time_seconds?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          chapter_id?: string;
          topic_id?: string;
          subtopic_id?: string | null;
          skill_id?: string | null;
          learning_objective_id?: string | null;
          type?: string;
          difficulty?: 'easy' | 'medium' | 'hard' | 'exam_level';
          content?: string;
          question_text?: string | null;
          options?: Json;
          correct_option_id?: string;
          comprehensive_explanation?: string;
          tip_or_shortcut?: string | null;
          applicable_exams?: string[];
          past_paper_source?: string | null;
          source?: string | null;
          status?: 'draft' | 'review' | 'approved' | 'archived';
          estimated_time_seconds?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          option_key: string;
          option_text: string;
          is_correct: boolean;
          explanation: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_key: string;
          option_text: string;
          is_correct?: boolean;
          explanation?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_key?: string;
          option_text?: string;
          is_correct?: boolean;
          explanation?: string | null;
          display_order?: number;
        };
      };
      question_attempts: {
        Row: {
          id: string;
          student_id: string;
          question_id: string;
          selected_option_id: string | null;
          selected_answer: string | null;
          is_correct: boolean;
          time_spent_seconds: number;
          time_taken_seconds: number;
          confidence: 'low' | 'medium' | 'high' | null;
          source_context: string;
          context_id: string | null;
          notes: string | null;
          client_token: string | null;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          question_id: string;
          selected_option_id?: string | null;
          selected_answer?: string | null;
          is_correct: boolean;
          time_spent_seconds?: number;
          time_taken_seconds?: number;
          confidence?: 'low' | 'medium' | 'high' | null;
          source_context?: string;
          context_id?: string | null;
          notes?: string | null;
          client_token?: string | null;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          question_id?: string;
          selected_option_id?: string | null;
          selected_answer?: string | null;
          is_correct?: boolean;
          time_spent_seconds?: number;
          time_taken_seconds?: number;
          confidence?: 'low' | 'medium' | 'high' | null;
          source_context?: string;
          context_id?: string | null;
          notes?: string | null;
          client_token?: string | null;
          attempted_at?: string;
        };
      };
      topic_masteries: {
        Row: {
          id: string;
          student_id: string;
          topic_id: string;
          subject_id: string;
          mastery_score: number;
          mastery_level: string;
          total_attempted: number;
          correct_count: number;
          streak_count: number;
          last_tested_at: string | null;
          needs_review: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          topic_id: string;
          subject_id: string;
          mastery_score?: number;
          mastery_level?: string;
          total_attempted?: number;
          correct_count?: number;
          streak_count?: number;
          last_tested_at?: string | null;
          needs_review?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          topic_id?: string;
          subject_id?: string;
          mastery_score?: number;
          mastery_level?: string;
          total_attempted?: number;
          correct_count?: number;
          streak_count?: number;
          last_tested_at?: string | null;
          needs_review?: boolean;
          updated_at?: string;
        };
      };
      study_plans: {
        Row: {
          id: string;
          student_id: string;
          exam_id: string;
          title: string;
          goal_exam_date: string | null;
          total_estimated_hours: number;
          status: 'active' | 'completed' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          exam_id: string;
          title: string;
          goal_exam_date?: string | null;
          total_estimated_hours?: number;
          status?: 'active' | 'completed' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          exam_id?: string;
          title?: string;
          goal_exam_date?: string | null;
          total_estimated_hours?: number;
          status?: 'active' | 'completed' | 'archived';
          updated_at?: string;
        };
      };
      study_plan_items: {
        Row: {
          id: string;
          study_plan_id: string;
          student_id: string;
          topic_id: string;
          learning_unit_id: string | null;
          priority_order: number;
          status: 'pending' | 'in_progress' | 'completed' | 'skipped';
          target_date: string | null;
          completed_at: string | null;
          priority_reason: string;
          estimated_minutes: number;
        };
        Insert: {
          id?: string;
          study_plan_id: string;
          student_id: string;
          topic_id: string;
          learning_unit_id?: string | null;
          priority_order?: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          target_date?: string | null;
          completed_at?: string | null;
          priority_reason?: string;
          estimated_minutes?: number;
        };
        Update: {
          id?: string;
          study_plan_id?: string;
          student_id?: string;
          topic_id?: string;
          learning_unit_id?: string | null;
          priority_order?: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          target_date?: string | null;
          completed_at?: string | null;
          priority_reason?: string;
          estimated_minutes?: number;
        };
      };
      subtopics: {
        Row: {
          id: string;
          topic_id: string;
          name: string;
          sequence_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          name: string;
          sequence_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          name?: string;
          sequence_order?: number;
        };
      };
      learning_objectives: {
        Row: {
          id: string;
          topic_id: string;
          subtopic_id: string | null;
          statement: string;
          bloom_taxonomy_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          subtopic_id?: string | null;
          statement: string;
          bloom_taxonomy_level?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
          created_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          subtopic_id?: string | null;
          statement?: string;
          bloom_taxonomy_level?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
        };
      };
      skills: {
        Row: {
          id: string;
          subject_id: string;
          code: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          code: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          code?: string;
          name?: string;
          description?: string | null;
        };
      };
      student_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          target_exam: 'ECAT' | 'MDCAT';
          exam_year: number;
          target_score: number | null;
          baseline_score: number | null;
          current_score_estimate: number | null;
          streak_days: number;
          last_active_at: string | null;
          avatar_url: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          target_exam: 'ECAT' | 'MDCAT';
          exam_year?: number;
          target_score?: number | null;
          baseline_score?: number | null;
          current_score_estimate?: number | null;
          streak_days?: number;
          last_active_at?: string | null;
          avatar_url?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          target_exam?: 'ECAT' | 'MDCAT';
          exam_year?: number;
          target_score?: number | null;
          baseline_score?: number | null;
          current_score_estimate?: number | null;
          streak_days?: number;
          last_active_at?: string | null;
          avatar_url?: string | null;
          is_demo?: boolean;
          updated_at?: string;
        };
      };
      mock_exams: {
        Row: {
          id: string;
          exam_id: string;
          exam_type: 'ECAT' | 'MDCAT';
          title: string;
          description: string;
          total_questions: number;
          duration_minutes: number;
          negative_marking: boolean;
          negative_marking_penalty: number;
          passing_percentage: number;
          subject_quotas: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          exam_type: 'ECAT' | 'MDCAT';
          title: string;
          description: string;
          total_questions: number;
          duration_minutes: number;
          negative_marking?: boolean;
          negative_marking_penalty?: number;
          passing_percentage?: number;
          subject_quotas: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          exam_type?: 'ECAT' | 'MDCAT';
          title?: string;
          description?: string;
          total_questions?: number;
          duration_minutes?: number;
          negative_marking?: boolean;
          negative_marking_penalty?: number;
          passing_percentage?: number;
          subject_quotas?: Json;
          is_active?: boolean;
          created_at?: string;
        };
      };
      mock_attempts: {
        Row: {
          id: string;
          mock_exam_id: string;
          student_id: string;
          exam_type: 'ECAT' | 'MDCAT';
          exam_title: string;
          started_at: string;
          completed_at: string;
          total_duration_seconds: number;
          time_spent_seconds: number;
          is_auto_submitted: boolean;
          total_questions: number;
          attempted_count: number;
          unattempted_count: number;
          correct_count: number;
          incorrect_count: number;
          marked_for_review_count: number;
          score: number;
          max_score: number;
          percentage: number;
          is_passed: boolean;
          projected_rank_percentile: number;
          subject_breakdown: Json;
          topic_breakdown: Json;
          time_analysis: Json;
          mistakes: Json;
          recommendations: Json;
          answers: Json;
        };
        Insert: {
          id?: string;
          mock_exam_id: string;
          student_id: string;
          exam_type: 'ECAT' | 'MDCAT';
          exam_title: string;
          started_at: string;
          completed_at: string;
          total_duration_seconds: number;
          time_spent_seconds: number;
          is_auto_submitted?: boolean;
          total_questions: number;
          attempted_count: number;
          unattempted_count: number;
          correct_count: number;
          incorrect_count: number;
          marked_for_review_count?: number;
          score: number;
          max_score: number;
          percentage: number;
          is_passed: boolean;
          projected_rank_percentile?: number;
          subject_breakdown: Json;
          topic_breakdown: Json;
          time_analysis: Json;
          mistakes: Json;
          recommendations: Json;
          answers: Json;
        };
        Update: {
          id?: string;
          mock_exam_id?: string;
          student_id?: string;
          exam_type?: 'ECAT' | 'MDCAT';
          exam_title?: string;
          started_at?: string;
          completed_at?: string;
          total_duration_seconds?: number;
          time_spent_seconds?: number;
          is_auto_submitted?: boolean;
          total_questions?: number;
          attempted_count?: number;
          unattempted_count?: number;
          correct_count?: number;
          incorrect_count?: number;
          marked_for_review_count?: number;
          score?: number;
          max_score?: number;
          percentage?: number;
          is_passed?: boolean;
          projected_rank_percentile?: number;
          subject_breakdown?: Json;
          topic_breakdown?: Json;
          time_analysis?: Json;
          mistakes?: Json;
          recommendations?: Json;
          answers?: Json;
        };
      };
    };
  };
}
