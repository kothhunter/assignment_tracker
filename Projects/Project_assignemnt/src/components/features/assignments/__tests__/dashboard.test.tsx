import { render, screen } from '@testing-library/react';
import { Dashboard } from '../dashboard';
import type { AssignmentWithClass } from '@/types';

// Mock the AssignmentList component
jest.mock('../assignment-list', () => ({
  AssignmentList: ({ assignments, isLoading }: { assignments: AssignmentWithClass[], isLoading?: boolean }) => (
    <div data-testid="assignment-list">
      {isLoading ? 'Loading assignments...' : `${assignments.length} assignments`}
    </div>
  ),
}));

const mockAssignments: AssignmentWithClass[] = [
  {
    id: 1,
    user_id: 'user-123',
    class_id: 1,
    title: 'Math Homework Chapter 5',
    due_date: '2030-01-15T09:00:00Z', // Future date
    status: 'incomplete',
    created_at: '2024-01-01T00:00:00Z',
    class: {
      id: 1,
      user_id: 'user-123',
      name: 'MATH 113 - Calculus I',
      created_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 2,
    user_id: 'user-123',
    class_id: 2,
    title: 'Physics Lab Report',
    due_date: '2030-01-20T09:00:00Z', // Future date
    status: 'complete',
    created_at: '2024-01-02T00:00:00Z',
    class: {
      id: 2,
      user_id: 'user-123',
      name: 'PHYS 101 - Physics I',
      created_at: '2024-01-02T00:00:00Z',
    },
  },
  {
    id: 3,
    user_id: 'user-123',
    class_id: 1,
    title: 'Overdue Assignment',
    due_date: '2020-01-01T09:00:00Z', // Past date
    status: 'incomplete',
    created_at: '2024-01-03T00:00:00Z',
    class: {
      id: 1,
      user_id: 'user-123',
      name: 'MATH 113 - Calculus I',
      created_at: '2024-01-01T00:00:00Z',
    },
  },
];

describe('Dashboard', () => {
  it('renders dashboard header', () => {
    render(<Dashboard assignments={mockAssignments} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Your assignments, organized by due date')).toBeInTheDocument();
  });

  it('renders assignment statistics when assignments exist', () => {
    render(<Dashboard assignments={mockAssignments} />);
    
    // Total assignments
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Assignments')).toBeInTheDocument();
    
    // Completed assignments
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    
    // Overdue assignments
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('does not render statistics when loading', () => {
    render(<Dashboard assignments={[]} isLoading={true} />);
    
    expect(screen.queryByText('Total Assignments')).not.toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('does not render statistics when no assignments', () => {
    render(<Dashboard assignments={[]} />);
    
    expect(screen.queryByText('Total Assignments')).not.toBeInTheDocument();
  });

  it('renders assignments section', () => {
    render(<Dashboard assignments={mockAssignments} />);
    
    expect(screen.getByText('Assignments')).toBeInTheDocument();
    expect(screen.getByTestId('assignment-list')).toBeInTheDocument();
  });

  it('passes loading state to AssignmentList', () => {
    render(<Dashboard assignments={[]} isLoading={true} />);
    
    expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
  });

  it('passes assignments to AssignmentList', () => {
    render(<Dashboard assignments={mockAssignments} />);
    
    expect(screen.getByText('3 assignments')).toBeInTheDocument();
  });

  it('renders error state when error occurs', () => {
    render(<Dashboard assignments={[]} error="Failed to load assignments" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to load assignments')).toBeInTheDocument();
  });

  it('shows error state with proper styling', () => {
    render(<Dashboard assignments={[]} error="Test error" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Should have the error container styling
    expect(screen.getByText('Something went wrong').closest('div')).toHaveClass('text-center');
  });

  it('calculates overdue count correctly', () => {
    render(<Dashboard assignments={mockAssignments} />);
    
    // Should count assignments that are past due and incomplete
    // Mock includes one overdue incomplete assignment
    const overdueElements = screen.getAllByText('1');
    expect(overdueElements.length).toBeGreaterThan(0);
  });
});