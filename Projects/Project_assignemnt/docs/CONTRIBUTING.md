# Contributing Guidelines

Thank you for your interest in contributing to the Project Assignment Tracker! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

We are committed to fostering a welcoming and inclusive community. Please read and follow our Code of Conduct:

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **GitHub Account** - [Create one here](https://github.com/join)
2. **Local Development Setup** - Follow the [Development Guide](DEVELOPMENT.md)
3. **Understanding of the Tech Stack**:
   - Next.js 14 (App Router)
   - TypeScript
   - tRPC
   - Supabase
   - Tailwind CSS

### First Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/project-assignment-tracker.git
   cd project-assignment-tracker
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/project-assignment-tracker.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment** following the [Development Guide](DEVELOPMENT.md)

## 📋 How to Contribute

### Types of Contributions

We welcome several types of contributions:

#### 🐛 Bug Reports
Found a bug? Please create an issue with:
- Clear, descriptive title
- Steps to reproduce the bug
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots/videos if applicable

#### ✨ Feature Requests
Have an idea for a new feature?
- Search existing issues first
- Create a detailed issue describing the feature
- Explain the problem it solves
- Consider implementation approaches

#### 🔧 Code Contributions
Ready to code? Great! Here's the process:

1. **Find or create an issue**
2. **Discuss the approach** (for larger changes)
3. **Follow the development workflow** (detailed below)
4. **Submit a pull request**

#### 📚 Documentation
Help improve our documentation:
- Fix typos or unclear explanations
- Add examples or tutorials
- Improve API documentation
- Translate documentation

#### 🧪 Testing
Improve our test coverage:
- Add unit tests for utilities and components
- Create integration tests for complex workflows
- Write E2E tests for user journeys
- Improve test performance and reliability

## 🔄 Development Workflow

### Branch Strategy

We follow **GitHub Flow**:
- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `test/*` - Test improvements

### Step-by-Step Workflow

#### 1. Sync with Upstream
```bash
git checkout main
git pull upstream main
git push origin main
```

#### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix-name
```

#### 3. Make Your Changes

**Code Quality Checklist:**
- [ ] Follow existing code style and patterns
- [ ] Write clear, descriptive commit messages
- [ ] Add appropriate comments for complex logic
- [ ] Update relevant documentation
- [ ] Add or update tests for your changes

#### 4. Test Your Changes
```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check

# Test build
npm run build

# Run E2E tests (if applicable)
npm run test:e2e
```

#### 5. Commit Your Changes

We use **Conventional Commits** for clear commit messages:

```bash
git add .
git commit -m "feat: add assignment due date reminders"
```

**Commit Types:**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, etc.

**Examples:**
```bash
git commit -m "feat: add AI plan refinement chat interface"
git commit -m "fix: resolve assignment deletion cascade issue"
git commit -m "docs: update API documentation for new endpoints"
git commit -m "test: add unit tests for assignment utilities"
```

#### 6. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

#### 7. Create Pull Request

1. **Go to GitHub** and navigate to your fork
2. **Click "Compare & pull request"**
3. **Fill out the PR template** (see template below)
4. **Request review** from maintainers

### Pull Request Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## How Has This Been Tested?
Describe the tests you ran to verify your changes.

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

## 🎯 Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Good: Clear, specific types
interface AssignmentFormData {
  title: string;
  description?: string;
  dueDate: Date | null;
  priority: 'low' | 'medium' | 'high';
  classId: string;
}

// Avoid: Loose typing
interface AssignmentFormData {
  title: any;
  description: string;
  dueDate: any;
  priority: string;
  classId: any;
}
```

#### Component Props
```typescript
// Good: Explicit props interface
interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function AssignmentCard({ assignment, onEdit, onDelete, className }: AssignmentCardProps) {
  // Component implementation
}
```

### React Guidelines

#### Component Structure
```typescript
// Good: Consistent component structure
export function AssignmentList({ className }: { className?: string }) {
  // 1. Hooks
  const { data: assignments, isLoading } = api.assignment.getAll.useQuery();
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  
  // 2. Computed values
  const filteredAssignments = useMemo(() => 
    assignments?.filter(assignment => filterAssignment(assignment, filter)) ?? [],
    [assignments, filter]
  );
  
  // 3. Event handlers
  const handleFilterChange = useCallback((newFilter: AssignmentFilter) => {
    setFilter(newFilter);
  }, []);
  
  // 4. Early returns
  if (isLoading) return <LoadingSpinner />;
  if (!assignments?.length) return <EmptyState />;
  
  // 5. Render
  return (
    <div className={cn('space-y-4', className)}>
      {/* Component JSX */}
    </div>
  );
}
```

#### Hooks Usage
```typescript
// Good: Custom hooks for complex logic
function useAssignmentFilters(assignments: Assignment[]) {
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  
  const filteredAssignments = useMemo(() => 
    filterAssignments(assignments, filter),
    [assignments, filter]
  );
  
  return {
    filter,
    filteredAssignments,
    setFilter,
  };
}
```

### API Guidelines

#### tRPC Procedures
```typescript
// Good: Validated input/output
export const assignmentRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        classId: z.string().optional(),
        status: z.enum(['pending', 'in_progress', 'completed']).optional(),
        sortBy: z.enum(['due_date', 'created_at', 'priority']).default('due_date'),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          status: z.enum(['pending', 'in_progress', 'completed']),
          // ... other fields
        })
      )
    )
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

#### Error Handling
```typescript
// Good: Proper error handling
export async function createAssignment(input: CreateAssignmentInput) {
  try {
    const assignment = await ctx.db.assignment.create({
      data: input,
    });
    return assignment;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Failed to create assignment',
        cause: error,
      });
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}
```

### CSS/Styling Guidelines

#### Tailwind Class Organization
```typescript
// Good: Organized by type
<div className={cn(
  // Layout
  'flex items-center justify-between',
  // Spacing
  'p-4 gap-3',
  // Appearance
  'bg-white rounded-lg border shadow-sm',
  // Interactive
  'hover:shadow-md transition-shadow',
  // Responsive
  'md:p-6 lg:gap-4',
  // Custom
  className
)}>
```

#### Component Variants
```typescript
// Good: Use CVA for variants
const cardVariants = cva(
  'rounded-lg border p-4 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-background border-border',
        destructive: 'bg-destructive/10 border-destructive/20',
        success: 'bg-green-50 border-green-200',
      },
      size: {
        sm: 'p-3 text-sm',
        default: 'p-4',
        lg: 'p-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## 🧪 Testing Guidelines

### Unit Tests

Test utilities and pure functions:

```typescript
// src/lib/__tests__/date-utils.test.ts
import { formatRelativeDate, isOverdue } from '../date-utils';

describe('date-utils', () => {
  describe('formatRelativeDate', () => {
    it('should format dates relative to now', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(tomorrow)).toBe('in 1 day');
    });

    it('should handle past dates', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeDate(yesterday)).toBe('1 day ago');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isOverdue(futureDate)).toBe(false);
    });
  });
});
```

### Component Tests

Test component behavior and user interactions:

```typescript
// src/components/ui/__tests__/assignment-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AssignmentCard } from '../assignment-card';

const mockAssignment = {
  id: '1',
  title: 'Test Assignment',
  status: 'pending' as const,
  priority: 'high' as const,
  dueDate: new Date('2024-12-01'),
  class: { name: 'Computer Science', color: '#3B82F6' },
};

describe('AssignmentCard', () => {
  it('should render assignment information', () => {
    render(<AssignmentCard assignment={mockAssignment} />);
    
    expect(screen.getByText('Test Assignment')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByTestId('priority-badge')).toHaveTextContent('High');
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<AssignmentCard assignment={mockAssignment} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByTestId('edit-button'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

### API Tests

Test tRPC procedures:

```typescript
// src/server/api/routers/__tests__/assignment.test.ts
import { createMockContext } from '@/server/api/__tests__/helpers';
import { assignmentRouter } from '../assignment';

describe('assignment router', () => {
  it('should create assignment', async () => {
    const ctx = createMockContext();
    const caller = assignmentRouter.createCaller(ctx);

    const result = await caller.create({
      title: 'Test Assignment',
      classId: 'class-1',
      priority: 'medium',
    });

    expect(result.title).toBe('Test Assignment');
    expect(result.priority).toBe('medium');
  });

  it('should throw error for invalid input', async () => {
    const ctx = createMockContext();
    const caller = assignmentRouter.createCaller(ctx);

    await expect(
      caller.create({
        title: '', // Invalid: empty title
        classId: 'class-1',
        priority: 'medium',
      })
    ).rejects.toThrow('Title is required');
  });
});
```

### E2E Tests

Test complete user workflows:

```typescript
// tests/assignment-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete assignment workflow', async ({ page }) => {
  // Login
  await page.goto('/auth');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');

  // Navigate to dashboard
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

  // Create assignment
  await page.click('[data-testid="create-assignment"]');
  await page.fill('[name="title"]', 'E2E Test Assignment');
  await page.selectOption('[name="classId"]', { label: 'Computer Science' });
  await page.click('[type="submit"]');

  // Verify assignment appears
  await expect(page.locator('text=E2E Test Assignment')).toBeVisible();

  // Generate AI plan
  await page.click('[data-testid="generate-plan"]');
  await page.fill('[name="requirements"]', 'Create a simple web application');
  await page.click('[data-testid="generate"]');

  // Wait for plan generation
  await expect(page.locator('[data-testid="plan-content"]')).toBeVisible();

  // Mark assignment as completed
  await page.click('[data-testid="mark-complete"]');
  await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Completed');
});
```

## 📚 Documentation Standards

### Code Comments

```typescript
/**
 * Calculates the priority level of an assignment based on due date and complexity
 * @param dueDate - The assignment due date
 * @param complexity - Estimated complexity (1-10 scale)
 * @returns Priority level: 'low', 'medium', or 'high'
 */
export function calculatePriority(
  dueDate: Date, 
  complexity: number = 5
): 'low' | 'medium' | 'high' {
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  // High priority: due soon or high complexity
  if (daysUntilDue <= 3 || complexity >= 8) {
    return 'high';
  }
  
  // Low priority: due far away and low complexity
  if (daysUntilDue > 14 && complexity <= 3) {
    return 'low';
  }
  
  // Medium priority: everything else
  return 'medium';
}
```

### API Documentation

Update API docs when adding new endpoints:

```typescript
/**
 * GET /api/trpc/assignment.getAll
 * 
 * Retrieves all assignments for the authenticated user
 * 
 * @param input.classId - Optional: Filter by class ID
 * @param input.status - Optional: Filter by status
 * @param input.sortBy - Optional: Sort field (default: due_date)
 * 
 * @returns Array of assignments with class information
 * 
 * @throws UNAUTHORIZED - User not authenticated
 * @throws BAD_REQUEST - Invalid filter parameters
 */
```

## 🚀 Performance Guidelines

### React Performance

```typescript
// Good: Memoize expensive calculations
const expensiveValue = useMemo(() => 
  assignments.reduce((acc, assignment) => 
    acc + calculateComplexity(assignment), 0
  ),
  [assignments]
);

// Good: Memoize event handlers
const handleAssignmentUpdate = useCallback(
  (id: string, updates: Partial<Assignment>) => {
    updateAssignment(id, updates);
  },
  [updateAssignment]
);
```

### Database Performance

```typescript
// Good: Include necessary relations
const assignments = await ctx.db.assignment.findMany({
  where: { userId: ctx.user.id },
  include: {
    class: {
      select: { id: true, name: true, color: true }
    },
    plan: {
      select: { id: true, status: true }
    }
  },
  orderBy: { dueDate: 'asc' }
});
```

## 🐛 Debugging Tips

### Common Issues

**TypeScript Errors:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npx tsc --noEmit
```

**Database Issues:**
```bash
# Reset database (development only)
npm run db:reset
npm run db:migrate
npm run db:seed
```

**Build Issues:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Debugging Tools

1. **React DevTools** - Inspect component state and props
2. **Network Tab** - Monitor API requests and responses
3. **Console Debugging** - Use meaningful console.log statements
4. **VS Code Debugger** - Set breakpoints in code

## 📝 Issue Guidelines

### Bug Reports

Use this template for bug reports:

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node Version: [e.g. 18.17.0]
- Package Version: [e.g. 1.2.3]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

Use this template for feature requests:

```markdown
**Feature Summary**
A brief summary of the feature you'd like to see.

**Problem Statement**
What problem does this feature solve? Who benefits from it?

**Proposed Solution**
Describe your proposed solution in detail.

**Alternative Solutions**
Describe any alternative solutions you've considered.

**Additional Context**
Add any other context, mockups, or examples.

**Implementation Notes**
Any technical considerations or constraints.
```

## 🏆 Recognition

Contributors are recognized in several ways:

1. **Contributors List** - Added to README.md
2. **Release Notes** - Mentioned in changelog
3. **GitHub Profile** - Contribution history
4. **Special Recognition** - For significant contributions

## 🔒 Security

### Reporting Security Issues

**Do NOT** create public issues for security vulnerabilities. Instead:

1. **Email security@yourproject.com** with details
2. **Include steps to reproduce** the vulnerability
3. **Wait for acknowledgment** before public disclosure
4. **Allow time for fixes** before publishing details

### Security Guidelines

- **Never commit secrets** (API keys, passwords, tokens)
- **Use environment variables** for configuration
- **Validate all inputs** on client and server
- **Follow OWASP guidelines** for web security
- **Keep dependencies updated** and monitor for vulnerabilities

## ❓ Questions?

If you have questions about contributing:

1. **Check existing documentation** first
2. **Search closed issues** for similar questions
3. **Create a discussion** for open-ended questions
4. **Join our community** channels (if available)

## 🎉 Thank You!

Thank you for taking the time to contribute! Every contribution, no matter how small, helps make the Project Assignment Tracker better for everyone.

**Happy contributing!** 🚀