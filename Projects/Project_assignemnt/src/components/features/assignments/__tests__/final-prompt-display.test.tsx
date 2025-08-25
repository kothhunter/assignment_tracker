import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { FinalPromptDisplay } from '../final-prompt-display';
import type { AssignmentPlan } from '@/types';

// Mock dependencies
jest.mock('sonner');

const mockToast = toast as jest.MockedObject<typeof toast>;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockPlan: AssignmentPlan = {
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
      generated_prompt: 'Detailed prompt for task 1. This explains what to do.',
      description: 'First task',
      estimated_hours: 2,
      status: 'pending' as const,
      due_date: '2025-12-01T23:59:59.000Z',
      order_index: 1,
      created_at: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      plan_id: 1,
      step_number: 2,
      title: 'Task 2',
      generated_prompt: 'Detailed prompt for task 2. This explains the second step.',
      description: 'Second task',
      estimated_hours: 3,
      status: 'pending' as const,
      due_date: '2025-12-01T23:59:59.000Z',
      order_index: 2,
      created_at: '2025-01-01T00:00:00.000Z'
    }
  ]
};

const mockPlanWithEmptyPrompts: AssignmentPlan = {
  ...mockPlan,
  sub_tasks: [
    {
      ...mockPlan.sub_tasks[0],
      generated_prompt: ''
    },
    {
      ...mockPlan.sub_tasks[1],
      generated_prompt: 'Detailed prompt for task 2. This explains the second step.'
    }
  ]
};

describe('FinalPromptDisplay', () => {
  const mockOnBackToDashboard = jest.fn();
  const mockOnRegeneratePrompts = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders completion status as complete when all prompts exist', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    expect(screen.getByText('All Prompts Generated Successfully!')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 prompts generated')).toBeInTheDocument();
  });

  it('renders completion status as incomplete when some prompts are missing', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlanWithEmptyPrompts}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    expect(screen.getByText('Prompt Generation Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 prompts generated - Some prompts may need regeneration')).toBeInTheDocument();
  });

  it('displays all sub-tasks in correct order', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Detailed prompt for task 1. This explains what to do.')).toBeInTheDocument();
    expect(screen.getByText('Detailed prompt for task 2. This explains the second step.')).toBeInTheDocument();
  });

  it('shows generated badge for tasks with prompts', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    const generatedBadges = screen.getAllByText('Generated');
    expect(generatedBadges).toHaveLength(2);
  });

  it('shows missing prompt badge for tasks without prompts', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlanWithEmptyPrompts}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    expect(screen.getByText('Missing Prompt')).toBeInTheDocument();
    expect(screen.getByText('Generated')).toBeInTheDocument();
    expect(screen.getByText('Prompt not generated or empty. Try regenerating prompts.')).toBeInTheDocument();
  });

  it('copies individual prompt to clipboard when copy button clicked', async () => {
    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    const copyButtons = screen.getAllByText('Copy');
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Detailed prompt for task 1. This explains what to do.');
      expect(mockToast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('handles clipboard copy failure gracefully', async () => {
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Copy failed'));

    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    const copyButtons = screen.getAllByText('Copy');
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to copy to clipboard');
    });
  });

  it('calls onBackToDashboard when back to dashboard button is clicked', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);

    expect(mockOnBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('calls onRegeneratePrompts when regenerate button is clicked', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlanWithEmptyPrompts}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    const regenerateButton = screen.getByText('Regenerate Missing');
    fireEvent.click(regenerateButton);

    expect(mockOnRegeneratePrompts).toHaveBeenCalledTimes(1);
  });

  it('shows regenerating state when isRegenerating is true', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlanWithEmptyPrompts}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={true}
      />
    );

    expect(screen.getAllByText('Regenerating...')[0]).toBeInTheDocument();
  });

  it('shows copy all prompts section when all prompts are generated', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    expect(screen.getByText('Copy All Prompts')).toBeInTheDocument();
    expect(screen.getByText('Copy all prompts at once for easy reference while working.')).toBeInTheDocument();
  });

  it('hides copy all prompts section when some prompts are missing', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlanWithEmptyPrompts}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    expect(screen.queryByText('Copy All Prompts')).not.toBeInTheDocument();
  });

  it('copies all prompts with proper formatting when copy all button is clicked', async () => {
    render(
      <FinalPromptDisplay
        plan={mockPlan}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    // Find the copy all button (last copy button in the component)
    const copyButtons = screen.getAllByText('Copy');
    const copyAllButton = copyButtons[copyButtons.length - 1];
    fireEvent.click(copyAllButton);

    const expectedText = '1. Task 1\n\nDetailed prompt for task 1. This explains what to do.\n\n---\n\n2. Task 2\n\nDetailed prompt for task 2. This explains the second step.';

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedText);
      expect(mockToast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('disables copy button for empty prompts', () => {
    render(
      <FinalPromptDisplay
        plan={mockPlanWithEmptyPrompts}
        assignmentId={1}
        onBackToDashboard={mockOnBackToDashboard}
        onRegeneratePrompts={mockOnRegeneratePrompts}
        isRegenerating={false}
      />
    );

    const copyButtons = screen.getAllByText('Copy');
    // The first task has an empty prompt, so its copy button should be disabled
    expect(copyButtons[0]).toBeDisabled();
  });
});