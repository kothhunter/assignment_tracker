# AI Academic Assistant Product Requirements Document (PRD)

---

### **Section 1: Goals and Background Context**

**1. Goals**
* To create a centralized, intelligent system for managing all academic assignments for an undergraduate student.
* To reduce the cognitive load of academic planning and organization.
* To improve productivity by providing perfectly crafted prompts to help complete assignments.
* To implement a cost-saving workflow by generating optimized prompts for external LLMs.
* To develop a robust multi-agent system with an intuitive web UI.

**2. Background Context**
The AI Academic Assistant is a full-stack web application designed to serve as a personal task management system for a college student. The system will leverage a team of specialized AI agents to streamline the academic workflow, from ingesting syllabi and organizing deadlines to breaking down complex assignments into manageable steps. The core innovation lies in its cost-effective approach: instead of performing computationally expensive tasks itself, the system's final output will be highly-optimized, structured prompts. The user can then execute these prompts in a frontier large language model (LLM) they already have access to, minimizing direct API costs while still benefiting from top-tier AI capabilities.

**3. Change Log**
| Date       | Version | Description        | Author    |
| :--------- | :------ | :----------------- | :-------- |
| 2025-07-18 | 1.0     | Initial PRD draft. | John (PM) |

---

### **Section 2: Requirements**

**Functional Requirements (FR)**
1.  The system shall provide a web-based user interface for all user interactions.
2.  The system shall require users to register for an account and log in to access the application.
3.  An Orchestrator agent shall receive all user input from the web UI, determine intent, and delegate tasks to the appropriate specialist agent.
4.  A Scheduling agent shall be capable of parsing a full, unstructured syllabus file (PDF or text) uploaded by the user to identify assignment titles, classes, and due dates.
5.  The system shall provide a form for users to manually add a single assignment with its title, class, and due date to their schedule.
6.  The Scheduling agent shall add new assignments to a persistent data store associated with the user's account.
7.  The master schedule shall be automatically sorted by the nearest due date after any new assignment is added.
8.  A Query agent shall answer natural language questions about the user's schedule with read-only access.
9.  A Task Breakdown agent shall, upon user request for a specific assignment, process the full assignment instructions provided by the user via the web UI.
10. The Task Breakdown agent shall generate a logical sequence of sub-tasks required to complete the assignment, allowing for conversational refinement by the user.
11. For each user-approved sub-task, the agent shall generate a detailed, structured, and optimized prompt designed to be executed in an external, high-capability LLM.

**Non-Functional Requirements (NFR)**
1.  The system's AI agents must use the OpenAI SDK for their internal "thinking" and generation processes.
2.  The application shall be developed with a Python backend and a modern web framework (e.g., React, Vue) for the frontend.
3.  The web UI should be clean, responsive, and user-friendly.
4.  The system shall use Supabase for backend data storage and user authentication.
5.  Each user's assignment schedule must persist in a database between sessions.
6.  To minimize operational costs, the system's primary output for content generation must be prompts, not the final content itself.
7.  The application must be deployable to a cloud hosting provider.

---

### **Section 3: User Interface Design Goals**

**1. Overall UX Vision**
The application's user experience should be minimalist, professional, and intuitive. The design will prioritize clarity and efficiency, enabling students to manage their academic workflow with minimal friction. The interface will feel calm and organized, drawing inspiration from modern productivity tools like Notion to create a focused and empowering environment.

**2. Key Interaction Paradigms**
* **Centralized Dashboard:** A main view will present all assignments in a clear, chronological list of what is due next.
* **Select-then-Act:** Users will select an item (like an assignment) and then be presented with contextual actions (like "Generate Plan").
* **Chat-based Refinement:** For complex AI interactions like planning, users will be able to refine AI suggestions through a simple, conversational chat interface.

**3. Core Screens and Views**
* **Login & Registration Page:** Standard email/password authentication screens.
* **Dashboard View:** The main screen after login, displaying the user's upcoming assignments and controls for adding new assignments and managing classes.
* **Syllabus Upload Page/Modal:** A dedicated interface for selecting a class and then uploading or pasting a syllabus for parsing.
* **Assignment Plan View:** A dedicated view for an assignment where a user submits instructions and interacts with the Task Breakdown Agent.
* **User Settings Page:** A basic page for account management.

**4. Accessibility**
* **Target:** The application will aim to meet WCAG 2.1 AA standards.

**5. Branding**
* **Initial Plan:** Branding elements are to be determined. The initial design will use a clean, neutral palette.

**6. Target Platforms**
* **Primary:** A responsive web application accessible on modern desktop and mobile browsers.

---

### **Section 4: Technical Assumptions**

**1. Repository Structure: Monorepo**
* **Assumption:** The project will be housed in a single "monorepo" that contains both the frontend and backend code.
* **Rationale:** This approach is simpler to manage, makes sharing code/types between the front and back end easier, and streamlines the development workflow.

**2. Service Architecture: Monolithic Service**
* **Assumption:** The backend will be built as a single, unified service.
* **Rationale:** For the initial version, the application's scope is focused and does not require the complexity of a microservices architecture.

**3. Testing Requirements: Unit & Integration Tests**
* **Assumption:** The development process will include writing unit tests for individual functions and integration tests for API endpoints.
* **Rationale:** This provides a solid balance of ensuring code correctness without the high overhead of full end-to-end testing for the MVP.

**4. Additional Technical Assumptions and Requests**
* **Backend & Authentication:** The system **must** use **Supabase**.
* **AI Engine:** The system **must** use the **OpenAI SDK**.
* **Frontend Framework:** The system **must** use **React (Next.js)**.
* **UI Component Library:** The system should use a component library like **Shadcn/UI** or **Mantine** to achieve the desired aesthetic.

---

### **Section 5: Epic List**

* **Epic 1: Foundation & Core User Experience**
    * **Goal:** Establish the core application infrastructure, implement user authentication, and provide the basic manual tools for a user to organize their assignments.

* **Epic 2: AI-Powered Schedule Ingestion**
    * **Goal:** Introduce the core AI functionality by enabling users to upload a syllabus and have the system automatically parse it and populate their schedule.

* **Epic 3: Intelligent Assignment Breakdown**
    * **Goal:** Deliver the final key value proposition by allowing users to select an assignment and receive a full breakdown of sub-tasks with optimized prompts.

---

### **Section 6: Epic Details**

#### **Epic 1: Foundation & Core User Experience**
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

#### **Epic 2: AI-Powered Schedule Ingestion**
* **Story 2.1: Syllabus Upload Interface**
    * **As a** logged-in user, **I want** a simple interface to select a class and then upload a syllabus file (PDF/text) or paste its text, **so that** I can submit it for AI parsing.
* **Story 2.2: AI Parsing & Assignment Extraction**
    * **As a** user, **I want** the system to use an AI agent to read my syllabus text and extract a structured list of assignments, **so that** I don't have to identify them manually.
* **Story 2.3: Review and Confirmation Screen**
    * **As a** user, **I want** to review the assignments the AI found before they are added to my schedule, **so that** I can correct any errors and have final control.
* **Story 2.4: Save Confirmed Assignments to Schedule**
    * **As a** user, **I want** the approved assignments to be saved permanently to my schedule, **so that** they appear on my main dashboard.

#### **Epic 3: Intelligent Assignment Breakdown**
* **Story 3.1: Assignment Detail View & Initial Input**
    * **As a** user, **I want** to select an assignment from my dashboard and submit the detailed instructions, **so that** I can initiate the AI planning process.
* **Story 3.2: Initial Sub-Task Generation & Review**
    * **As a** user, **I want** the AI to generate an initial high-level plan of sub-tasks for my review, **so that** I have a starting point to refine.
* **Story 3.3: Conversational Plan Refinement**
    * **As a** user, **I want** to use natural language in the chat to add, remove, or change the sub-tasks, **so that** the final plan perfectly matches my needs.
* **Story 3.4: Final Prompt Generation**
    * **As a** user, **I want** to click a button to generate the final, detailed prompts once I'm happy with the sub-task plan, **so that** I can get the actionable output.

---

### **Section 7: Checklist Results Report**

* **Overall Status:** **READY FOR ARCHITECT**. The PRD is comprehensive, properly structured, and ready for the next phase.
* **Summary:** The document clearly defines the problem, user, and MVP scope. The pivot to a full-stack application has been successfully integrated, and all functional/non-functional requirements are captured. The epics and stories are logically sequenced to deliver incremental value.

