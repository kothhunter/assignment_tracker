import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AssignmentDetailPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

jest.mock('@/lib/trpc', () => ({
  api: {
    assignment: {
      getById: {
        useQuery: jest.fn(),
      },
      initiatePlan: {
        useMutation: jest.fn(),
      },
    },
  },
}));

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
const mockApi = require('@/lib/trpc').api;

describe('Assignment Detail Page - Submission Integration', () => {
  const mockAssignment = {
    id: 1,
    title: 'Test Assignment',
    due_date: '2024-12-25T23:59:00Z',
    status: 'incomplete',
    class: {
      id: 1,
      name: 'TEST 101',
      user_id: 'user1',
      created_at: '2024-01-01T00:00:00Z',
    },
    user_id: 'user1',
    class_id: 1,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: '1' });

    // Mock successful assignment fetch
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    });
  });

  it('integrates form submission with tRPC initiatePlan', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();
    const mockMutation = {
      mutate: mockMutate,
      isLoading: false,
      error: null,
    };

    mockApi.assignment.initiatePlan.useMutation.mockReturnValue(mockMutation);

    render(<AssignmentDetailPage />);

    // Fill in the instructions
    const textarea = screen.getByLabelText(/assignment instructions/i);
    await user.type(textarea, 'Test assignment instructions');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /begin planning/i });
    await user.click(submitButton);

    // Verify the mutation was called with correct parameters
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        assignment_id: 1,
        instructions: 'Test assignment instructions',
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();
    
    // Mock loading state
    mockApi.assignment.initiatePlan.useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: true,
      error: null,
    });

    render(<AssignmentDetailPage />);

    // The form should show loading state
    expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/assignment instructions/i)).toBeDisabled();
  });

  it('shows success toast and navigates on successful submission', async () => {
    const user = userEvent.setup();
    const mockPlan = {
      id: 1,
      assignment_id: 1,
      original_instructions: 'Test instructions',
      sub_tasks: [],
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockMutate = jest.fn();
    let onSuccessCallback: ((data: any) => void) | undefined;

    mockApi.assignment.initiatePlan.useMutation.mockImplementation((options: any) => {
      onSuccessCallback = options.onSuccess;
      return {
        mutate: mockMutate,
        isLoading: false,
        error: null,
      };
    });

    render(<AssignmentDetailPage />);

    // Simulate successful submission
    if (onSuccessCallback) {
      onSuccessCallback({ plan: mockPlan, message: 'Success' });
    }

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Assignment plan created successfully!');
      expect(mockPush).toHaveBeenCalledWith('/assignments/1/plan');
    });
  });

  it('shows error toast on submission failure', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Failed to create plan');
    const mockMutate = jest.fn();
    let onErrorCallback: ((error: any) => void) | undefined;

    mockApi.assignment.initiatePlan.useMutation.mockImplementation((options: any) => {
      onErrorCallback = options.onError;
      return {
        mutate: mockMutate,
        isLoading: false,
        error: null,
      };
    });

    render(<AssignmentDetailPage />);

    // Simulate error
    if (onErrorCallback) {
      onErrorCallback(mockError);
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create plan');
    });
  });

  it('handles network failures gracefully', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();
    let onErrorCallback: ((error: any) => void) | undefined;

    mockApi.assignment.initiatePlan.useMutation.mockImplementation((options: any) => {
      onErrorCallback = options.onError;
      return {
        mutate: mockMutate,
        isLoading: false,
        error: null,
      };
    });

    render(<AssignmentDetailPage />);

    // Simulate network error (no message)
    if (onErrorCallback) {
      onErrorCallback({});
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create assignment plan');
    });
  });

  it('renders Toaster component for notifications', () => {
    mockApi.assignment.initiatePlan.useMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    render(<AssignmentDetailPage />);
    
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('passes loading state to instruction input component', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();
    
    // Initially not loading
    mockApi.assignment.initiatePlan.useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    });

    const { rerender } = render(<AssignmentDetailPage />);
    
    // Fill in instructions and submit
    const textarea = screen.getByLabelText(/assignment instructions/i);
    await user.type(textarea, 'Test instructions');
    
    const submitButton = screen.getByRole('button', { name: /begin planning/i });
    expect(submitButton).not.toBeDisabled();

    // Mock loading state after submission
    mockApi.assignment.initiatePlan.useMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: true,
      error: null,
    });

    rerender(<AssignmentDetailPage />);

    // Should show loading state
    expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
  });
});