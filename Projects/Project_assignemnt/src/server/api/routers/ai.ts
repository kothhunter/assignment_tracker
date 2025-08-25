import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseSyllabusWithAI, validateOpenAIConfig, generateStructuredPromptWithAI } from '@/lib/openai';
import type { Class, AssignmentPlan, AssignmentWithClass } from '@/types';

export const aiRouter = createTRPCRouter({
  // Parse syllabus content and extract assignments
  parseSyllabus: protectedProcedure
    .input(
      z.object({
        content: z.string()
          .min(10, 'Syllabus content must be at least 10 characters')
          .max(50000, 'Syllabus content is too large (max 50,000 characters)')
          .refine(content => content.trim().length > 0, 'Syllabus content cannot be empty or whitespace only'),
        classId: z.number().positive('Valid class ID is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate OpenAI configuration
        if (!validateOpenAIConfig()) {
          throw new Error('AI parsing service is not properly configured');
        }

        // Verify class ownership and get class details
        const cookieStore = cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options);
                  });
                } catch {
                  // Server Component context - ignore cookie setting errors
                }
              },
            },
          }
        );

        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', input.classId)
          .eq('user_id', ctx.session.user.id)
          .single();

        if (classError || !classData) {
          console.error('Class authorization failed:', classError);
          throw new Error('Class not found or access denied');
        }

        const classInfo = classData as Class;

        // Sanitize input content to prevent prompt injection
        const sanitizedContent = input.content
          .replace(/[^\w\s\-.,!?;:()\[\]{}\/\\'"@#$%&*+=<>|\n\r\t]/g, '') // Remove special characters that could be used for injection
          .trim();

        // Log parsing attempt for debugging and monitoring
        console.log(`AI parsing attempt for user ${ctx.session.user.id}, class ${input.classId}, content length: ${sanitizedContent.length}`);

        // Parse syllabus with AI
        const aiResponse = await parseSyllabusWithAI(sanitizedContent, classInfo.name);

        // Transform AI response to match our assignment structure
        const processedAssignments = aiResponse.assignments.map((assignment) => ({
          title: assignment.title,
          due_date: assignment.due_date,
          description: assignment.description || '',
          type: assignment.type || 'assignment',
          points: assignment.points,
          class_id: input.classId,
          // Note: These assignments are not saved to database yet - that happens in Story 2.3
        }));

        // Log successful parsing
        console.log(`AI parsing successful: extracted ${processedAssignments.length} assignments`);

        return {
          assignments: processedAssignments,
          confidence: aiResponse.confidence || 0.8,
          notes: aiResponse.notes,
          className: classInfo.name,
          message: `Successfully extracted ${processedAssignments.length} assignments from syllabus`,
        };
      } catch (error) {
        // Log error for debugging
        console.error('AI parsing failed:', error);
        
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to parse syllabus content');
      }
    }),

  // Validate reviewed assignments before saving
  validateReviewedAssignments: protectedProcedure
    .input(
      z.object({
        assignments: z.array(
          z.object({
            title: z.string().min(1, 'Assignment title is required').max(200, 'Title is too long'),
            due_date: z.string().min(1, 'Due date is required').refine((date) => {
              const parsed = new Date(date);
              return !isNaN(parsed.getTime()) && parsed > new Date();
            }, 'Due date must be a valid future date'),
            description: z.string().max(1000, 'Description is too long').optional(),
            type: z.string().max(50, 'Type is too long').optional(),
            points: z.number().min(0, 'Points must be non-negative').optional(),
            class_id: z.number().positive('Valid class ID is required'),
          })
        ).min(1, 'At least one assignment is required'),
        classId: z.number().positive('Valid class ID is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify class ownership
        const cookieStore = cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options);
                  });
                } catch {
                  // Server Component context - ignore cookie setting errors
                }
              },
            },
          }
        );

        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', input.classId)
          .eq('user_id', ctx.session.user.id)
          .single();

        if (classError || !classData) {
          console.error('Class authorization failed:', classError);
          throw new Error('Class not found or access denied');
        }

        // Validate all assignments belong to the correct class
        const invalidAssignments = input.assignments.filter(
          assignment => assignment.class_id !== input.classId
        );

        if (invalidAssignments.length > 0) {
          throw new Error('All assignments must belong to the specified class');
        }

        // Additional business logic validation
        const duplicateTitles = input.assignments
          .map(a => a.title.toLowerCase())
          .filter((title, index, arr) => arr.indexOf(title) !== index);

        if (duplicateTitles.length > 0) {
          console.warn('Duplicate assignment titles detected:', duplicateTitles);
          // Allow duplicates but log warning
        }

        // Log validation success
        console.log(`Assignment review validation successful for user ${ctx.session.user.id}, class ${input.classId}: ${input.assignments.length} assignments validated`);

        return {
          valid: true,
          assignments: input.assignments,
          message: `Successfully validated ${input.assignments.length} assignments`,
          className: classData.name,
        };
      } catch (error) {
        console.error('Assignment review validation failed:', error);
        
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to validate reviewed assignments');
      }
    }),

  // Get assignment plan by assignment ID
  getPlan: protectedProcedure
    .input(z.object({ assignmentId: z.number().positive('Valid assignment ID is required') }))
    .query(async ({ ctx, input }) => {
      try {
        const cookieStore = cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options);
                  });
                } catch {
                  // Server Component context - ignore cookie setting errors
                }
              },
            },
          }
        );

        // Verify assignment ownership first
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, user_id')
          .eq('id', input.assignmentId)
          .eq('user_id', ctx.session.user.id)
          .single();

        if (assignmentError || !assignment) {
          console.error('Assignment authorization failed:', assignmentError);
          throw new Error('Assignment not found or access denied');
        }

        // Get assignment plan
        const { data: plan, error: planError } = await supabase
          .from('assignment_plans')
          .select('*')
          .eq('assignment_id', input.assignmentId)
          .single();

        if (planError) {
          if (planError.code === 'PGRST116') {
            // No plan found - return null instead of error
            return null;
          }
          if (planError.code === 'PGRST205' || planError.message?.includes('assignment_plans')) {
            throw new Error('Database setup incomplete: The assignment_plans table is missing. Please run the database migration script.');
          }
          console.error('Failed to fetch assignment plan:', planError);
          throw new Error('Failed to fetch assignment plan');
        }

        return plan as AssignmentPlan;
      } catch (error) {
        console.error('Get plan error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to fetch assignment plan');
      }
    }),

  // Generate structured learning prompt for assignment
  generatePrompt: protectedProcedure
    .input(z.object({ assignmentId: z.number().positive('Valid assignment ID is required') }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate OpenAI configuration
        if (!validateOpenAIConfig()) {
          throw new Error('AI prompt generation service is not properly configured');
        }

        const cookieStore = cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options);
                  });
                } catch {
                  // Server Component context - ignore cookie setting errors
                }
              },
            },
          }
        );

        // Get assignment plan with original instructions
        const { data: plan, error: planError } = await supabase
          .from('assignment_plans')
          .select('id, assignment_id, original_instructions, prompt_status')
          .eq('assignment_id', input.assignmentId)
          .single();

        if (planError || !plan) {
          console.error('Assignment plan not found:', planError);
          if (planError?.code === 'PGRST116') {
            throw new Error('No assignment plan found. Please enter assignment instructions first.');
          }
          if (planError?.code === 'PGRST205' || planError?.message?.includes('assignment_plans')) {
            throw new Error('Database setup incomplete: The assignment_plans table is missing. Please run the database migration script.');
          }
          throw new Error('Assignment plan not found. Please create a plan first.');
        }

        // Verify assignment ownership
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, user_id, title')
          .eq('id', input.assignmentId)
          .eq('user_id', ctx.session.user.id)
          .single();

        if (assignmentError || !assignment) {
          console.error('Assignment authorization failed:', assignmentError);
          throw new Error('Assignment not found or access denied');
        }

        // Update status to generating
        await supabase
          .from('assignment_plans')
          .update({ prompt_status: 'generating' })
          .eq('id', plan.id);

        // Generate structured prompt with AI
        console.log(`Generating structured prompt for assignment ${input.assignmentId}, user ${ctx.session.user.id}`);
        const generatedPrompt = await generateStructuredPromptWithAI(
          plan.original_instructions,
          assignment.title
        );

        // Update assignment plan with generated prompt
        const { error: updateError } = await supabase
          .from('assignment_plans')
          .update({ 
            generated_prompt: generatedPrompt,
            prompt_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', plan.id);

        if (updateError) {
          console.error('Failed to save generated prompt:', updateError);
          // Update status to failed
          await supabase
            .from('assignment_plans')
            .update({ prompt_status: 'failed' })
            .eq('id', plan.id);
          throw new Error('Failed to save generated prompt');
        }

        console.log(`Successfully generated structured prompt for assignment ${input.assignmentId}`);

        return {
          generated_prompt: generatedPrompt,
          prompt_status: 'completed',
          message: 'Successfully generated structured learning prompt',
        };
      } catch (error) {
        console.error('Generate prompt error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to generate prompt');
      }
    }),
});