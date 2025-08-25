# Tech Stack

| Category | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Language** | TypeScript | ~5.x | Enforces type safety, reducing bugs and improving developer experience. |
| **Frontend Framework** | Next.js | ~14.x | Production-grade React framework with serverless functions, ideal for the Vercel platform. |
| **UI Component Library** | Shadcn/UI | Latest | Provides beautiful, accessible, and unstyled components that perfectly match our "Notion-like" aesthetic. |
| **State Management** | Zustand | ~4.x | Simple, pragmatic state management solution that is less complex than Redux for our needs. |
| **Backend Language** | TypeScript | ~5.x | Using the same language on the backend and frontend enables code sharing and full-stack type safety. |
| **API Style** | tRPC | ~11.x | Enables us to write fully type-safe APIs with no code generation, a core benefit of our monorepo structure. |
| **Database** | Supabase (Postgres) | ~15.x | A robust, open-source relational database provided and managed by Supabase. |
| **File Storage** | Supabase Storage | Latest | Secure and scalable object storage for user-uploaded syllabus files. |
| **Authentication** | Supabase Auth | Latest | Handles user registration, login, and session management securely out-of-the-box. |
| **Testing** | Jest & RTL | ~29.x | The standard for testing React components and serverless functions in the Next.js ecosystem. |
| **E2E Testing** | Playwright | ~1.x | A modern and powerful tool for end-to-end testing that ensures our user flows work as expected. |
| **CI/CD** | Vercel | N/A | Vercel provides a seamless, Git-integrated continuous deployment pipeline for Next.js applications. |
| **Monitoring/Logging**| Vercel | N/A | Vercel's built-in analytics and logging are sufficient for our MVP monitoring needs. |
| **Styling** | Tailwind CSS | ~3.x | A utility-first CSS framework that allows for rapid development of modern, custom designs. |