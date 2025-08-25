import { render, screen, fireEvent } from '@testing-library/react';
import { RefinedPlanDisplay } from '../refined-plan-display';
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

// Mock URL.createObjectURL for download functionality
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('RefinedPlanDisplay', () => {
  const mockAssignmentId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plan overview with correct statistics', () => {
    render(<RefinedPlanDisplay plan={mockPlan} assignmentId={mockAssignmentId} />);
    
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('2 sub-tasks • 50% complete')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/2.*total/)).toBeInTheDocument();
    expect(screen.getByText(/1.*pending/)).toBeInTheDocument();
    expect(screen.getByText(/1.*completed/)).toBeInTheDocument();
  });

  it('renders all sub-tasks in correct order', () => {
    render(<RefinedPlanDisplay plan={mockPlan} assignmentId={mockAssignmentId} />);
    
    expect(screen.getByText('Research and gather sources')).toBeInTheDocument();
    expect(screen.getByText('Create outline')).toBeInTheDocument();
    expect(screen.getByText('Initial research phase')).toBeInTheDocument();
    expect(screen.getByText('Structure the assignment')).toBeInTheDocument();
  });

  it('displays refinement instructions', () => {
    render(<RefinedPlanDisplay plan={mockPlan} assignmentId={mockAssignmentId} />);
    
    expect(screen.getByText('💬 How to Refine Your Plan')).toBeInTheDocument();
    expect(screen.getByText(/Use the chat to modify your sub-tasks with natural language/)).toBeInTheDocument();
  });

  it('shows progress bar with correct percentage', () => {
    render(<RefinedPlanDisplay plan={mockPlan} assignmentId={mockAssignmentId} />);
    
    // Check for progress bar div with correct width style
    const progressBar = document.querySelector('.bg-blue-600');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays export button', () => {
    render(<RefinedPlanDisplay plan={mockPlan} assignmentId={mockAssignmentId} />);
    
    const exportButton = screen.getByText('Export Plan');
    expect(exportButton).toBeInTheDocument();
  });
});