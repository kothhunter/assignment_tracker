# API Documentation

This document provides comprehensive documentation for all API endpoints in the Project Assignment Tracker application.

## Overview

The application uses **tRPC** for type-safe, end-to-end API communication. All API routes are accessible via `/api/trpc/[trpc]` and provide automatic type safety between client and server.

## Base URL

- **Development**: `http://localhost:3000/api/trpc`
- **Production**: `https://your-domain.com/api/trpc`

## Authentication

All protected routes require authentication via Supabase Auth. Include the session token in your requests:

```typescript
// Example authenticated request
const result = await trpc.assignment.getById.query({
  id: "assignment-id"
});
```

## Core API Routers

### 1. User Router (`user`)

Handles user-related operations including profiles and authentication.

#### `user.getCurrentUser`
Get the current authenticated user's information.

```typescript
// Query
const user = await trpc.user.getCurrentUser.query();

// Response
{
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
```

#### `user.updateProfile`
Update user profile information.

```typescript
// Mutation
const updatedUser = await trpc.user.updateProfile.mutate({
  name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg"
});
```

---

### 2. Class Router (`class`)

Manages academic classes and course information.

#### `class.getAll`
Retrieve all classes for the current user.

```typescript
// Query
const classes = await trpc.class.getAll.query();

// Response
{
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  _count: {
    assignments: number;
  };
}[]
```

#### `class.create`
Create a new class.

```typescript
// Mutation
const newClass = await trpc.class.create.mutate({
  name: "Computer Science 101",
  description: "Introduction to Computer Science",
  color: "#3B82F6"
});
```

#### `class.update`
Update an existing class.

```typescript
// Mutation
const updatedClass = await trpc.class.update.mutate({
  id: "class-id",
  name: "Advanced Computer Science",
  description: "Advanced topics in CS",
  color: "#EF4444"
});
```

#### `class.delete`
Delete a class and all associated assignments.

```typescript
// Mutation
await trpc.class.delete.mutate({
  id: "class-id"
});
```

---

### 3. Assignment Router (`assignment`)

Handles assignment CRUD operations and management.

#### `assignment.getAll`
Get all assignments with optional filtering.

```typescript
// Query with filters
const assignments = await trpc.assignment.getAll.query({
  classId?: "class-id",
  status?: "pending" | "in_progress" | "completed",
  sortBy?: "due_date" | "created_at" | "priority",
  sortOrder?: "asc" | "desc"
});

// Response
{
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  due_date?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  class_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  class: {
    id: string;
    name: string;
    color: string;
  };
  plan?: AssignmentPlan;
}[]
```

#### `assignment.getById`
Get a specific assignment by ID.

```typescript
// Query
const assignment = await trpc.assignment.getById.query({
  id: "assignment-id"
});
```

#### `assignment.create`
Create a new assignment.

```typescript
// Mutation
const newAssignment = await trpc.assignment.create.mutate({
  title: "Research Paper",
  description: "Write a 10-page research paper on AI",
  instructions: "Include at least 5 scholarly sources",
  due_date: "2024-12-01T23:59:00Z",
  priority: "high",
  class_id: "class-id"
});
```

#### `assignment.update`
Update an existing assignment.

```typescript
// Mutation
const updatedAssignment = await trpc.assignment.update.mutate({
  id: "assignment-id",
  title: "Updated Research Paper",
  status: "in_progress",
  priority: "medium"
});
```

#### `assignment.delete`
Delete an assignment.

```typescript
// Mutation
await trpc.assignment.delete.mutate({
  id: "assignment-id"
});
```

#### `assignment.createBatch`
Create multiple assignments from syllabus parsing.

```typescript
// Mutation
const assignments = await trpc.assignment.createBatch.mutate({
  assignments: [
    {
      title: "Assignment 1",
      due_date: "2024-11-15T23:59:00Z",
      class_id: "class-id"
    },
    // ... more assignments
  ]
});
```

---

### 4. AI Router (`ai`)

Handles AI-powered features including plan generation and refinement.

#### `ai.generatePlan`
Generate an AI-powered assignment plan.

```typescript
// Mutation
const plan = await trpc.ai.generatePlan.mutate({
  assignmentId: "assignment-id",
  requirements: "10-page research paper on machine learning",
  deadline: "2024-12-01T23:59:00Z",
  additionalContext?: "Focus on practical applications"
});

// Response
{
  id: string;
  assignment_id: string;
  plan_content: string;
  status: "draft" | "final";
  created_at: string;
  updated_at: string;
}
```

#### `ai.generateSubTasks`
Generate subtasks for an assignment plan.

```typescript
// Mutation
const subTasks = await trpc.ai.generateSubTasks.mutate({
  planId: "plan-id",
  requirements: "Break down research paper into manageable tasks"
});

// Response
{
  id: number;
  step_number: number;
  title: string;
  description: string;
  estimated_hours: number;
  due_date?: string;
}[]
```

#### `ai.refinePlan`
Refine an existing plan through chat interface.

```typescript
// Mutation
const refinedPlan = await trpc.ai.refinePlan.mutate({
  planId: "plan-id",
  userMessage: "Can you add more detail to the research phase?",
  conversationHistory: [
    {
      role: "user",
      content: "Previous message"
    },
    {
      role: "assistant", 
      content: "Previous response"
    }
  ]
});
```

#### `ai.generateFinalPrompts`
Generate final prompts for subtasks.

```typescript
// Mutation
const finalPrompts = await trpc.ai.generateFinalPrompts.mutate({
  subTasks: [
    {
      id: 1,
      title: "Research Phase",
      generated_prompt: "Initial prompt"
    }
  ],
  assignmentInstructions: "Complete assignment requirements",
  assignmentTitle: "Research Paper"
});
```

---

### 5. Syllabus Router (`syllabus`)

Handles syllabus file upload and parsing.

#### `syllabus.upload`
Upload and parse a syllabus file.

```typescript
// Mutation (requires multipart form data)
const result = await trpc.syllabus.upload.mutate({
  file: File, // File object from input
  classId: "class-id"
});

// Response
{
  success: boolean;
  assignments: {
    title: string;
    description?: string;
    due_date?: string;
    priority: "low" | "medium" | "high";
  }[];
  message: string;
}
```

---

## Health Check Endpoints

### Basic Health Check
```http
GET /api/health

Response:
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "environment": "development" | "production",
  "version": "1.0.0",
  "database": "connected" | "disconnected",
  "openai": "configured" | "not-configured",
  "responseTime": "25ms"
}
```

### Detailed Health Check
```http
GET /api/health/detailed

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 86400,
  "memory": {
    "used": 128,
    "total": 256,
    "external": 32
  },
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "15ms",
      "tables": {
        "user_profiles": "accessible",
        "classes": "accessible"
      }
    },
    "openai": {
      "status": "configured",
      "responseTime": "2ms"
    },
    "environment": {
      "status": "healthy",
      "configured": 4,
      "required": 4,
      "missing": []
    }
  },
  "responseTime": "45ms"
}
```

## Error Handling

All tRPC endpoints return standardized error responses:

```typescript
// Error Response Structure
{
  error: {
    code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR",
    message: "Human-readable error message",
    data?: {
      // Additional error context
      field?: string;
      validation?: ValidationError[];
    }
  }
}
```

### Common Error Codes

- **`BAD_REQUEST`** - Invalid input parameters
- **`UNAUTHORIZED`** - Authentication required
- **`FORBIDDEN`** - Insufficient permissions
- **`NOT_FOUND`** - Resource not found
- **`INTERNAL_SERVER_ERROR`** - Server-side error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 30 requests per minute
- **AI endpoints**: 10 requests per minute  
- **Upload endpoints**: 5 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Authentication Flow

### 1. Sign Up/Sign In
```typescript
// Using Supabase client
import { createClientComponentClient } from '@supabase/ssr';

const supabase = createClientComponentClient();

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com', 
  password: 'password'
});
```

### 2. Using Authenticated APIs
```typescript
// tRPC client automatically includes session
const trpc = api.useContext();
const user = await trpc.user.getCurrentUser.query();
```

## Data Models

### Assignment Plan Structure
```typescript
interface AssignmentPlan {
  id: string;
  assignment_id: string;
  plan_content: string;
  status: "draft" | "final";
  created_at: string;
  updated_at: string;
  sub_tasks?: SubTask[];
}

interface SubTask {
  id: number;
  step_number: number;
  title: string;
  description: string;
  estimated_hours: number;
  due_date?: string;
  generated_prompt: string;
  final_prompt?: string;
}
```

### Class Model
```typescript
interface Class {
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

### Assignment Model
```typescript
interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  due_date?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  class_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

## SDK Usage Examples

### React Query Integration
```typescript
import { api } from '@/lib/trpc';

// In a React component
function AssignmentList() {
  const { data: assignments, isLoading } = api.assignment.getAll.useQuery();
  
  const createAssignment = api.assignment.create.useMutation({
    onSuccess: () => {
      // Refetch assignments after creation
      utils.assignment.getAll.invalidate();
    }
  });
  
  return (
    <div>
      {assignments?.map(assignment => (
        <AssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  );
}
```

### Server-Side Usage
```typescript
import { createCaller } from '@/server/api/root';
import { createContext } from '@/server/api/trpc';

// In API routes or server actions
export async function getServerSideProps(context) {
  const ctx = await createContext({ req: context.req });
  const caller = createCaller(ctx);
  
  const assignments = await caller.assignment.getAll({});
  
  return {
    props: {
      assignments
    }
  };
}
```

## Testing API Endpoints

### Unit Testing
```typescript
import { createMockContext } from '@/server/api/__tests__/helpers';
import { appRouter } from '@/server/api/root';

describe('Assignment API', () => {
  it('should create assignment', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.assignment.create({
      title: 'Test Assignment',
      class_id: 'test-class-id'
    });
    
    expect(result.title).toBe('Test Assignment');
  });
});
```

### Integration Testing
```typescript
import { test, expect } from '@playwright/test';

test('API health check', async ({ request }) => {
  const response = await request.get('/api/health');
  const data = await response.json();
  
  expect(response.ok()).toBeTruthy();
  expect(data.status).toBe('healthy');
});
```

---

For more detailed information about specific endpoints, check the tRPC router files in `src/server/api/routers/`.