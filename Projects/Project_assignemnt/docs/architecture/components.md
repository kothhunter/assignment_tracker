# Components

Frontend Application (Next.js): Renders the UI, handles user interactions, and communicates with the API Layer.

API Layer (tRPC on Vercel): Secure backend that processes requests, enforces business logic, and orchestrates calls to the database and AI services.

Authentication Service (Supabase Auth): Manages user identity, sign-ups, logins, and sessions.

Database Service (Supabase Postgres): Provides persistent storage for all application data.

AI Agent Service (OpenAI): Provides the LLM intelligence for parsing and planning.