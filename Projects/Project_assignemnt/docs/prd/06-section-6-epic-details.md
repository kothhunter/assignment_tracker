# Section 6: Epic Details

## Epic 1: Foundation & Core User Experience

* **Story 1.1: Project Initialization & Setup**
  * **As a** developer, **I want** to initialize a new monorepo with a Next.js frontend and a backend structure configured for Supabase, **so that** I have a clean and correct foundation for building the application.
* **Story 1.2: User Authentication**
  * **As a** new user, **I want** to sign up for an account using my email and password and be able to log in and out, **so that** I can securely access my personal assignment dashboard.
* **Story 1.3: Basic Assignment Dashboard UI**
  * **As a** logged-in user, **I want** to see a dashboard with a clear, chronological list of my assignments, **so that** I can quickly understand what's due next.
* **Story 1.4 (New): Class Management**
  * **As a** logged-in user, **I want** to create and manage a list of my classes, **so that** I can keep my course information organized and avoid duplicate entries when adding assignments.
* **Story 1.5 (Updated): Manual Assignment Creation**
  * **As a** logged-in user, **I want** to add a new assignment by selecting from my existing list of classes, **so that** my data remains clean and consistent.
* **Story 1.6 (Updated): View and Filter Assignments**
  * **As a** logged-in user, **I want** to see all my assignments on the dashboard and be able to filter them by class, **so that** I can focus on a specific subject.

## Epic 2: AI-Powered Schedule Ingestion

* **Story 2.1: Syllabus Upload Interface**
  * **As a** logged-in user, **I want** a simple interface to select a class and then upload a syllabus file (PDF/text) or paste its text, **so that** I can submit it for AI parsing.
* **Story 2.2: AI Parsing & Assignment Extraction**
  * **As a** user, **I want** the system to use an AI agent to read my syllabus text and extract a structured list of assignments, **so that** I don't have to identify them manually.
* **Story 2.3: Review and Confirmation Screen**
  * **As a** user, **I want** to review the assignments the AI found before they are added to my schedule, **so that** I can correct any errors and have final control.
* **Story 2.4: Save Confirmed Assignments to Schedule**
  * **As a** user, **I want** the approved assignments to be saved permanently to my schedule, **so that** they appear on my main dashboard.

## Epic 3: Intelligent Assignment Breakdown

* **Story 3.1: Assignment Detail View & Initial Input**
  * **As a** user, **I want** to select an assignment from my dashboard and submit the detailed instructions, **so that** I can initiate the AI planning process.
* **Story 3.2: Initial Sub-Task Generation & Review**
  * **As a** user, **I want** the AI to generate an initial high-level plan of sub-tasks for my review, **so that** I have a starting point to refine.
* **Story 3.3: Conversational Plan Refinement**
  * **As a** user, **I want** to use natural language in the chat to add, remove, or change the sub-tasks, **so that** the final plan perfectly matches my needs.
* **Story 3.4: Final Prompt Generation**
  * **As a** user, **I want** to click a button to generate the final, detailed prompts once I'm happy with the sub-task plan, **so that** I can get the actionable output.

***
