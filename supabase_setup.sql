-- Create tables for Smart Exam Mode roles, lectures, exams, and attempts.

-- 1. User profiles and roles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    requested_role TEXT NOT NULL DEFAULT 'student' CHECK (requested_role IN ('teacher', 'student')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS requested_role TEXT NOT NULL DEFAULT 'student';

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_requested_role_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_requested_role_check CHECK (requested_role IN ('teacher', 'student'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role FROM public.profiles WHERE id = auth.uid()),
        'student'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = target_user_id
          AND role = 'teacher'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_profile_id(target_user_id_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    BEGIN
        target_user_id := target_user_id_text::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RETURN FALSE;
    END;

    RETURN public.is_teacher_profile(target_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, requested_role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'student',
        CASE
            WHEN NEW.raw_user_meta_data->>'requested_role' = 'teacher' THEN 'teacher'
            ELSE 'student'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        requested_role = COALESCE(public.profiles.requested_role, EXCLUDED.requested_role),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
    target_user_id UUID,
    next_role TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_profile public.profiles;
BEGIN
    IF public.current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles.';
    END IF;

    IF next_role NOT IN ('teacher', 'student') THEN
        RAISE EXCEPTION 'Admins can assign teacher or student roles only.';
    END IF;

    UPDATE public.profiles
    SET role = next_role, requested_role = next_role, updated_at = NOW()
    WHERE id = target_user_id
    RETURNING * INTO updated_profile;

    IF updated_profile.id IS NULL THEN
        RAISE EXCEPTION 'User profile not found.';
    END IF;

    RETURN updated_profile;
END;
$$;

DROP POLICY IF EXISTS "Profiles are visible to owners and admins" ON public.profiles;
CREATE POLICY "Profiles are visible to owners and admins" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = public.current_user_role()
        AND requested_role IN ('teacher', 'student')
    );

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_profile_id(TEXT) TO authenticated;

-- Bootstrap your first admin manually after signup:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';

-- 2. Lecture Files Table
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
DROP POLICY IF EXISTS "Users can view their own lecture files" ON public.lecture_files;
DROP POLICY IF EXISTS "Users and students can view allowed lecture files" ON public.lecture_files;
CREATE POLICY "Users and students can view allowed lecture files" ON public.lecture_files
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'student'
            AND public.is_teacher_profile(user_id)
        )
    );

-- User can only insert their own files
DROP POLICY IF EXISTS "Users can insert their own lecture files" ON public.lecture_files;
CREATE POLICY "Users can insert their own lecture files" ON public.lecture_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can only delete their own files
DROP POLICY IF EXISTS "Users can delete their own lecture files" ON public.lecture_files;
CREATE POLICY "Users can delete their own lecture files" ON public.lecture_files
    FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lecture_files TO authenticated;

-- Storage configuration is recommended to be done in the Supabase Dashboard,
-- but here are the SQL policies for the 'lectures' bucket if you use the SQL editor:
-- DO NOT RUN the following if you prefer GUI configuration.

-- CREATE POLICY "Users can manage their own lecture storage" ON storage.objects
--     FOR ALL USING (bucket_id = 'lectures' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Students can read teacher lecture storage" ON storage.objects;
CREATE POLICY "Students can read teacher lecture storage" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'lectures'
        AND (
            (storage.foldername(name))[1] = auth.uid()::TEXT
            OR public.current_user_role() = 'admin'
            OR (
                public.current_user_role() = 'student'
                AND public.is_teacher_profile_id((storage.foldername(name))[1])
            )
        )
    );

-- 3. Exams Table
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
    status TEXT NOT NULL DEFAULT 'draft',
    exam_kind TEXT NOT NULL DEFAULT 'practice',
    exam_payload JSONB NOT NULL,
    published_at TIMESTAMPTZ,
    live_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS exam_kind TEXT NOT NULL DEFAULT 'practice';

ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS live_until TIMESTAMPTZ;

ALTER TABLE public.exams
    DROP CONSTRAINT IF EXISTS exams_status_check;

ALTER TABLE public.exams
    ADD CONSTRAINT exams_status_check CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE public.exams
    DROP CONSTRAINT IF EXISTS exams_exam_kind_check;

ALTER TABLE public.exams
    ADD CONSTRAINT exams_exam_kind_check CHECK (exam_kind IN ('official', 'practice'));

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own exams" ON public.exams;
DROP POLICY IF EXISTS "Users and roles can view exams" ON public.exams;
CREATE POLICY "Users and roles can view exams" ON public.exams
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.current_user_role() = 'admin'
        OR (
            auth.uid() IS NOT NULL
            AND public.current_user_role() = 'student'
            AND exam_kind = 'official'
            AND status = 'published'
            AND live_until > NOW()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own exams" ON public.exams;
DROP POLICY IF EXISTS "Teachers and students can create scoped exams" ON public.exams;
CREATE POLICY "Teachers and students can create scoped exams" ON public.exams
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            (
                public.current_user_role() = 'teacher'
                AND exam_kind = 'official'
                AND status = 'draft'
            )
            OR (
                public.current_user_role() = 'student'
                AND exam_kind = 'practice'
            )
        )
    );

DROP POLICY IF EXISTS "Users can update their own exams" ON public.exams;
DROP POLICY IF EXISTS "Teachers and students can update scoped exams" ON public.exams;
CREATE POLICY "Teachers and students can update scoped exams" ON public.exams
    FOR UPDATE USING (
        auth.uid() = user_id
        AND (
            (public.current_user_role() = 'teacher' AND exam_kind = 'official')
            OR (public.current_user_role() = 'student' AND exam_kind = 'practice')
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        AND (
            (public.current_user_role() = 'teacher' AND exam_kind = 'official')
            OR (public.current_user_role() = 'student' AND exam_kind = 'practice')
        )
    );

DROP POLICY IF EXISTS "Users can delete their own exams" ON public.exams;
DROP POLICY IF EXISTS "Teachers and students can delete scoped exams" ON public.exams;
CREATE POLICY "Teachers and students can delete scoped exams" ON public.exams
    FOR DELETE USING (
        auth.uid() = user_id
        AND (
            (public.current_user_role() = 'teacher' AND exam_kind = 'official')
            OR (public.current_user_role() = 'student' AND exam_kind = 'practice')
        )
    );

CREATE INDEX IF NOT EXISTS exams_user_created_at_idx
    ON public.exams (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS exams_live_official_idx
    ON public.exams (exam_kind, status, live_until DESC);

-- 4. Exam Attempts Table
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

-- Keep this lookup outside normal RLS evaluation to avoid exams <-> exam_attempts policy recursion.
CREATE OR REPLACE FUNCTION public.user_has_exam_attempt(target_exam_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.exam_attempts
        WHERE exam_attempts.exam_id = target_exam_id
          AND exam_attempts.user_id = auth.uid()
    );
$$;

DROP POLICY IF EXISTS "Users and roles can view exams" ON public.exams;
CREATE POLICY "Users and roles can view exams" ON public.exams
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.current_user_role() = 'admin'
        OR (
            auth.uid() IS NOT NULL
            AND public.current_user_role() = 'student'
            AND exam_kind = 'official'
            AND (
                (
                    status = 'published'
                    AND live_until > NOW()
                )
                OR public.user_has_exam_attempt(exams.id)
            )
        )
    );

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Attempts are visible to students, owning teachers, and admins" ON public.exam_attempts;
CREATE POLICY "Attempts are visible to students, owning teachers, and admins" ON public.exam_attempts
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.current_user_role() = 'admin'
        OR EXISTS (
            SELECT 1
            FROM public.exams
            WHERE exams.id = exam_attempts.exam_id
              AND exams.user_id = auth.uid()
              AND exams.exam_kind = 'official'
              AND public.current_user_role() = 'teacher'
        )
    );

DROP POLICY IF EXISTS "Users can insert their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students can insert their own exam attempts" ON public.exam_attempts;
CREATE POLICY "Students can insert their own exam attempts" ON public.exam_attempts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND public.current_user_role() = 'student'
        AND EXISTS (
            SELECT 1
            FROM public.exams
            WHERE exams.id = exam_attempts.exam_id
              AND (
                (
                  exams.exam_kind = 'practice'
                  AND exams.user_id = auth.uid()
                )
                OR (
                  exams.exam_kind = 'official'
                  AND exams.status = 'published'
                  AND exams.live_until > NOW()
                )
              )
        )
    );

DROP POLICY IF EXISTS "Users can update their own exam attempts" ON public.exam_attempts;
CREATE POLICY "Users can update their own exam attempts" ON public.exam_attempts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students and owning teachers can delete exam attempts" ON public.exam_attempts;
CREATE POLICY "Students and owning teachers can delete exam attempts" ON public.exam_attempts
    FOR DELETE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.exams
            WHERE exams.id = exam_attempts.exam_id
              AND exams.user_id = auth.uid()
              AND exams.exam_kind = 'official'
              AND public.current_user_role() = 'teacher'
        )
    );

CREATE OR REPLACE FUNCTION public.teacher_can_view_attempt_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.exam_attempts
        JOIN public.exams ON exams.id = exam_attempts.exam_id
        WHERE exam_attempts.user_id = target_user_id
          AND exams.user_id = auth.uid()
          AND exams.exam_kind = 'official'
          AND public.current_user_role() = 'teacher'
    );
$$;

DROP POLICY IF EXISTS "Teachers can view profiles for their exam attempts" ON public.profiles;
CREATE POLICY "Teachers can view profiles for their exam attempts" ON public.profiles
    FOR SELECT USING (public.teacher_can_view_attempt_profile(id));

CREATE INDEX IF NOT EXISTS exam_attempts_exam_created_at_idx
    ON public.exam_attempts (exam_id, created_at DESC);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exam_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_exam_attempt(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_can_view_attempt_profile(UUID) TO authenticated;

REVOKE ALL ON TABLE public.exams FROM anon;
REVOKE ALL ON TABLE public.exam_attempts FROM anon;

-- 5. Study Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert their own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_created_at_idx
    ON public.tasks (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;
