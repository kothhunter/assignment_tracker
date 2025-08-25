import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { AssignmentForm } from '../assignment-form';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/trpc', () => ({
  api: {
    class: {
      getAll: {
        useQuery: jest.fn(),
      },
    },
    assignment: {
      createManual: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock('@/stores/assignments', () => ({
  useAssignmentStore: () => ({
    addAssignment: jest.fn(),
  }),
}));

const mockApi = require('@/lib/trpc').api;

describe('AssignmentForm', () => {
  const mockOnSuccess = jest.fn();
  const mockMutateAsync = jest.fn();
  const mockAddAssignment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock classes query
    mockApi.class.getAll.useQuery.mockReturnValue({
      data: [
        { id: 1, name: 'Math 101', user_id: 'user1', created_at: '2024-01-01' },
        { id: 2, name: 'History 201', user_id: 'user1', created_at: '2024-01-01' },
      ],
      isLoading: false,
    });

    // Mock create assignment mutation
    mockApi.assignment.createManual.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    require('@/stores/assignments').useAssignmentStore.mockReturnValue({
      addAssignment: mockAddAssignment,
    });
  });

  it('renders form trigger button', () => {
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    expect(screen.getByRole('button', { name: /add assignment/i })).toBeInTheDocument();
  });

  it('opens dialog when trigger button is clicked', async () => {
    const user = userEvent.setup();
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create New Assignment')).toBeInTheDocument();
  });

  it('renders form fields when dialog is open', async () => {
    const user = userEvent.setup();
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    
    expect(screen.getByLabelText(/assignment title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('populates class dropdown with user classes', async () => {
    const user = userEvent.setup();
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    await user.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('Math 101')).toBeInTheDocument();
    expect(screen.getByText('History 201')).toBeInTheDocument();
  });

  it('shows loading state when classes are loading', async () => {
    mockApi.class.getAll.useQuery.mockReturnValue({
      data: [],
      isLoading: true,
    });

    const user = userEvent.setup();
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    await user.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('Loading classes...')).toBeInTheDocument();
  });

  it('shows empty state when no classes available', async () => {
    mockApi.class.getAll.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    await user.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('No classes available')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    await user.click(screen.getByRole('button', { name: /create assignment/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Assignment title is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockAssignment = {
      id: 1,
      title: 'Test Assignment',
      class_id: 1,
      due_date: '2024-12-31T23:59',
      status: 'incomplete',
      user_id: 'user1',
      created_at: '2024-01-01',
      class: { id: 1, name: 'Math 101', user_id: 'user1', created_at: '2024-01-01' },
    };

    mockMutateAsync.mockResolvedValue(mockAssignment);

    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    
    // Fill form
    await user.type(screen.getByLabelText(/assignment title/i), 'Test Assignment');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Math 101'));
    await user.type(screen.getByLabelText(/due date/i), '2024-12-31T23:59');
    
    await user.click(screen.getByRole('button', { name: /create assignment/i }));
    
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        title: 'Test Assignment',
        class_id: 1,
        due_date: '2024-12-31T23:59',
      });
    });

    expect(mockAddAssignment).toHaveBeenCalledWith(mockAssignment);
    expect(toast.success).toHaveBeenCalledWith('Assignment created successfully!');
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('handles form submission error', async () => {
    const user = userEvent.setup();
    const error = new Error('Failed to create assignment');
    
    mockMutateAsync.mockRejectedValue(error);

    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    
    // Fill form
    await user.type(screen.getByLabelText(/assignment title/i), 'Test Assignment');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Math 101'));
    await user.type(screen.getByLabelText(/due date/i), '2024-12-31T23:59');
    
    await user.click(screen.getByRole('button', { name: /create assignment/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create assignment');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('resets form when dialog is closed', async () => {
    const user = userEvent.setup();
    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    
    // Fill form
    await user.type(screen.getByLabelText(/assignment title/i), 'Test Assignment');
    
    // Close dialog
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Reopen dialog
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    
    // Form should be reset
    expect(screen.getByLabelText(/assignment title/i)).toHaveValue('');
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    
    mockApi.assignment.createManual.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });

    render(<AssignmentForm onSuccess={mockOnSuccess} />);
    
    await user.click(screen.getByRole('button', { name: /add assignment/i }));
    
    expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
  });
});