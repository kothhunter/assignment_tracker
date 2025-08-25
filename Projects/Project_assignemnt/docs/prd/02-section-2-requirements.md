# Section 2: Requirements

**Functional Requirements (FR)**

1. The system shall provide a web-based user interface for all user interactions.
2. The system shall require users to register for an account and log in to access the application.
3. An Orchestrator agent shall receive all user input from the web UI, determine intent, and delegate tasks to the appropriate specialist agent.
4. A Scheduling agent shall be capable of parsing a full, unstructured syllabus file (PDF or text) uploaded by the user to identify assignment titles, classes, and due dates.
5. The system shall provide a form for users to manually add a single assignment with its title, class, and due date to their schedule.
6. The Scheduling agent shall add new assignments to a persistent data store associated with the user's account.
7. The master schedule shall be automatically sorted by the nearest due date after any new assignment is added.
8. A Query agent shall answer natural language questions about the user's schedule with read-only access.
9. A Task Breakdown agent shall, upon user request for a specific assignment, process the full assignment instructions provided by the user via the web UI.
10. The Task Breakdown agent shall generate a logical sequence of sub-tasks required to complete the assignment, allowing for conversational refinement by the user.
11. For each user-approved sub-task, the agent shall generate a detailed, structured, and optimized prompt designed to be executed in an external, high-capability LLM.

**Non-Functional Requirements (NFR)**

1. The system's AI agents must use the OpenAI SDK for their internal "thinking" and generation processes.
2. The application shall be developed with a Python backend and a modern web framework (e.g., React, Vue) for the frontend.
3. The web UI should be clean, responsive, and user-friendly.
4. The system shall use Supabase for backend data storage and user authentication.
5. Each user's assignment schedule must persist in a database between sessions.
6. To minimize operational costs, the system's primary output for content generation must be prompts, not the final content itself.
7. The application must be deployable to a cloud hosting provider.

***
