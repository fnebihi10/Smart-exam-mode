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
