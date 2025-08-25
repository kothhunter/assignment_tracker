import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanGenerationDisplay } from '../plan-generation';
import type { AssignmentPlan, SubTask } from '@/types';

// Mock data
const mockSubTasks: SubTask[] = [
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
  {
    id: 2,
    plan_id: 1,
    step_number: 2,
    title: 'Create outline',
    generated_prompt: 'Develop a detailed outline based on your research findings.',
    description: 'Structure the assignment',
    estimated_hours: 1.5,
    status: 'completed',
    order_index: 1,
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

const mockPlan: AssignmentPlan = {
  id: 1,
  assignment_id: 1,
  original_instructions: 'Write a research paper on renewable energy sources.',
  sub_tasks: mockSubTasks,
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('PlanGenerationDisplay', () => {
  const mockOnRetryGeneration = jest.fn();
  const mockOnProceedToRefinement = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when isGenerating is true', () => {
    render(
      <PlanGenerationDisplay
        plan={null}
        isGenerating={true}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    expect(screen.getByText('Generating Your Plan')).toBeInTheDocument();
    expect(screen.getByText('AI is analyzing your assignment instructions and creating a detailed sub-task breakdown...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing assignment requirements')).toBeInTheDocument();
  });

  it('renders empty state when no plan is provided', () => {
    render(
      <PlanGenerationDisplay
        plan={null}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    expect(screen.getByText('No Plan Generated Yet')).toBeInTheDocument();
    expect(screen.getByText('Generate Plan Now')).toBeInTheDocument();
  });

  it('calls onRetryGeneration when retry button is clicked', () => {
    render(
      <PlanGenerationDisplay
        plan={null}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    fireEvent.click(screen.getByText('Generate Plan Now'));
    expect(mockOnRetryGeneration).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when plan has no sub-tasks', () => {
    const emptyPlan = { ...mockPlan, sub_tasks: [] };
    render(
      <PlanGenerationDisplay
        plan={emptyPlan}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    expect(screen.getByText('No Plan Generated Yet')).toBeInTheDocument();
  });

  it('renders generated plan with sub-tasks', () => {
    render(
      <PlanGenerationDisplay
        plan={mockPlan}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    expect(screen.getByText('Generated Plan Overview')).toBeInTheDocument();
    expect(screen.getByText('AI has broken down your assignment into 2 manageable sub-tasks')).toBeInTheDocument();
    expect(screen.getByText('Research and gather sources')).toBeInTheDocument();
    expect(screen.getByText('Create outline')).toBeInTheDocument();
  });

  it('displays correct completion percentage', () => {
    render(
      <PlanGenerationDisplay
        plan={mockPlan}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    // 1 completed out of 2 tasks = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '1 completed';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '1 pending';
    })).toBeInTheDocument();
  });

  it('displays sub-task details correctly', () => {
    render(
      <PlanGenerationDisplay
        plan={mockPlan}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    // Check first sub-task
    expect(screen.getByText('Research and gather sources')).toBeInTheDocument();
    expect(screen.getByText('Initial research phase')).toBeInTheDocument();
    expect(screen.getByText('Estimated: 2.5 hours')).toBeInTheDocument();

    // Check second sub-task
    expect(screen.getByText('Create outline')).toBeInTheDocument();
    expect(screen.getByText('Structure the assignment')).toBeInTheDocument();
    expect(screen.getByText('Estimated: 1.5 hours')).toBeInTheDocument();
  });

  it('displays correct status badges for sub-tasks', () => {
    render(
      <PlanGenerationDisplay
        plan={mockPlan}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    expect(screen.getAllByText('pending')).toHaveLength(2); // One in overview, one in badge
    expect(screen.getAllByText('completed')).toHaveLength(2); // One in overview, one in badge
  });

  it('calls onProceedToRefinement when refine plan button is clicked', () => {
    render(
      <PlanGenerationDisplay
        plan={mockPlan}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    fireEvent.click(screen.getByText('Refine Plan'));
    expect(mockOnProceedToRefinement).toHaveBeenCalledTimes(1);
  });

  it('orders sub-tasks by order_index', () => {
    const unorderedPlan = {
      ...mockPlan,
      sub_tasks: [
        { ...mockSubTasks[1], order_index: 0 }, // Create outline first
        { ...mockSubTasks[0], order_index: 1 }, // Research second
      ],
    };

    render(
      <PlanGenerationDisplay
        plan={unorderedPlan}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    const subTaskCards = screen.getAllByRole('article');
    expect(subTaskCards[0]).toHaveTextContent('Create outline');
    expect(subTaskCards[1]).toHaveTextContent('Research and gather sources');
  });

  it('handles sub-tasks without description gracefully', () => {
    const planWithoutDescription = {
      ...mockPlan,
      sub_tasks: [
        {
          ...mockSubTasks[0],
          description: undefined,
        },
      ],
    };

    render(
      <PlanGenerationDisplay
        plan={planWithoutDescription}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    expect(screen.getByText('Research and gather sources')).toBeInTheDocument();
    // Should not show description section
    expect(screen.queryByText('Initial research phase')).not.toBeInTheDocument();
  });

  it('handles sub-tasks without estimated hours gracefully', () => {
    const planWithoutHours = {
      ...mockPlan,
      sub_tasks: [
        {
          ...mockSubTasks[0],
          estimated_hours: undefined,
        },
      ],
    };

    render(
      <PlanGenerationDisplay
        plan={planWithoutHours}
        isGenerating={false}
        onRetryGeneration={mockOnRetryGeneration}
        onProceedToRefinement={mockOnProceedToRefinement}
      />
    );

    expect(screen.getByText('Research and gather sources')).toBeInTheDocument();
    // Should not show estimated hours
    expect(screen.queryByText(/Estimated:/)).not.toBeInTheDocument();
  });
});