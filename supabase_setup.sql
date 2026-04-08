-- Create tables for Lecture Management
-- 1. Lecture Files Table
CREATE TABLE IF NOT EXISTS public.lecture_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    file_type TEXT,
    size INT8,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lecture_files ENABLE ROW LEVEL SECURITY;

-- Policies for lecture_files
-- User can only see their own files
CREATE POLICY "Users can view their own lecture files" ON public.lecture_files
    FOR SELECT USING (auth.uid() = user_id);

-- User can only insert their own files
CREATE POLICY "Users can insert their own lecture files" ON public.lecture_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can only delete their own files
CREATE POLICY "Users can delete their own lecture files" ON public.lecture_files
    FOR DELETE USING (auth.uid() = user_id);

-- Storage configuration is recommended to be done in the Supabase Dashboard,
-- but here are the SQL policies for the 'lectures' bucket if you use the SQL editor:
-- DO NOT RUN the following if you prefer GUI configuration.

-- CREATE POLICY "Users can manage their own lecture storage" ON storage.objects
--     FOR ALL USING (bucket_id = 'lectures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Published Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    topic_focus TEXT,
    difficulty TEXT NOT NULL DEFAULT 'mixed',
    question_count INT4 NOT NULL DEFAULT 0,
    total_points INT4 NOT NULL DEFAULT 0,
    estimated_duration_minutes INT4 NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'published',
    exam_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exams" ON public.exams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams" ON public.exams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams" ON public.exams
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams" ON public.exams
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS exams_user_created_at_idx
    ON public.exams (user_id, created_at DESC);

-- 3. Exam Attempts Table
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'completed',
    violations_count INT4 NOT NULL DEFAULT 0,
    objective_score INT4 NOT NULL DEFAULT 0,
    objective_max_score INT4 NOT NULL DEFAULT 0,
    attempt_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exam attempts" ON public.exam_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exam attempts" ON public.exam_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam attempts" ON public.exam_attempts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exam attempts" ON public.exam_attempts
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS exam_attempts_exam_created_at_idx
    ON public.exam_attempts (exam_id, created_at DESC);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exam_attempts TO authenticated;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exam_attempts TO anon;
