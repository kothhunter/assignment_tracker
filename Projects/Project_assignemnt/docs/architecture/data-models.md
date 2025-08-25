# Data Models

* **User Profile**
    * **TypeScript Interface:**
        ```typescript
        interface UserProfile {
          id: string; // UUID from auth.users
          email: string;
          created_at: string; // ISO 8601 timestamp
        }
        ```
* **Class**
    * **TypeScript Interface:**
        ```typescript
        interface Class {
          id: number;
          user_id: string; // Foreign key to UserProfile
          name: string; // e.g., "MATH 113 - Calculus I"
          created_at: string;
        }
        ```
* **Assignment**
    * **TypeScript Interface:**
        ```typescript
        type AssignmentStatus = 'incomplete' | 'complete';

        interface Assignment {
          id: number;
          user_id: string;
          class_id: number; // Foreign key to Class
          title: string;
          due_date: string; // ISO 8601 timestamp
          status: AssignmentStatus;
          created_at: string;
        }
        ```
* **Assignment Plan**
    * **TypeScript Interface:**
        ```typescript
        interface AssignmentPlan {
          id: number;
          assignment_id: number; // Foreign key to Assignment
          original_instructions: string;
          sub_tasks: SubTask[]; // The array of sub-tasks
          created_at: string;
        }

        interface SubTask {
          id: number;
          plan_id: number; // Foreign key to AssignmentPlan
          step_number: number;
          title: string;
          generated_prompt: string;
        }
        ```