# Frontend & Backend Architecture Patterns

## Frontend:

Component Structure: Components will be organized in src/components with subfolders for ui, layout, and features.

State Management: Global state will be managed with Zustand, with stores located in src/stores.

Routing: File-based routing will be used via the Next.js App Router in src/app. Protected routes will be handled via a root layout.

## Backend:

Service Structure: The backend is a collection of serverless functions organized as tRPC routers within src/server/api/routers.

Authentication: protectedProcedure middleware in tRPC will enforce authentication for all necessary API calls by validating the user's Supabase session.