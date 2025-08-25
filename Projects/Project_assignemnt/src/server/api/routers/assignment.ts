import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AssignmentWithClass, AssignmentPlan } from '@/types';

// Create reusable supabase client factory
const createSupabaseClient = () => {
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

// Common assignment selection query
const ASSIGNMENT_SELECT_QUERY = `
  id,
  user_id,
  class_id,
  title,
  due_date,
  status,
  class:classes!inner (
    id,
    user_id,
    name
  )
`;

// Validation schemas
const createManualSchema = z.object({
  title: z.string().min(1, 'Assignment title is required'),
  class_id: z.number(),
  due_date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format'),
});

const updateStatusSchema = z.object({
  id: z.number(),
  status: z.enum(['incomplete', 'complete']),
});

const updateSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  dueDate: z.date().optional(),
});

const createBatchSchema = z.object({
  assignments: z.array(z.object({
    title: z.string().min(1, 'Assignment title is required').max(200, 'Title is too long'),
    due_date: z.string().refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid date format'),
    description: z.string().max(1000, 'Description is too long').optional(),
    type: z.string().max(50, 'Type is too long').optional(),
    points: z.number().min(0, 'Points must be non-negative').max(10000, 'Points value is too high').optional(),
    class_id: z.number().positive('Invalid class ID'),
  })).min(1, 'At least one assignment is required').max(100, 'Too many assignments in batch'),
});

const initiatePlanSchema = z.object({
  assignment_id: z.number().positive('Invalid assignment ID'),
  instructions: z.string().min(1, 'Assignment instructions are required').max(5000, 'Instructions are too long'),
});

// Utility function to verify class ownership
const verifyClassOwnership = async (supabase: any, classId: number, userId: string) => {
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('user_id', userId)
    .single();

  if (classError || !classData) {
    throw new Error(`Class ${classId} not found or does not belong to user`);
  }
  return classData;
};

export const assignmentRouter = createTRPCRouter({
  // Get a single assignment by ID for the authenticated user
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

        const { data: assignment, error } = await supabase
          .from('assignments')
          .select(ASSIGNMENT_SELECT_QUERY)
          .eq('id', input.id)
          .eq('user_id', ctx.session.user.id)
          .single();

        if (error) {
          console.error('Failed to fetch assignment:', error);
          throw new Error('Assignment not found or access denied');
        }

        return assignment as unknown as AssignmentWithClass;
      } catch (error) {
        console.error('Assignment by ID query error:', error);
        throw new Error('Assignment not found or access denied');
      }
    }),

  // Get all assignments for the authenticated user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const supabase = createSupabaseClient();

      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(ASSIGNMENT_SELECT_QUERY)
        .eq('user_id', ctx.session.user.id);

      if (error) {
        console.error('Failed to fetch assignments:', error);
        throw new Error('Failed to fetch assignments');
      }

      const assignmentList = (assignments as unknown as AssignmentWithClass[]) || [];
      
      // Custom sorting: Incomplete assignments first (overdue then by due date), completed at bottom
      const sortedAssignments = assignmentList.sort((a, b) => {
        const now = new Date();
        const aDate = new Date(a.due_date);
        const bDate = new Date(b.due_date);
        
        // If both have same status, sort by due date logic
        if (a.status === b.status) {
          if (a.status === 'complete') {
            // For completed assignments, maintain due date order (doesn't matter much since they're at bottom)
            return aDate.getTime() - bDate.getTime();
          } else {
            // For incomplete assignments: overdue first, then by due date ascending
            const aOverdue = aDate < now;
            const bOverdue = bDate < now;
            
            if (aOverdue && !bOverdue) return -1; // a is overdue, b is not
            if (!aOverdue && bOverdue) return 1;  // b is overdue, a is not
            
            // Both overdue or both upcoming - sort by due date
            return aDate.getTime() - bDate.getTime();
          }
        }
        
        // Different statuses: incomplete comes first
        if (a.status === 'incomplete' && b.status === 'complete') return -1;
        if (a.status === 'complete' && b.status === 'incomplete') return 1;
        
        return 0;
      });

      return sortedAssignments;
    } catch (error) {
      console.error('Assignment query error:', error);
      throw new Error('Failed to fetch assignments');
    }
  }),

  // Get assignments by class ID
  getByClass: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

        const { data: assignments, error } = await supabase
          .from('assignments')
          .select(ASSIGNMENT_SELECT_QUERY)
          .eq('user_id', ctx.session.user.id)
          .eq('class_id', input.classId);

        if (error) {
          console.error('Failed to fetch assignments by class:', error);
          throw new Error(`Failed to fetch assignments for class ${input.classId}`);
        }

        const assignmentList = (assignments as unknown as AssignmentWithClass[]) || [];
        
        // Apply same sorting logic as getAll
        const sortedAssignments = assignmentList.sort((a, b) => {
          const now = new Date();
          const aDate = new Date(a.due_date);
          const bDate = new Date(b.due_date);
          
          // If both have same status, sort by due date logic
          if (a.status === b.status) {
            if (a.status === 'complete') {
              // For completed assignments, maintain due date order
              return aDate.getTime() - bDate.getTime();
            } else {
              // For incomplete assignments: overdue first, then by due date ascending
              const aOverdue = aDate < now;
              const bOverdue = bDate < now;
              
              if (aOverdue && !bOverdue) return -1; // a is overdue, b is not
              if (!aOverdue && bOverdue) return 1;  // b is overdue, a is not
              
              // Both overdue or both upcoming - sort by due date
              return aDate.getTime() - bDate.getTime();
            }
          }
          
          // Different statuses: incomplete comes first
          if (a.status === 'incomplete' && b.status === 'complete') return -1;
          if (a.status === 'complete' && b.status === 'incomplete') return 1;
          
          return 0;
        });

        return sortedAssignments;
      } catch (error) {
        console.error('Assignment by class query error:', error);
        throw new Error(`Failed to fetch assignments for class ${input.classId}`);
      }
    }),

  // Create a new assignment manually
  createManual: protectedProcedure
    .input(createManualSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

        // Verify class ownership
        await verifyClassOwnership(supabase, input.class_id, ctx.session.user.id);

        // Create the assignment
        const { data: assignment, error } = await supabase
          .from('assignments')
          .insert({
            user_id: ctx.session.user.id,
            class_id: input.class_id,
            title: input.title,
            due_date: input.due_date,
            status: 'incomplete',
          })
          .select(ASSIGNMENT_SELECT_QUERY)
          .single();

        if (error) {
          console.error('Failed to create assignment:', error);
          throw new Error('Failed to create assignment');
        }

        return assignment as unknown as AssignmentWithClass;
      } catch (error) {
        console.error('Assignment creation error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to create assignment');
      }
    }),

  // Create a new assignment (legacy method for backward compatibility)
  create: protectedProcedure
    .input(
      z.object({
        classId: z.number(),
        title: z.string().min(1),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

        // Verify class ownership
        await verifyClassOwnership(supabase, input.classId, ctx.session.user.id);

        const { data: assignment, error } = await supabase
          .from('assignments')
          .insert({
            user_id: ctx.session.user.id,
            class_id: input.classId,
            title: input.title,
            due_date: input.dueDate.toISOString(),
            status: 'incomplete',
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to create assignment:', error);
          throw new Error('Failed to create assignment');
        }

        return assignment;
      } catch (error) {
        console.error('Assignment creation error:', error);
        throw new Error('Failed to create assignment');
      }
    }),

  // Update assignment status
  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

        const { error } = await supabase
          .from('assignments')
          .update({ status: input.status })
          .eq('id', input.id)
          .eq('user_id', ctx.session.user.id);

        if (error) {
          console.error('Failed to update assignment status:', error);
          throw new Error('Failed to update assignment status');
        }

        return { message: 'Assignment status updated successfully' };
      } catch (error) {
        console.error('Assignment status update error:', error);
        throw new Error('Failed to update assignment status');
      }
    }),

  // Update an assignment
  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

        const updateData: Partial<{ title: string; due_date: string }> = {};
        if (input.title) updateData.title = input.title;
        if (input.dueDate) updateData.due_date = input.dueDate.toISOString();

        const { error } = await supabase
          .from('assignments')
          .update(updateData)
          .eq('id', input.id)
          .eq('user_id', ctx.session.user.id);

        if (error) {
          console.error('Failed to update assignment:', error);
          throw new Error('Failed to update assignment');
        }

        return { message: 'Assignment updated successfully' };
      } catch (error) {
        console.error('Assignment update error:', error);
        throw new Error('Failed to update assignment');
      }
    }),

  // Delete an assignment
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

        const { error } = await supabase
          .from('assignments')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.session.user.id);

        if (error) {
          console.error('Failed to delete assignment:', error);
          throw new Error('Failed to delete assignment');
        }

        return { message: 'Assignment deleted successfully' };
      } catch (error) {
        console.error('Assignment deletion error:', error);
        throw new Error('Failed to delete assignment');
      }
    }),

  // Create multiple assignments in a batch (transactional)
  createBatch: protectedProcedure
    .input(createBatchSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();
        const userId = ctx.session.user.id;

        // Verify all class IDs belong to the user and collect unique class IDs
        const uniqueClassIds = Array.from(new Set(input.assignments.map(a => a.class_id)));
        
        // Verify class ownership for all unique classes in parallel for better performance
        await Promise.all(
          uniqueClassIds.map(classId => verifyClassOwnership(supabase, classId, userId))
        );

        // Check for duplicates within the same class based on title and due_date
        for (const assignment of input.assignments) {
          const { data: existingAssignments, error: duplicateError } = await supabase
            .from('assignments')
            .select('id, title, due_date, class_id')
            .eq('user_id', userId)
            .eq('class_id', assignment.class_id)
            .eq('title', assignment.title)
            .eq('due_date', assignment.due_date);

          if (duplicateError) {
            console.error('Error checking for duplicates:', duplicateError);
            throw new Error('Failed to validate assignment uniqueness');
          }

          if (existingAssignments && existingAssignments.length > 0) {
            throw new Error(`Duplicate assignment found: "${assignment.title}" is already scheduled for ${assignment.due_date}`);
          }
        }

        // Prepare assignment data for batch insert
        const assignmentsToInsert = input.assignments.map(assignment => ({
          user_id: userId,
          class_id: assignment.class_id,
          title: assignment.title,
          due_date: assignment.due_date,
          status: 'incomplete' as const,
          // Optional fields - only include if they have values
          ...(assignment.description && { description: assignment.description }),
          ...(assignment.type && { type: assignment.type }),
          ...(assignment.points !== undefined && { points: assignment.points }),
        }));

        // Execute transactional batch insert
        const { data: createdAssignments, error: insertError } = await supabase
          .from('assignments')
          .insert(assignmentsToInsert)
          .select(ASSIGNMENT_SELECT_QUERY);

        if (insertError) {
          console.error('Failed to create batch assignments:', insertError);
          throw new Error('Failed to save assignments. Please try again.');
        }

        if (!createdAssignments || createdAssignments.length !== input.assignments.length) {
          throw new Error('Not all assignments were saved successfully');
        }

        console.log(`Successfully created ${createdAssignments.length} assignments`);
        
        return {
          assignments: createdAssignments as unknown as AssignmentWithClass[],
          message: `Successfully saved ${createdAssignments.length} assignments`,
          count: createdAssignments.length,
        };
      } catch (error) {
        console.error('Batch assignment creation error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to save assignments');
      }
    }),

  // Initiate AI planning for an assignment
  initiatePlan: protectedProcedure
    .input(initiatePlanSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();
        const userId = ctx.session.user.id;

        // Verify assignment exists and belongs to user
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .select('id, user_id, class_id')
          .eq('id', input.assignment_id)
          .eq('user_id', userId)
          .single();

        if (assignmentError || !assignment) {
          console.error('Assignment verification failed:', assignmentError);
          throw new Error('Assignment not found or access denied');
        }

        // Check if a plan already exists for this assignment
        const { data: existingPlan, error: existingPlanError } = await supabase
          .from('assignment_plans')
          .select('id')
          .eq('assignment_id', input.assignment_id)
          .single();

        if (existingPlanError && existingPlanError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected
          if (existingPlanError.code === 'PGRST205' || existingPlanError.message?.includes('assignment_plans')) {
            throw new Error('Database setup incomplete: The assignment_plans table is missing. Please run the database migration script.');
          }
          console.error('Error checking for existing plan:', existingPlanError);
          throw new Error('Failed to verify plan status');
        }

        if (existingPlan) {
          throw new Error('A plan already exists for this assignment');
        }

        // Create initial AssignmentPlan record
        const { data: newPlan, error: planError } = await supabase
          .from('assignment_plans')
          .insert({
            assignment_id: input.assignment_id,
            original_instructions: input.instructions,
            prompt_status: 'pending',
          })
          .select('id, assignment_id, original_instructions, prompt_status')
          .single();

        if (planError) {
          console.error('Failed to create assignment plan:', planError);
          if (planError.code === 'PGRST205' || planError.message?.includes('assignment_plans')) {
            throw new Error('Database setup incomplete: The assignment_plans table is missing. Please run the database migration script.');
          }
          throw new Error('Failed to create assignment plan');
        }

        console.log(`Successfully created plan for assignment ${input.assignment_id}`);
        
        return {
          plan: newPlan as AssignmentPlan,
          message: 'Assignment plan created successfully',
        };
      } catch (error) {
        console.error('Assignment plan creation error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to create assignment plan');
      }
    }),

  // Update assignment plan instructions
  updatePlan: protectedProcedure
    .input(z.object({
      assignmentId: z.number().positive('Valid assignment ID is required'),
      instructions: z.string().min(1, 'Instructions cannot be empty').max(5000, 'Instructions too long'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseClient();

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

        // Update the assignment plan instructions
        const { error: updateError } = await supabase
          .from('assignment_plans')
          .update({ 
            original_instructions: input.instructions,
            updated_at: new Date().toISOString()
          })
          .eq('assignment_id', input.assignmentId);

        if (updateError) {
          console.error('Failed to update assignment plan:', updateError);
          throw new Error('Failed to update assignment plan');
        }

        console.log(`Successfully updated plan instructions for assignment ${input.assignmentId}`);
        
        return {
          message: 'Assignment plan updated successfully',
        };
      } catch (error) {
        console.error('Assignment plan update error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to update assignment plan');
      }
    }),
});