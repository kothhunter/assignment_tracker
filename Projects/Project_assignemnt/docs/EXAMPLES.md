# Code Examples & Usage Guide

This document provides practical code examples for common tasks and patterns in the Project Assignment Tracker.

## 📚 Table of Contents

- [Authentication](#authentication)
- [Assignment Management](#assignment-management)
- [AI Integration](#ai-integration)
- [Component Patterns](#component-patterns)
- [State Management](#state-management)
- [Database Operations](#database-operations)

## 🔐 Authentication

### User Login/Registration

```typescript
// Using Supabase Auth in a React component
'use client';

import { createClientComponentClient } from '@supabase/ssr';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleAuth} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </button>
      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? 'Already have an account?' : 'Need an account?'}
      </button>
    </form>
  );
}
```

### Protected Route Component

```typescript
// Protecting routes with authentication
'use client';

import { createClientComponentClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
      } else {
        setIsAuthenticated(true);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

## 📋 Assignment Management

### Creating an Assignment

```typescript
// Using tRPC mutation to create assignment
import { api } from '@/lib/trpc';
import { useState } from 'react';

export function CreateAssignmentForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const { data: classes } = api.class.getAll.useQuery();
  const utils = api.useContext();

  const createAssignment = api.assignment.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch assignments
      utils.assignment.getAll.invalidate();
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    
    createAssignment.mutate({
      title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority,
      class_id: classId,
    });
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, selectedClassId)} className="space-y-4">
      <input
        type="text"
        placeholder="Assignment Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      <input
        type="datetime-local"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
      >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
      </select>
      
      <select required>
        <option value="">Select a class</option>
        {classes?.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
          </option>
        ))}
      </select>
      
      <button
        type="submit"
        disabled={createAssignment.isLoading}
      >
        {createAssignment.isLoading ? 'Creating...' : 'Create Assignment'}
      </button>
    </form>
  );
}
```

### Assignment List with Filtering

```typescript
// Assignment list with filtering and sorting
import { api } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { AssignmentCard } from './assignment-card';

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed';
type SortType = 'due_date' | 'created_at' | 'priority';

export function AssignmentList() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('due_date');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: assignments, isLoading } = api.assignment.getAll.useQuery();
  const { data: classes } = api.class.getAll.useQuery();

  const filteredAndSortedAssignments = useMemo(() => {
    if (!assignments) return [];

    let filtered = assignments;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === filter);
    }

    // Filter by class
    if (selectedClassId) {
      filtered = filtered.filter(assignment => assignment.class_id === selectedClassId);
    }

    // Sort assignments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [assignments, filter, sortBy, selectedClassId]);

  if (isLoading) {
    return <div>Loading assignments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
        >
          <option value="all">All Assignments</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
        >
          <option value="due_date">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="created_at">Sort by Created Date</option>
        </select>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes?.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assignment List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedAssignments.map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} />
        ))}
      </div>

      {filteredAndSortedAssignments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No assignments match your current filters.
        </div>
      )}
    </div>
  );
}
```

## 🤖 AI Integration

### Generate Assignment Plan

```typescript
// AI plan generation with loading states
import { api } from '@/lib/trpc';
import { useState } from 'react';

export function AIPlayGeneration({ assignmentId }: { assignmentId: string }) {
  const [requirements, setRequirements] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  const generatePlan = api.ai.generatePlan.useMutation({
    onSuccess: (plan) => {
      console.log('Generated plan:', plan);
      // Handle success - maybe redirect to plan view
    },
    onError: (error) => {
      alert(`Failed to generate plan: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!requirements.trim()) {
      alert('Please enter assignment requirements');
      return;
    }

    generatePlan.mutate({
      assignmentId,
      requirements,
      additionalContext: additionalContext || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Assignment Requirements *
        </label>
        <textarea
          placeholder="Describe what needs to be accomplished for this assignment..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={4}
          className="w-full border rounded-md p-3"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Additional Context (Optional)
        </label>
        <textarea
          placeholder="Any additional information about the assignment, your preferences, constraints, etc..."
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={3}
          className="w-full border rounded-md p-3"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generatePlan.isLoading || !requirements.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {generatePlan.isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Generating Plan...
          </span>
        ) : (
          'Generate AI Plan'
        )}
      </button>
    </div>
  );
}
```

### Plan Refinement Chat

```typescript
// Interactive plan refinement with chat interface
import { api } from '@/lib/trpc';
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function PlanRefinementChat({ planId }: { planId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  const refinePlan = api.ai.refinePlan.useMutation({
    onSuccess: (response) => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.refinedPlan }
      ]);
      setCurrentMessage('');
    },
    onError: (error) => {
      console.error('Plan refinement failed:', error);
      alert('Failed to refine plan. Please try again.');
    },
  });

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: Message = { role: 'user', content: currentMessage };
    setMessages(prev => [...prev, newMessage]);

    refinePlan.mutate({
      planId,
      userMessage: currentMessage,
      conversationHistory: messages,
    });
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {refinePlan.isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <span className="animate-pulse">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask me to refine the plan..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border rounded-md px-3 py-2"
            disabled={refinePlan.isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={refinePlan.isLoading || !currentMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 🎨 Component Patterns

### Reusable Card Component

```typescript
// Flexible card component using CVA (Class Variance Authority)
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-lg border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-background border-border hover:shadow-md',
        elevated: 'bg-background border-border shadow-lg hover:shadow-xl',
        outline: 'bg-transparent border-2 border-border',
      },
      size: {
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, size, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// Usage example
export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <Card variant="elevated" className="hover:scale-105">
      <h3 className="font-semibold">{assignment.title}</h3>
      <p className="text-gray-600">{assignment.description}</p>
      {assignment.due_date && (
        <p className="text-sm text-red-600">
          Due: {new Date(assignment.due_date).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
```

### Loading Spinner Component

```typescript
// Reusable loading spinner with variants
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        default: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
      },
      variant: {
        default: 'border-blue-600',
        light: 'border-white',
        muted: 'border-gray-400',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

interface LoadingSpinnerProps
  extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export function LoadingSpinner({ size, variant, className }: LoadingSpinnerProps) {
  return (
    <div className={cn(spinnerVariants({ size, variant, className }))} />
  );
}

// Usage in components
export function LoadingButton({ 
  isLoading, 
  children, 
  ...props 
}: {
  isLoading: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button disabled={isLoading} {...props}>
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" variant="light" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
```

## 🗄️ State Management

### Zustand Store Example

```typescript
// Assignment store with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Assignment {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  class_id: string;
}

interface AssignmentStore {
  // State
  assignments: Assignment[];
  selectedClassId: string | null;
  filter: 'all' | 'pending' | 'in_progress' | 'completed';
  sortBy: 'due_date' | 'priority' | 'created_at';

  // Actions
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  removeAssignment: (id: string) => void;
  setSelectedClass: (classId: string | null) => void;
  setFilter: (filter: AssignmentStore['filter']) => void;
  setSortBy: (sortBy: AssignmentStore['sortBy']) => void;

  // Computed values
  filteredAssignments: () => Assignment[];
}

export const useAssignmentStore = create<AssignmentStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        assignments: [],
        selectedClassId: null,
        filter: 'all',
        sortBy: 'due_date',

        // Actions
        setAssignments: (assignments) => set({ assignments }),
        
        addAssignment: (assignment) =>
          set((state) => ({
            assignments: [...state.assignments, assignment],
          })),

        updateAssignment: (id, updates) =>
          set((state) => ({
            assignments: state.assignments.map((assignment) =>
              assignment.id === id ? { ...assignment, ...updates } : assignment
            ),
          })),

        removeAssignment: (id) =>
          set((state) => ({
            assignments: state.assignments.filter((assignment) => assignment.id !== id),
          })),

        setSelectedClass: (classId) => set({ selectedClassId: classId }),
        setFilter: (filter) => set({ filter }),
        setSortBy: (sortBy) => set({ sortBy }),

        // Computed values
        filteredAssignments: () => {
          const { assignments, selectedClassId, filter, sortBy } = get();
          
          let filtered = assignments;

          // Filter by class
          if (selectedClassId) {
            filtered = filtered.filter((a) => a.class_id === selectedClassId);
          }

          // Filter by status
          if (filter !== 'all') {
            filtered = filtered.filter((a) => a.status === filter);
          }

          // Sort
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'due_date':
                if (!a.due_date && !b.due_date) return 0;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              
              case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              
              case 'created_at':
              default:
                return 0; // Would need created_at field
            }
          });

          return filtered;
        },
      }),
      {
        name: 'assignment-store',
        partialize: (state) => ({
          filter: state.filter,
          sortBy: state.sortBy,
          selectedClassId: state.selectedClassId,
        }),
      }
    ),
    { name: 'assignment-store' }
  )
);

// Usage in components
export function AssignmentFilters() {
  const { filter, sortBy, setFilter, setSortBy } = useAssignmentStore();

  return (
    <div className="flex gap-4">
      <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
        <option value="due_date">Due Date</option>
        <option value="priority">Priority</option>
        <option value="created_at">Created Date</option>
      </select>
    </div>
  );
}
```

## 💾 Database Operations

### Custom Hook for Data Fetching

```typescript
// Custom hook combining tRPC with additional logic
import { api } from '@/lib/trpc';
import { useMemo } from 'react';

export function useAssignments(filters?: {
  classId?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}) {
  const {
    data: assignments,
    isLoading,
    error,
    refetch,
  } = api.assignment.getAll.useQuery(filters);

  // Computed values
  const assignmentStats = useMemo(() => {
    if (!assignments) return { total: 0, pending: 0, completed: 0, overdue: 0 };

    const now = new Date();
    return assignments.reduce(
      (stats, assignment) => {
        stats.total++;
        
        if (assignment.status === 'pending') {
          stats.pending++;
        } else if (assignment.status === 'completed') {
          stats.completed++;
        }

        if (
          assignment.due_date &&
          new Date(assignment.due_date) < now &&
          assignment.status !== 'completed'
        ) {
          stats.overdue++;
        }

        return stats;
      },
      { total: 0, pending: 0, completed: 0, overdue: 0 }
    );
  }, [assignments]);

  const upcomingAssignments = useMemo(() => {
    if (!assignments) return [];

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return assignments
      .filter(
        (assignment) =>
          assignment.due_date &&
          assignment.status !== 'completed' &&
          new Date(assignment.due_date) >= now &&
          new Date(assignment.due_date) <= nextWeek
      )
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
      );
  }, [assignments]);

  return {
    assignments: assignments || [],
    isLoading,
    error,
    refetch,
    stats: assignmentStats,
    upcomingAssignments,
  };
}

// Usage in components
export function AssignmentDashboard() {
  const { assignments, isLoading, stats, upcomingAssignments } = useAssignments();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Total</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </Card>
      </div>

      {/* Upcoming Assignments */}
      {upcomingAssignments.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Due This Week</h2>
          <div className="space-y-2">
            {upcomingAssignments.map((assignment) => (
              <div key={assignment.id} className="flex justify-between items-center">
                <span>{assignment.title}</span>
                <span className="text-sm text-gray-500">
                  {new Date(assignment.due_date!).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

These examples demonstrate the main patterns and APIs used throughout the Project Assignment Tracker. For more detailed information, refer to the specific documentation files for each area of functionality.