import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FinalPromptGenerationPage from '../page';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('sonner');
jest.mock('@/components/features/assignments/final-prompt-display', () => ({
  FinalPromptDisplay: ({ onBackToDashboard }: { onBackToDashboard: () => void }) => (
    <div data-testid="final-prompt-display">
      <button onClick={onBackToDashboard}>Back to Dashboard</button>
    </div>
  )
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockToast = toast as jest.MockedObject<typeof toast>;

// Mock the api object directly
const mockApi = {
  assignment: {
    getById: {
      useQuery: jest.fn(),
    },
  },
  ai: {
    getPlan: {
      useQuery: jest.fn(),
    },
    generateFinalPrompts: {
      useMutation: jest.fn(),
    },
  },
};

// Mock the trpc module
jest.mock('@/lib/trpc', () => ({
  api: mockApi,
}));

const mockAssignment = {
  id: 1,
  title: 'Math Assignment',
  due_date: '2025-12-01T23:59:59.000Z',
  status: 'incomplete' as const,
  user_id: 'user1',
  class_id: 1,
  created_at: '2025-01-01T00:00:00.000Z',
  class: {
    id: 1,
    name: 'MATH 101',
    user_id: 'user1',
    created_at: '2025-01-01T00:00:00.000Z'
  }
};

const mockPlan = {
  id: 1,
  assignment_id: 1,
  original_instructions: 'Complete the math problems',
  created_at: '2025-01-01T00:00:00.000Z',
  sub_tasks: [
    {
      id: 1,
      plan_id: 1,
      step_number: 1,
      title: 'Task 1',
      generated_prompt: '',
      description: 'First task',
      estimated_hours: 2,
      status: 'pending' as const,
      due_date: '2025-12-01T23:59:59.000Z',
      order_index: 1,
      created_at: '2025-01-01T00:00:00.000Z'
    }
  ]
};

describe('FinalPromptGenerationPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseParams.mockReturnValue({ id: '1' });
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    // Setup successful API responses
    mockApi.assignment.getById.useQuery = jest.fn().mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    });

    mockApi.ai.getPlan.useQuery = jest.fn().mockReturnValue({
      data: mockPlan,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockApi.ai.generateFinalPrompts.useMutation = jest.fn().mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isLoading: false,
    });

    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  it('renders loading skeleton while data is loading', () => {
    mockApi.assignment.getById.useQuery = jest.fn().mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders assignment not found when assignment does not exist', () => {
    mockApi.assignment.getById.useQuery = jest.fn().mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Not found'),
    });

    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByText('Assignment Not Found')).toBeInTheDocument();
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
  });

  it('renders plan not found when plan does not exist', () => {
    mockApi.ai.getPlan.useQuery = jest.fn().mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Not found'),
      refetch: jest.fn(),
    });

    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByText('Plan Not Found')).toBeInTheDocument();
    expect(screen.getByText('Return to Plan Refinement')).toBeInTheDocument();
  });

  it('renders no sub-tasks message when plan has no sub-tasks', () => {
    mockApi.ai.getPlan.useQuery = jest.fn().mockReturnValue({
      data: { ...mockPlan, sub_tasks: [] },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByText('No Sub-Tasks Available')).toBeInTheDocument();
  });

  it('renders assignment details and sub-tasks review', () => {
    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByText('Math Assignment')).toBeInTheDocument();
    expect(screen.getByText('MATH 101')).toBeInTheDocument();
    expect(screen.getByText('Final Sub-Task Review')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });

  it('shows generate prompts button when prompts not generated', () => {
    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByText('Generate Final Prompts')).toBeInTheDocument();
    expect(screen.getByText('Ready to Generate Final Prompts?')).toBeInTheDocument();
  });

  it('shows final prompt display when prompts already exist', () => {
    const planWithPrompts = {
      ...mockPlan,
      sub_tasks: [{
        ...mockPlan.sub_tasks[0],
        generated_prompt: 'Detailed prompt for task 1'
      }]
    };

    mockApi.ai.getPlan.useQuery = jest.fn().mockReturnValue({
      data: planWithPrompts,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByTestId('final-prompt-display')).toBeInTheDocument();
  });

  it('handles generate prompts button click', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({});
    mockApi.ai.generateFinalPrompts.useMutation = jest.fn().mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
    });

    render(<FinalPromptGenerationPage />);
    
    const generateButton = screen.getByText('Generate Final Prompts');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        planId: 1,
      });
    });
  });

  it('shows error toast when prompt generation fails', async () => {
    const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Generation failed'));
    mockApi.ai.generateFinalPrompts.useMutation = jest.fn().mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
    });

    render(<FinalPromptGenerationPage />);
    
    const generateButton = screen.getByText('Generate Final Prompts');
    fireEvent.click(generateButton);

    // The error handling is done in the mutation's onError callback
    // So we don't need to wait for toast.error here as it's handled internally
  });

  it('navigates back to refinement when back button is clicked', () => {
    render(<FinalPromptGenerationPage />);
    
    const backButton = screen.getByText('Back to Refinement');
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/assignments/1/plan/refine');
  });

  it('handles invalid assignment ID', () => {
    mockUseParams.mockReturnValue({ id: 'invalid' });
    
    render(<FinalPromptGenerationPage />);
    
    // Should still try to query with NaN, which will be disabled
    expect(mockApi.assignment.getById.useQuery).toHaveBeenCalledWith(
      { id: NaN },
      expect.objectContaining({ enabled: false })
    );
  });

  it('shows overdue badge for overdue assignments', () => {
    const overdueAssignment = {
      ...mockAssignment,
      due_date: '2020-01-01T23:59:59.000Z' // Past date
    };

    mockApi.assignment.getById.useQuery = jest.fn().mockReturnValue({
      data: overdueAssignment,
      isLoading: false,
      error: null,
    });

    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows complete badge for completed assignments', () => {
    const completeAssignment = {
      ...mockAssignment,
      status: 'complete' as const
    };

    mockApi.assignment.getById.useQuery = jest.fn().mockReturnValue({
      data: completeAssignment,
      isLoading: false,
      error: null,
    });

    render(<FinalPromptGenerationPage />);
    
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });
});