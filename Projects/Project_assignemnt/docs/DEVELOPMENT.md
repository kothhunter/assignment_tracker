# Development Guide

This guide will help you set up the Project Assignment Tracker for local development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "Supabase.supabase-vscode",
    "ms-vscode.vscode-json"
  ]
}
```

## 🚀 Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/project-assignment-tracker.git
cd project-assignment-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

### 4. Set Up Supabase

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Create a new account or sign in
   - Create a new project

2. **Get Supabase Credentials**
   - In your Supabase dashboard, go to Settings > API
   - Copy your Project URL and anon key
   - Go to Settings > Database and copy your service role key

3. **Configure Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 5. Set Up Database Schema

Run the SQL migrations in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL files in order:

```sql
-- 1. First, run the complete migration
-- Copy and paste the contents of: database-migration-complete.sql

-- 2. Then, run the planning tables migration
-- Copy and paste the contents of: database-migration-planning-tables.sql

-- 3. Finally, run the refinement messages migration
-- Copy and paste the contents of: database-migration-refinement-messages.sql
```

### 6. Configure OpenAI API

1. **Get OpenAI API Key**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign in or create an account
   - Navigate to API Keys
   - Create a new API key

2. **Add to Environment**
   ```env
   OPENAI_API_KEY=sk-your_openai_api_key_here
   ```

### 7. Configure Authentication

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

Add it to your `.env.local`:
```env
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 8. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application running!

## 🏗️ Project Structure

```
project-assignment-tracker/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── assignments/       # Assignment pages
│   │   ├── classes/           # Class management
│   │   ├── dashboard/         # User dashboard
│   │   └── api/              # API routes
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
├── tests/                   # E2E tests
└── public/                  # Static assets
```

## 🔧 Development Tools

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors

# Testing
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run Playwright E2E tests

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with test data
npm run db:reset        # Reset database

# Deployment
npm run deploy:vercel   # Deploy to Vercel
npm run deploy:docker   # Deploy with Docker
npm run health-check    # Run health checks

# Docker
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
npm run docker:compose:up   # Start with Docker Compose
npm run docker:compose:down # Stop Docker Compose
```

### Code Quality Tools

The project uses several tools to maintain code quality:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files

### Pre-commit Hooks

The project automatically runs the following on commit:
- ESLint fixing
- Prettier formatting
- TypeScript type checking
- Test execution

## 🧪 Testing

### Unit Tests (Jest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test file patterns:**
- `**/*.test.ts` - Unit tests
- `**/*.test.tsx` - Component tests
- `**/__tests__/**/*` - Test files in dedicated folders

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/assignment-creation.spec.ts

# Run tests in headed mode
npx playwright test --headed

# Debug tests
npx playwright test --debug
```

### Writing Tests

**Unit Test Example:**
```typescript
// src/lib/__tests__/utils.test.ts
import { formatDate, calculatePriority } from '../utils';

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-01');
      expect(formatDate(date)).toBe('Jan 1, 2024');
    });
  });

  describe('calculatePriority', () => {
    it('should return high priority for urgent assignments', () => {
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      expect(calculatePriority(dueDate)).toBe('high');
    });
  });
});
```

**Component Test Example:**
```typescript
// src/components/ui/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**E2E Test Example:**
```typescript
// tests/assignment-creation.spec.ts
import { test, expect } from '@playwright/test';

test('should create new assignment', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Click create assignment button
  await page.click('[data-testid="create-assignment"]');
  
  // Fill form
  await page.fill('[name="title"]', 'Test Assignment');
  await page.fill('[name="description"]', 'Test description');
  await page.selectOption('[name="class_id"]', { label: 'Computer Science' });
  
  // Submit form
  await page.click('[type="submit"]');
  
  // Verify assignment was created
  await expect(page.locator('text=Test Assignment')).toBeVisible();
});
```

## 🗄️ Database Management

### Schema Changes

1. **Make changes to your Supabase database** via the dashboard
2. **Export the schema** using Supabase CLI or SQL editor
3. **Update migration files** in the repository
4. **Test migrations** on a fresh database

### Local Database (Development)

For local development, you can use Docker to run PostgreSQL:

```bash
# Start local PostgreSQL
docker run -d \
  --name postgres-dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=project_assignment \
  -p 5432:5432 \
  postgres:15

# Connect to database
psql -h localhost -U postgres -d project_assignment
```

### Seeding Data

Create test data for development:

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  // Create test user
  const { data: user } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'password123',
  });

  // Create test classes
  const { data: classes } = await supabase
    .from('classes')
    .insert([
      { name: 'Computer Science', color: '#3B82F6', user_id: user.user.id },
      { name: 'Mathematics', color: '#EF4444', user_id: user.user.id }
    ])
    .select();

  // Create test assignments
  await supabase
    .from('assignments')
    .insert([
      {
        title: 'Final Project',
        description: 'Complete the final project',
        class_id: classes[0].id,
        user_id: user.user.id,
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);

  console.log('✅ Database seeded successfully');
}

seed().catch(console.error);
```

## 🔄 State Management

The application uses **Zustand** for state management:

### Creating a Store

```typescript
// src/stores/assignments.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Assignment {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface AssignmentStore {
  assignments: Assignment[];
  filter: string;
  setAssignments: (assignments: Assignment[]) => void;
  setFilter: (filter: string) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
}

export const useAssignmentStore = create<AssignmentStore>()(
  devtools(
    (set, get) => ({
      assignments: [],
      filter: 'all',
      
      setAssignments: (assignments) => set({ assignments }),
      
      setFilter: (filter) => set({ filter }),
      
      updateAssignment: (id, updates) => set((state) => ({
        assignments: state.assignments.map((assignment) =>
          assignment.id === id ? { ...assignment, ...updates } : assignment
        ),
      })),
    }),
    { name: 'assignment-store' }
  )
);
```

### Using Stores in Components

```typescript
// src/components/assignment-list.tsx
import { useAssignmentStore } from '@/stores/assignments';

export function AssignmentList() {
  const { assignments, filter, setFilter } = useAssignmentStore();
  
  const filteredAssignments = assignments.filter(assignment => 
    filter === 'all' || assignment.status === filter
  );

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      
      {filteredAssignments.map(assignment => (
        <AssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  );
}
```

## 🎨 Styling Guidelines

### Tailwind CSS

The project uses Tailwind CSS for styling:

```typescript
// Good: Semantic class names
<div className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
  Button
</div>

// Better: Component with variants
<Button variant="primary" size="md">
  Button
</Button>
```

### Component Variants

Use `class-variance-authority` for component variants:

```typescript
// src/components/ui/button.tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### Dark Mode

The application supports dark mode using Tailwind's dark mode classes:

```typescript
// Light and dark mode styles
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

## 🔍 Debugging

### Development Tools

1. **React Developer Tools**
   - Install the browser extension
   - Inspect component state and props

2. **Network Tab**
   - Monitor API requests
   - Check response times and errors

3. **tRPC DevTools**
   - Available in development mode
   - Shows all tRPC calls and responses

### Common Issues

**Issue: Supabase connection errors**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/classes"
```

**Issue: OpenAI API errors**
```bash
# Test OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"test"}]}' \
     https://api.openai.com/v1/chat/completions
```

**Issue: Build failures**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

### Logging

Enable debug logging in development:

```typescript
// src/lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDev) console.debug(`[DEBUG] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};
```

## 📦 Building for Production

### Local Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables

Production environment variables should be set securely:

```env
# Production .env (never commit this file)
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
OPENAI_API_KEY=sk-your_prod_openai_key
NEXTAUTH_SECRET=your_secure_prod_secret
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

### Performance Optimization

1. **Image Optimization**
   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={500}
     height={300}
     priority // For above-the-fold images
   />
   ```

2. **Dynamic Imports**
   ```typescript
   import dynamic from 'next/dynamic';
   
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <div>Loading...</div>,
   });
   ```

3. **Bundle Analysis**
   ```bash
   # Analyze bundle size
   ANALYZE=true npm run build
   ```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Contributing Steps

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/project-assignment-tracker.git
   ```

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

4. **Test & Lint**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub
   - Create PR from your branch to main
   - Fill in PR template

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🆘 Getting Help

- **Documentation**: Check this development guide and other docs
- **Issues**: Search existing issues or create a new one
- **Discussions**: Start a discussion for questions and ideas
- **Health Check**: Visit `/api/health/detailed` for system diagnostics

---

Happy coding! 🚀