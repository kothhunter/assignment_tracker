import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseSyllabusWithAI } from '@/lib/openai';

// Helper function to create server Supabase client
const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerClient(
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
};

// Validation schema
const syllabusUploadSchema = z.object({
  class_id: z.number().min(1, 'Please select a class'),
  text_content: z.string().min(100, 'Syllabus content must be at least 100 characters'),
});

export const syllabusRouter = createTRPCRouter({
  // Upload syllabus text content and generate assignments
  uploadText: protectedProcedure
    .input(syllabusUploadSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseServerClient();

        // Verify class ownership and get class name
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id, name')
          .eq('id', input.class_id)
          .eq('user_id', ctx.session.user.id)
          .single();

        if (classError || !classData) {
          throw new Error('Class not found or access denied');
        }

        console.log('🤖 Starting AI parsing for syllabus...');

        // Parse syllabus with AI to extract assignments
        const aiResponse = await parseSyllabusWithAI(
          input.text_content,
          classData.name
        );

        console.log('✅ AI parsing completed, found', aiResponse.assignments.length, 'assignments');

        // Create assignments in the database
        const createdAssignments = [];
        
        for (const assignment of aiResponse.assignments) {
          try {
            const { data: newAssignment, error: assignmentError } = await supabase
              .from('assignments')
              .insert({
                user_id: ctx.session.user.id,
                class_id: input.class_id,
                title: assignment.title,
                due_date: assignment.due_date,
                status: 'incomplete',
              })
              .select('*')
              .single();

            if (assignmentError) {
              console.error('Failed to create assignment:', assignment.title, assignmentError);
              // Continue with other assignments even if one fails
              continue;
            }

            createdAssignments.push(newAssignment);
            console.log('✅ Created assignment:', assignment.title);
          } catch (error) {
            console.error('Error creating assignment:', assignment.title, error);
            // Continue with other assignments
            continue;
          }
        }

        const response = {
          success: true,
          message: `Successfully parsed syllabus and created ${createdAssignments.length} assignments!`,
          assignmentsFound: aiResponse.assignments.length,
          assignmentsCreated: createdAssignments.length,
          confidence: aiResponse.confidence,
          notes: aiResponse.notes,
          createdAssignments,
        };

        console.log('🎉 Syllabus processing completed:', response);

        return response;
      } catch (error) {
        console.error('❌ Syllabus upload error:', error);
        throw new Error(
          error instanceof Error ? error.message : 'Failed to process syllabus'
        );
      }
    }),
});