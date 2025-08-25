import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// User Profile schema for validation
const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string(),
});

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

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', ctx.session.user.id)
          .single();

        if (error) {
          // If profile doesn't exist, create it
          if (error.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: ctx.session.user.id,
                email: ctx.session.user.email!,
              })
              .select()
              .single();

            if (createError) {
              throw new Error(`Failed to create user profile: ${createError.message}`);
            }

            return userProfileSchema.parse(newProfile);
          }
          
          throw new Error(`Failed to fetch user profile: ${error.message}`);
        }

        return userProfileSchema.parse(data);
      } catch (error) {
        console.error('Error in getProfile:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to get user profile');
      }
    }),

  // Create user profile (used by signup process)
  createProfile: protectedProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            id: ctx.session.user.id,
            email: input.email,
          })
          .select()
          .single();

        if (error) {
          // If profile already exists, just return the existing one
          if (error.code === '23505') { // unique_violation
            const { data: existingProfile, error: fetchError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', ctx.session.user.id)
              .single();

            if (fetchError) {
              throw new Error(`Failed to fetch existing profile: ${fetchError.message}`);
            }

            return userProfileSchema.parse(existingProfile);
          }
          
          throw new Error(`Failed to create user profile: ${error.message}`);
        }

        return userProfileSchema.parse(data);
      } catch (error) {
        console.error('Error in createProfile:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create user profile');
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createSupabaseServerClient();
        const updateData: Record<string, any> = {};
        
        if (input.email) {
          updateData.email = input.email;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', ctx.session.user.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update user profile: ${error.message}`);
        }

        return userProfileSchema.parse(data);
      } catch (error) {
        console.error('Error in updateProfile:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update user profile');
      }
    }),

  // Check if user profile exists
  profileExists: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', ctx.session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new Error(`Failed to check profile existence: ${error.message}`);
        }

        return !!data;
      } catch (error) {
        console.error('Error in profileExists:', error);
        return false;
      }
    }),
});