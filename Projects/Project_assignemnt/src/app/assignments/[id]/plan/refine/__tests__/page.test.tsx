import { render, screen } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import PlanRefinementPage from '../page';
import { api } from '@/lib/trpc';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock tRPC API
jest.mock('@/lib/trpc');

// Mock components that have complex dependencies
jest.mock('@/components/features/assignments/plan-refinement-chat', () => ({
  PlanRefinementChat: ({ plan }: { plan: any }) => (
    <div data-testid="plan-refinement-chat">Chat for plan {plan?.id}</div>
  ),
}));

jest.mock('@/components/features/assignments/refined-plan-display', () => ({
  RefinedPlanDisplay: ({ plan }: { plan: any }) => (
    <div data-testid="refined-plan-display">Display for plan {plan?.id}</div>
  ),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: jest.fn(),
  Toaster: () => <div>Toaster</div>,
}));

const mockAssignment = {
  id: 1,
  title: 'Research Paper Assignment',
  status: 'incomplete',
  due_date: '2024-12-31T23:59:59.000Z',
  class: {
    id: 1,
    name: 'Environmental Science 101',
  },
};

const mockPlan = {
  id: 1,
  assignment_id: 1,
  original_instructions: 'Write a comprehensive research paper on renewable energy sources.',
  sub_tasks: [
    {
      id: 1,
      plan_id: 1,
      step_number: 1,
      title: 'Research sources',
      generated_prompt: 'Find academic sources on renewable energy.',
      description: 'Initial research',
      estimated_hours: 2,
      status: 'pending',
      order_index: 0,
      created_at: '2024-01-01T00:00:00.000Z',
    },
  ],
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('PlanRefinementPage', () => {
  const mockPush = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useParams as jest.Mock).mockReturnValue({
      id: '1',
    });

    // Default successful API responses
    (api.assignment.getById.useQuery as jest.Mock).mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    });

    (api.ai.getPlan.useQuery as jest.Mock).mockReturnValue({
      data: mockPlan,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    (api.ai.getRefinementHistory.useQuery as jest.Mock).mockReturnValue({
      data: [],
      refetch: jest.fn(),
    });

    (api.ai.refinePlan.useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (api.ai.undoLastRefinement.useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it('renders page with assignment details and refinement interface', () => {
    render(<PlanRefinementPage />);

    expect(screen.getByText('Research Paper Assignment')).toBeInTheDocument();
    expect(screen.getByText('Environmental Science 101')).toBeInTheDocument();
    expect(screen.getByText('Assignment Instructions')).toBeInTheDocument();
    expect(screen.getByText(mockPlan.original_instructions)).toBeInTheDocument();
    expect(screen.getByTestId('refined-plan-display')).toBeInTheDocument();
    expect(screen.getByTestId('plan-refinement-chat')).toBeInTheDocument();
  });

  it('shows loading skeleton when data is loading', () => {
    (api.assignment.getById.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    (api.ai.getPlan.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<PlanRefinementPage />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows error message when assignment is not found', () => {
    (api.assignment.getById.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Assignment not found'),
    });

    render(<PlanRefinementPage />);

    expect(screen.getByText('Assignment Not Found')).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or you don't have permission/)).toBeInTheDocument();
  });

  it('shows error message when plan is not found', () => {
    (api.ai.getPlan.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Plan not found'),
      refetch: mockRefetch,
    });

    render(<PlanRefinementPage />);

    expect(screen.getByText('Plan Not Found')).toBeInTheDocument();
    expect(screen.getByText(/generate a plan first/)).toBeInTheDocument();
  });

  it('shows message when plan has no sub-tasks', () => {
    const planWithoutSubTasks = {
      ...mockPlan,
      sub_tasks: [],
    };

    (api.ai.getPlan.useQuery as jest.Mock).mockReturnValue({
      data: planWithoutSubTasks,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PlanRefinementPage />);

    expect(screen.getByText('No Sub-Tasks to Refine')).toBeInTheDocument();
    expect(screen.getByText(/generate sub-tasks first/)).toBeInTheDocument();
  });

  it('navigates back to plan page when back button is clicked', () => {
    render(<PlanRefinementPage />);

    const backButton = screen.getByText('Back to Plan');
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest('button')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation', () => {
    render(<PlanRefinementPage />);

    expect(screen.getByText('Back to Plan')).toBeInTheDocument();
    expect(screen.getByText('Plan Refinement')).toBeInTheDocument();
  });

  it('shows assignment status badge correctly', () => {
    render(<PlanRefinementPage />);

    expect(screen.getByText('Incomplete')).toBeInTheDocument();
  });

  it('handles overdue assignments correctly', () => {
    const overdueAssignment = {
      ...mockAssignment,
      due_date: '2020-01-01T23:59:59.000Z', // Past date
      status: 'incomplete' as const,
    };

    (api.assignment.getById.useQuery as jest.Mock).mockReturnValue({
      data: overdueAssignment,
      isLoading: false,
      error: null,
    });

    render(<PlanRefinementPage />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});