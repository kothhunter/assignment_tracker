import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanRefinementChat } from '../plan-refinement-chat';
import type { AssignmentPlan, RefinementMessage } from '@/types';
import { api } from '@/lib/trpc';

// Mock the tRPC API
jest.mock('@/lib/trpc');

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatString) => '10:30 AM'),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockPlan: AssignmentPlan = {
  id: 1,
  assignment_id: 1,
  original_instructions: 'Write a research paper on renewable energy sources.',
  sub_tasks: [
    {
      id: 1,
      plan_id: 1,
      step_number: 1,
      title: 'Research and gather sources',
      generated_prompt: 'Conduct thorough research on the topic using academic databases.',
      description: 'Initial research phase',
      estimated_hours: 2.5,
      status: 'pending',
      order_index: 0,
      created_at: '2024-01-01T00:00:00.000Z',
    },
  ],
  created_at: '2024-01-01T00:00:00.000Z',
};

const mockMessages: RefinementMessage[] = [
  {
    id: 1,
    plan_id: 1,
    message_type: 'user',
    content: 'Add a step about reviewing sources',
    timestamp: '2024-01-01T10:30:00.000Z',
    created_at: '2024-01-01T10:30:00.000Z',
  },
  {
    id: 2,
    plan_id: 1,
    message_type: 'system',
    content: 'I\'ve added a new step about reviewing sources after the research phase.',
    timestamp: '2024-01-01T10:31:00.000Z',
    change_summary: 'Added step 2: Review and validate sources',
    created_at: '2024-01-01T10:31:00.000Z',
  },
];

describe('PlanRefinementChat', () => {
  const mockOnPlanUpdated = jest.fn();
  const mockOnProceedToPromptGeneration = jest.fn();
  const mockAssignmentId = 1;

  const mockRefinePlanMutation = {
    mutate: jest.fn(),
    isPending: false,
  };

  const mockUndoMutation = {
    mutate: jest.fn(),
    isPending: false,
  };

  const mockHistoryQuery = {
    data: [],
    refetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (api.ai.getRefinementHistory.useQuery as jest.Mock).mockReturnValue(mockHistoryQuery);
    (api.ai.refinePlan.useMutation as jest.Mock).mockReturnValue(mockRefinePlanMutation);
    (api.ai.undoLastRefinement.useMutation as jest.Mock).mockReturnValue(mockUndoMutation);
  });

  it('renders chat interface with welcome message', () => {
    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    expect(screen.getByText('💬 Refine Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Use natural language to modify your sub-tasks')).toBeInTheDocument();
    expect(screen.getByText('Ready to refine your plan!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe how you\'d like to modify your plan...')).toBeInTheDocument();
  });

  it('displays example commands in welcome state', () => {
    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    expect(screen.getByText(/Add a step about researching sources/)).toBeInTheDocument();
    expect(screen.getByText(/Remove step 3/)).toBeInTheDocument();
    expect(screen.getByText(/Change step 2 to focus on analysis/)).toBeInTheDocument();
    expect(screen.getByText(/Make step 1 more detailed/)).toBeInTheDocument();
  });

  it('displays refinement history when available', () => {
    (api.ai.getRefinementHistory.useQuery as jest.Mock).mockReturnValue({
      ...mockHistoryQuery,
      data: mockMessages,
    });

    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    expect(screen.getByText('Add a step about reviewing sources')).toBeInTheDocument();
    expect(screen.getByText('I\'ve added a new step about reviewing sources after the research phase.')).toBeInTheDocument();
    expect(screen.getByText('Added step 2: Review and validate sources')).toBeInTheDocument();
  });

  it('enables send button when input has content', () => {
    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    const input = screen.getByPlaceholderText('Describe how you\'d like to modify your plan...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(sendButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'Add a new step' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('sends refinement request when form is submitted', async () => {
    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    const input = screen.getByPlaceholderText('Describe how you\'d like to modify your plan...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Add a review step' } });
    fireEvent.click(sendButton);

    expect(mockRefinePlanMutation.mutate).toHaveBeenCalledWith({
      planId: mockPlan.id,
      refinementCommand: 'Add a review step',
    });
  });

  it('handles Enter key to send message', () => {
    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    const input = screen.getByPlaceholderText('Describe how you\'d like to modify your plan...');

    fireEvent.change(input, { target: { value: 'Remove step 2' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockRefinePlanMutation.mutate).toHaveBeenCalledWith({
      planId: mockPlan.id,
      refinementCommand: 'Remove step 2',
    });
  });

  it('does not send on Shift+Enter', () => {
    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    const input = screen.getByPlaceholderText('Describe how you\'d like to modify your plan...');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });

    expect(mockRefinePlanMutation.mutate).not.toHaveBeenCalled();
  });

  it('calls undo mutation when undo button is clicked', () => {
    (api.ai.getRefinementHistory.useQuery as jest.Mock).mockReturnValue({
      ...mockHistoryQuery,
      data: mockMessages,
    });

    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    const undoButton = screen.getByText('Undo');
    fireEvent.click(undoButton);

    expect(mockUndoMutation.mutate).toHaveBeenCalledWith({
      planId: mockPlan.id,
    });
  });

  it('calls proceed to prompt generation when button is clicked', () => {
    render(
      <PlanRefinementChat
        plan={mockPlan}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    const proceedButton = screen.getByText('Generate Prompts');
    fireEvent.click(proceedButton);

    expect(mockOnProceedToPromptGeneration).toHaveBeenCalled();
  });

  it('disables generate prompts button when no sub-tasks', () => {
    const planWithoutSubTasks = { ...mockPlan, sub_tasks: [] };

    render(
      <PlanRefinementChat
        plan={planWithoutSubTasks}
        assignmentId={mockAssignmentId}
        onPlanUpdated={mockOnPlanUpdated}
        onProceedToPromptGeneration={mockOnProceedToPromptGeneration}
      />
    );

    const proceedButton = screen.getByText('Generate Prompts');
    expect(proceedButton).toBeDisabled();
  });
});