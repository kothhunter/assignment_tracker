import { TRPCError } from '@trpc/server';

/**
 * Utility function to handle errors consistently across tRPC procedures
 */
export function handleTRPCError(error: unknown, context: string): never {
  console.error(`TRPC Error in ${context}:`, error);
  
  if (error instanceof TRPCError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `${context}: ${error.message}`,
      cause: error,
    });
  }
  
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Unknown error in ${context}`,
    cause: error,
  });
}

/**
 * Validate that required environment variables are present
 */
export function validateEnvironment() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Application not configured - missing Supabase credentials',
    });
  }
}