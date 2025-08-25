# API Specification (tRPC)

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from './trpc';

// Router for managing Classes
const classRouter = createTRPCRouter({
  getAll: protectedProcedure.query(/* ... */),
  create: protectedProcedure.input(z.object({ name: z.string() })).mutation(/* ... */),
});

// Router for managing Assignments
const assignmentRouter = createTRPCRouter({
  getAll: protectedProcedure.query(/* ... */),
  createManual: protectedProcedure.input(/* ... */).mutation(/* ... */),
  updateStatus: protectedProcedure.input(/* ... */).mutation(/* ... */),
});

// Router for AI-powered features
const aiRouter = createTRPCRouter({
  parseSyllabus: protectedProcedure.input(/* ... */).mutation(/* ... */),
  generatePlan: protectedProcedure.input(/* ... */).mutation(/* ... */)
});

// Main application router
export const appRouter = createTRPCRouter({
  class: classRouter,
  assignment: assignmentRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
```