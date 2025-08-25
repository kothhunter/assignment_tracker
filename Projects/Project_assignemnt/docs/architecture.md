# Project Assignment Tracker - Architecture Documentation

This document provides a comprehensive overview of the Project Assignment Tracker's system architecture, design patterns, and technical decisions.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─ Next.js 14 Frontend ─────────────────────────────────────────┐  │
│  │  • App Router (React Server Components)                       │  │
│  │  • TypeScript for type safety                                 │  │
│  │  • Tailwind CSS for styling                                   │  │
│  │  • Radix UI for accessible components                         │  │
│  │  • Zustand for client-side state management                   │  │
│  │  • React Query (TanStack Query) for data fetching             │  │
│  └────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                            API LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─ tRPC API Routes ──────────────────────────────────────────────┐  │
│  │  • Type-safe end-to-end APIs                                  │  │
│  │  • Automatic TypeScript inference                             │  │
│  │  • Built-in validation with Zod schemas                       │  │
│  │  • Authentication middleware                                  │  │
│  │  • Error handling and logging                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                          SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─ Business Logic Services ─────────────────────────────────────┐  │
│  │  • Assignment management                                      │  │
│  │  • AI integration (OpenAI GPT-4)                             │  │
│  │  • Plan generation and refinement                            │  │
│  │  • File upload and processing                                │  │
│  │  • User authentication and authorization                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─ Supabase Backend ────────────────────────────────────────────┐  │
│  │  • PostgreSQL database                                       │  │
│  │  • Real-time subscriptions                                   │  │
│  │  • Row Level Security (RLS)                                  │  │
│  │  • File storage                                              │  │
│  │  • Authentication service                                    │  │
│  └────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                         MONITORING LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─ Observability & Monitoring ──────────────────────────────────┐  │
│  │  • Sentry for error tracking                                 │  │
│  │  • Performance monitoring                                    │  │
│  │  • Health check endpoints                                    │  │
│  │  • Custom analytics                                          │  │
│  │  • Admin monitoring dashboard                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🧩 System Components

### Frontend Architecture

#### Next.js 14 App Router
- **Server Components** - Default rendering on server for better performance
- **Client Components** - Interactive components marked with 'use client'
- **Streaming** - Progressive page rendering
- **Nested Layouts** - Shared UI components across routes
- **Loading States** - Built-in loading UI patterns

### API Architecture

#### tRPC Router Structure
```typescript
export const appRouter = createTRPCRouter({
  user: userRouter,         // User management
  class: classRouter,       // Class CRUD operations
  assignment: assignmentRouter, // Assignment management
  ai: aiRouter,            // AI-powered features
  syllabus: syllabusRouter, // File processing
});
```

### Database Architecture

#### Schema Overview
```sql
-- Core entities
Users (Supabase Auth)
├── UserProfiles (1:1)
├── Classes (1:N)
│   └── Assignments (1:N)
│       ├── AssignmentPlans (1:1)
│       │   └── SubTasks (1:N)
│       └── PlanRefinementMessages (1:N)
└── Files (1:N)
```

## 🤖 AI Integration Architecture

### OpenAI Service Layer
The system integrates with OpenAI GPT-4 for intelligent assignment planning:

```
User Input → Plan Generation → Subtask Creation → Plan Refinement → Final Output
     ↓              ↓                ↓              ↓              ↓
  Requirements   GPT-4 API     Structured     Chat Interface   Actionable
  Collection    Processing      Tasks         Feedback Loop      Plan
```

## 📊 Data Flow Architecture

### Client-Server Communication
```
React Component
     ↓ (tRPC hook)
React Query
     ↓ (HTTP request)
tRPC API Route
     ↓ (business logic)
Service Layer
     ↓ (database query)
Supabase Client
     ↓ (SQL/RPC)
PostgreSQL Database
```

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login (Supabase Auth)
   ↓
2. Session Token Generated
   ↓
3. Token Stored in HTTP-only Cookie
   ↓
4. All API Requests Include Token
   ↓
5. Server Validates Token with Supabase
   ↓
6. User Context Available in tRPC
```

### Row Level Security (RLS)
All database tables implement RLS policies to ensure users can only access their own data.

## 🎨 UI/UX Architecture

### Design System
```
Design Tokens (Tailwind Config)
     ↓
Component Primitives (Radix UI)
     ↓
Base Components (Button, Card, etc.)
     ↓
Composite Components (AssignmentCard)
     ↓
Feature Components (AssignmentList)
     ↓
Page Components (Dashboard)
```

## 🚀 Deployment Architecture

### Multi-Environment Setup
```
Development
├── Local development server
├── Development Supabase project
└── OpenAI development API key

Staging  
├── Vercel preview deployment
├── Staging Supabase project
└── Integration testing

Production
├── Vercel production deployment
├── Production Supabase project
├── Monitoring and analytics
└── Error tracking (Sentry)
```

### Container Architecture (Docker)
```dockerfile
# Multi-stage build
FROM node:18-alpine AS base
FROM base AS deps        # Install dependencies
FROM base AS builder     # Build application  
FROM base AS runner      # Production runtime
```

## 📈 Performance Architecture

### Frontend Performance
- Code splitting with dynamic imports
- Image optimization with Next.js Image
- Static generation where possible
- Client-side caching with React Query

### Database Performance
- Proper indexing on frequently queried columns
- Efficient query patterns with joins
- Connection pooling via Supabase

### API Performance
- Request batching and deduplication
- Parallel requests where appropriate
- Caching with appropriate TTLs

## 🔄 Error Handling Architecture

### Client-Side Error Boundaries
Global and component-level error boundaries with Sentry integration.

### API Error Handling
Centralized error handling with proper HTTP status codes and user-friendly messages.

## 📊 Monitoring Architecture

```
Application
     ↓
Sentry (Error Tracking)
     ↓
Custom Analytics
     ↓
Health Check Endpoints
     ↓
Admin Dashboard
```

## 📝 Project Structure

```
project-assignment-tracker/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   ├── assignments/       # Assignment pages
│   │   ├── classes/           # Class management
│   │   ├── dashboard/         # User dashboard
│   │   └── admin/            # Admin pages
│   ├── components/           # React components
│   │   ├── features/         # Feature-specific components
│   │   ├── ui/              # Reusable UI components
│   │   └── layout/          # Layout components
│   ├── lib/                 # Utilities and configurations
│   ├── server/              # Server-side code
│   │   └── api/             # tRPC routers
│   ├── stores/              # Zustand state management
│   ├── types/               # TypeScript type definitions
│   └── styles/              # Global styles
├── docs/                    # Documentation
├── scripts/                 # Build and deployment scripts
└── tests/                   # E2E tests
```

## 🔮 Future Architecture Considerations

### Scalability Improvements
1. **Microservices Split** - AI service separation, file processing service
2. **Caching Layer** - Redis for session storage, CDN for static assets  
3. **Message Queues** - Background job processing, notifications

### Technology Evolution
1. **Enhanced AI Pipeline** - Custom model training, advanced analytics
2. **Edge Computing** - Global data distribution, reduced latency
3. **Real-time Features** - WebSocket integration, live collaboration

This architecture provides a solid foundation for the current requirements while maintaining flexibility for future enhancements and scaling needs.