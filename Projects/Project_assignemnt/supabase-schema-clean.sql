-- Project Assignment Tracker Database Schema
-- Clean installation - Run this in your Supabase SQL Editor

-- First, safely drop any existing conflicting tables
DO $$ 
BEGIN
    -- Drop tables in reverse dependency order
    DROP TABLE IF EXISTS public.plan_refinement_messages CASCADE;
    DROP TABLE IF EXISTS public.files CASCADE;
    DROP TABLE IF EXISTS public.assignment_plans CASCADE;
    DROP TABLE IF EXISTS public.assignments CASCADE;
    DROP TABLE IF EXISTS public.classes CASCADE;
    DROP TABLE IF EXISTS public.user_profiles CASCADE;
    
    -- Drop any existing functions
    DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
END $$;

-- Start fresh
BEGIN;

-- User Profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Classes table
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    instructor_name TEXT,
    semester TEXT,
    year INTEGER,
    syllabus_content TEXT,
    syllabus_file_url TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Assignments table
CREATE TABLE public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'archived')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    grade TEXT,
    feedback TEXT,
    requirements TEXT,
    resources JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Assignment Plans table (AI-generated plans)
CREATE TABLE public.assignment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_content TEXT NOT NULL,
    subtasks JSONB DEFAULT '[]'::jsonb,
    estimated_time_hours DECIMAL(5,2),
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    generated_by TEXT DEFAULT 'gpt-4',
    plan_version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Plan Refinement Messages table (AI chat refinements)
CREATE TABLE public.plan_refinement_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_plan_id UUID REFERENCES public.assignment_plans(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('user', 'assistant', 'system')) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- File uploads table (for syllabus and other files)
CREATE TABLE public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    file_type TEXT CHECK (file_type IN ('syllabus', 'assignment', 'resource', 'other')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_classes_user_id ON public.classes(user_id);
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_assignments_status ON public.assignments(status);
CREATE INDEX idx_assignment_plans_user_id ON public.assignment_plans(user_id);
CREATE INDEX idx_assignment_plans_assignment_id ON public.assignment_plans(assignment_id);
CREATE INDEX idx_plan_refinement_messages_plan_id ON public.plan_refinement_messages(assignment_plan_id);
CREATE INDEX idx_files_user_id ON public.files(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_refinement_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- User Profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Classes: Users can only see their own classes
CREATE POLICY "Users can view their own classes" ON public.classes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify their own classes" ON public.classes
    FOR ALL USING (auth.uid() = user_id);

-- Assignments: Users can only see their own assignments
CREATE POLICY "Users can view their own assignments" ON public.assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify their own assignments" ON public.assignments
    FOR ALL USING (auth.uid() = user_id);

-- Assignment Plans: Users can only see their own plans
CREATE POLICY "Users can view their own assignment plans" ON public.assignment_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify their own assignment plans" ON public.assignment_plans
    FOR ALL USING (auth.uid() = user_id);

-- Plan Refinement Messages: Users can only see their own messages
CREATE POLICY "Users can view their own refinement messages" ON public.plan_refinement_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify their own refinement messages" ON public.plan_refinement_messages
    FOR ALL USING (auth.uid() = user_id);

-- Files: Users can only see their own files
CREATE POLICY "Users can view their own files" ON public.files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify their own files" ON public.files
    FOR ALL USING (auth.uid() = user_id);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER handle_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_classes_updated_at BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_assignments_updated_at BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_assignment_plans_updated_at BEFORE UPDATE ON public.assignment_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- Verify the schema was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'classes', 'assignments', 'assignment_plans', 'plan_refinement_messages', 'files')
ORDER BY table_name, ordinal_position;