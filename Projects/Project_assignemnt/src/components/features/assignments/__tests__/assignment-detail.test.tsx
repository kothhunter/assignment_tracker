import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentInstructionInput } from '../assignment-detail';

describe('AssignmentInstructionInput', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('renders the instruction input form', () => {
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Assignment Instructions')).toBeInTheDocument();
    expect(screen.getByLabelText(/assignment instructions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /begin planning/i })).toBeInTheDocument();
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    await user.type(textarea, 'Test instructions');
    
    expect(screen.getByText('17/5000 characters')).toBeInTheDocument();
  });

  it('validates required field', async () => {
    const user = userEvent.setup();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /begin planning/i });
    expect(submitButton).toBeDisabled();
    
    await user.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('enables submit button when instructions are provided', async () => {
    const user = userEvent.setup();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    const submitButton = screen.getByRole('button', { name: /begin planning/i });
    
    await user.type(textarea, 'Valid assignment instructions');
    
    expect(submitButton).not.toBeDisabled();
  });

  it('submits form with valid instructions', async () => {
    const user = userEvent.setup();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    const submitButton = screen.getByRole('button', { name: /begin planning/i });
    
    await user.type(textarea, 'Test assignment instructions');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test assignment instructions');
  });

  it('shows error for empty instructions on form submission', async () => {
    const user = userEvent.setup();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const form = screen.getByRole('button', { name: /begin planning/i }).closest('form');
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(screen.getByText('Assignment instructions are required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error for instructions exceeding character limit', async () => {
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    const submitButton = screen.getByRole('button', { name: /begin planning/i });
    
    // Create a string longer than 5000 characters and set it directly
    const longText = 'a'.repeat(5001);
    fireEvent.change(textarea, { target: { value: longText } });
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('5001/5000 characters')).toHaveClass('text-red-500');
  });

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    const form = screen.getByRole('button', { name: /begin planning/i }).closest('form');
    
    // Submit empty form to trigger error
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(screen.getByText('Assignment instructions are required')).toBeInTheDocument();
    });
    
    // Start typing to clear error
    await user.type(textarea, 'New text');
    
    expect(screen.queryByText('Assignment instructions are required')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} isLoading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /processing/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    expect(textarea).toBeDisabled();
  });

  it('simulates auto-save functionality', async () => {
    jest.useFakeTimers();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    
    // Set value to trigger debounced auto-save
    fireEvent.change(textarea, { target: { value: 'Test instructions for auto-save' } });
    
    // Fast-forward time to trigger debounced auto-save (1 second)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Check if localStorage was called (auto-save after debounce)
    expect(localStorage.getItem('draft-assignment-instructions')).toBe('Test instructions for auto-save');
    
    // Fast-forward additional time to show auto-save indicator
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Auto-saved')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('renders help tips', () => {
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Tips for better AI planning:')).toBeInTheDocument();
    expect(screen.getByText(/Be specific about requirements/)).toBeInTheDocument();
    expect(screen.getByText(/Include formatting guidelines/)).toBeInTheDocument();
  });

  it('trims whitespace from instructions before submission', async () => {
    const user = userEvent.setup();
    render(<AssignmentInstructionInput onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByLabelText(/assignment instructions/i);
    const submitButton = screen.getByRole('button', { name: /begin planning/i });
    
    // Set value directly instead of typing
    fireEvent.change(textarea, { target: { value: '   Test instructions with whitespace   ' } });
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test instructions with whitespace');
  });
});