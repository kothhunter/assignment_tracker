-- Migration to remove subtask functionality and replace with single prompt generation
-- This script removes subtask tables and simplifies assignment_plans for single prompt storage

-- First, drop dependent tables and policies
DROP POLICY IF EXISTS "Users can insert refinement messages for their own plans" ON public.refinement_messages;
DROP POLICY IF EXISTS "Users can access refinement messages for their own plans" ON public.refinement_messages;
DROP POLICY IF EXISTS "Users can insert sub_tasks for their own plans" ON public.sub_tasks;
DROP POLICY IF EXISTS "Users can access sub_tasks for their own plans" ON public.sub_tasks;

-- Drop the tables we no longer need
DROP TABLE IF EXISTS public.refinement_messages;
DROP TABLE IF EXISTS public.sub_tasks;

-- Modify assignment_plans table to store single generated prompt
ALTER TABLE public.assignment_plans 
DROP COLUMN IF EXISTS sub_tasks,
ADD COLUMN IF NOT EXISTS generated_prompt TEXT,
ADD COLUMN IF NOT EXISTS prompt_status TEXT DEFAULT 'pending' CHECK (prompt_status IN ('pending', 'generating', 'completed', 'failed'));

-- Update existing data (if any) to set default status
UPDATE public.assignment_plans SET prompt_status = 'pending' WHERE prompt_status IS NULL;

-- Keep existing RLS policies for assignment_plans as they are still valid
-- The existing policies will continue to work for the simplified structure

-- Grant necessary permissions for the modified table
GRANT ALL ON public.assignment_plans TO authenticated;
GRANT USAGE ON SEQUENCE public.assignment_plans_id_seq TO authenticated;