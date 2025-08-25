import { createTRPCRouter } from '@/server/api/trpc';
import { classRouter } from '@/server/api/routers/class';
import { assignmentRouter } from '@/server/api/routers/assignment';
import { aiRouter } from '@/server/api/routers/ai';
import { userRouter } from '@/server/api/routers/user';
import { syllabusRouter } from '@/server/api/routers/syllabus';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  class: classRouter,
  assignment: assignmentRouter,
  ai: aiRouter,
  user: userRouter,
  syllabus: syllabusRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;