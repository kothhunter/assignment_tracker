import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Class } from '@/types';

export const classRouter = createTRPCRouter({
  // Get all classes for the authenticated user
  getAll: protectedProcedure.query(async ({ ctx }) => {
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

      // Query classes, sorted by id descending (newest first)
      const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .order('id', { ascending: false });

      if (error) {
        console.error('Failed to fetch classes:', error);
        throw new Error('Failed to fetch classes');
      }

      return (classes as Class[]) || [];
    } catch (error) {
      console.error('Class query error:', error);
      throw new Error('Failed to fetch classes');
    }
  }),

  // Get a single class by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
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

        const { data: classData, error } = await supabase
          .from('classes')
          .select('*')
          .eq('id', input.id)
          .eq('user_id', ctx.session.user.id)
          .single();

        if (error) {
          console.error('Failed to fetch class:', error);
          throw new Error(`Failed to fetch class with ID ${input.id}`);
        }

        return classData as Class;
      } catch (error) {
        console.error('Class by ID query error:', error);
        throw new Error(`Failed to fetch class with ID ${input.id}`);
      }
    }),

  // Create a new class
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Class name is required').max(255, 'Class name too long'),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

        // Check if class name already exists for this user
        const { data: existingClass } = await supabase
          .from('classes')
          .select('id')
          .eq('user_id', ctx.session.user.id)
          .eq('name', input.name.trim())
          .single();

        if (existingClass) {
          throw new Error('A class with this name already exists');
        }

        const { data: classData, error } = await supabase
          .from('classes')
          .insert({
            user_id: ctx.session.user.id,
            name: input.name.trim(),
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to create class:', error);
          throw new Error('Failed to create class');
        }

        return classData as Class;
      } catch (error) {
        console.error('Class creation error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to create class');
      }
    }),

  // Update an existing class
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, 'Class name is required').max(255, 'Class name too long'),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

        // Check if class name already exists for this user (excluding current class)
        const { data: existingClass } = await supabase
          .from('classes')
          .select('id')
          .eq('user_id', ctx.session.user.id)
          .eq('name', input.name.trim())
          .neq('id', input.id)
          .single();

        if (existingClass) {
          throw new Error('A class with this name already exists');
        }

        const { data: classData, error } = await supabase
          .from('classes')
          .update({ name: input.name.trim() })
          .eq('id', input.id)
          .eq('user_id', ctx.session.user.id)
          .select()
          .single();

        if (error) {
          console.error('Failed to update class:', error);
          throw new Error('Failed to update class');
        }

        return classData as Class;
      } catch (error) {
        console.error('Class update error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to update class');
      }
    }),

  // Delete a class
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
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

        // Check for dependent assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from('assignments')
          .select('id')
          .eq('class_id', input.id)
          .eq('user_id', ctx.session.user.id);

        if (assignmentError) {
          console.error('Failed to check for dependent assignments:', assignmentError);
          throw new Error('Failed to check for dependent assignments');
        }

        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.session.user.id);

        if (error) {
          console.error('Failed to delete class:', error);
          throw new Error('Failed to delete class');
        }

        const assignmentCount = assignments?.length || 0;
        return { 
          message: 'Class deleted successfully',
          deletedAssignments: assignmentCount
        };
      } catch (error) {
        console.error('Class deletion error:', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to delete class');
      }
    }),

  // Get assignment count for a class
  getAssignmentCount: protectedProcedure
    .input(z.object({ id: z.number() }))
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

        const { count, error } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', input.id)
          .eq('user_id', ctx.session.user.id);

        if (error) {
          console.error('Failed to count assignments:', error);
          throw new Error('Failed to count assignments');
        }

        return count || 0;
      } catch (error) {
        console.error('Assignment count error:', error);
        throw new Error('Failed to count assignments');
      }
    }),
});