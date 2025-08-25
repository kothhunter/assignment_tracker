# Section 4: Technical Assumptions

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

***
