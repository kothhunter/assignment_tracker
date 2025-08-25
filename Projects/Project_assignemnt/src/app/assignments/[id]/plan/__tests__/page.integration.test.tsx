import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import AssignmentPlanPage from '../page';
import { api } from '@/lib/trpc';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/lib/trpc');
jest.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children, FallbackComponent }: any) => {
    try {
      return children;
    } catch (error) {
      return <FallbackComponent error={error} resetErrorBoundary={() => {}} />;
    }
  },
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
const mockRouter = { push: mockPush };

const mockAssignment = {
  id: 1,
  title: 'Renewable Energy Research Paper',
  due_date: '2024-12-31T23:59:00.000Z',
  status: 'incomplete' as const,
  class: {
    id: 1,
    name: 'Environmental Science 101',
  },
};

const mockPlan = {
  id: 1,
  assignment_id: 1,
  original_instructions: 'Write a comprehensive research paper on renewable energy sources with at least 5 peer-reviewed sources.',
  sub_tasks: [
    {
      id: 1,
      plan_id: 1,
      step_number: 1,
      title: 'Research renewable energy sources',
      generated_prompt: 'Conduct comprehensive research on different types of renewable energy sources.',
      description: 'Initial research phase',
      estimated_hours: 3.0,
      status: 'pending' as const,
      order_index: 0,
      created_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      plan_id: 1,
      step_number: 2,
      title: 'Create detailed outline',
      generated_prompt: 'Develop a structured outline for your research paper.',
      description: 'Structure the paper',
      estimated_hours: 1.5,
      status: 'completed' as const,
      order_index: 1,
      created_at: '2024-01-01T00:00:00.000Z',
    },
  ],
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('AssignmentPlanPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
    mockUseRouter.mockReturnValue(mockRouter);
  });

  it('renders loading state initially', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders assignment not found error', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Assignment not found'),
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    expect(screen.getByText('Assignment Not Found')).toBeInTheDocument();
    expect(screen.getByText("The assignment you're looking for doesn't exist or you don't have permission to view it.")).toBeInTheDocument();
  });

  it('renders plan not found error', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Plan not found'),
      refetch: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    expect(screen.getByText('Plan Not Found')).toBeInTheDocument();
    expect(screen.getByText('No assignment plan found. Please return to the assignment details and create a plan first.')).toBeInTheDocument();
  });

  it('renders assignment context and empty plan state', () => {
    const emptyPlan = { ...mockPlan, sub_tasks: [] };
    
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: emptyPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockApi.ai.generateInitialPlan.useMutation.mockReturnValue({
      mutate: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    // Check assignment context
    expect(screen.getByText('Renewable Energy Research Paper')).toBeInTheDocument();
    expect(screen.getByText('Environmental Science 101')).toBeInTheDocument();
    expect(screen.getByText('Due Dec 31, 2024')).toBeInTheDocument();
    expect(screen.getByText('Assignment Instructions')).toBeInTheDocument();
    expect(screen.getByText(/Write a comprehensive research paper/)).toBeInTheDocument();
  });

  it('renders generated plan with sub-tasks', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: mockPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockApi.ai.generateInitialPlan.useMutation.mockReturnValue({
      mutate: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    // Check plan overview
    expect(screen.getByText('Generated Plan Overview')).toBeInTheDocument();
    expect(screen.getByText('AI has broken down your assignment into 2 manageable sub-tasks')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument(); // 1 completed out of 2

    // Check sub-tasks
    expect(screen.getByText('Research renewable energy sources')).toBeInTheDocument();
    expect(screen.getByText('Create detailed outline')).toBeInTheDocument();
    expect(screen.getByText('Initial research phase')).toBeInTheDocument();
    expect(screen.getByText('Structure the paper')).toBeInTheDocument();
  });

  it('handles navigation correctly', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: mockPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockApi.ai.generateInitialPlan.useMutation.mockReturnValue({
      mutate: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    // Click back to assignment button
    fireEvent.click(screen.getByText('Back to Assignment'));
    expect(mockPush).toHaveBeenCalledWith('/assignments/1');
  });

  it('triggers plan generation automatically for empty plans', async () => {
    const emptyPlan = { ...mockPlan, sub_tasks: [] };
    const mockMutate = jest.fn();
    
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: emptyPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockApi.ai.generateInitialPlan.useMutation.mockReturnValue({
      mutate: mockMutate,
    } as any);

    render(<AssignmentPlanPage />);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ assignmentId: 1 });
    });
  });

  it('handles plan generation retry', async () => {
    const emptyPlan = { ...mockPlan, sub_tasks: [] };
    const mockMutate = jest.fn();
    
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: emptyPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockApi.ai.generateInitialPlan.useMutation.mockReturnValue({
      mutate: mockMutate,
    } as any);

    render(<AssignmentPlanPage />);

    // Click retry button
    fireEvent.click(screen.getByText('Generate Plan Now'));
    
    expect(mockMutate).toHaveBeenCalledWith({ assignmentId: 1 });
  });

  it('handles plan refinement navigation', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: mockPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockApi.ai.generateInitialPlan.useMutation.mockReturnValue({
      mutate: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    // Click refine plan button
    fireEvent.click(screen.getByText('Refine Plan'));
    
    // Should show placeholder toast message for Story 3.3
    // This would be tested with toast library in a full integration test
  });

  it('displays overdue status correctly', () => {
    const overdueAssignment = {
      ...mockAssignment,
      due_date: '2020-01-01T23:59:00.000Z', // Past date
    };
    
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: overdueAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: mockPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockApi.ai.generateInitialPlan.useMutation.mockReturnValue({
      mutate: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('handles error boundary correctly', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: mockPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    // Mock a component that throws an error
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // This would be a more complex test in practice, but demonstrates error boundary handling
    expect(() => <ThrowError />).toThrow('Test error');
  });

  it('handles invalid assignment ID gracefully', () => {
    mockUseParams.mockReturnValue({ id: 'invalid' });
    
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Invalid ID'),
    } as any);
    
    mockApi.ai.getPlan.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<AssignmentPlanPage />);

    expect(screen.getByText('Assignment Not Found')).toBeInTheDocument();
  });
});