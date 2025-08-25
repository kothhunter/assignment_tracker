import { render, screen } from '@testing-library/react';
import { AssignmentList } from '../assignment-list';
import type { AssignmentWithClass } from '@/types';

// Mock the AssignmentCard component
jest.mock('../assignment-card', () => ({
  AssignmentCard: ({ assignment }: { assignment: AssignmentWithClass }) => (
    <div data-testid={`assignment-${assignment.id}`}>
      {assignment.title}
    </div>
  ),
}));

const mockAssignments: AssignmentWithClass[] = [
  {
    id: 1,
    user_id: 'user-123',
    class_id: 1,
    title: 'Math Homework Chapter 5',
    due_date: '2024-01-15T09:00:00Z',
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
    due_date: '2024-01-20T09:00:00Z',
    status: 'complete',
    created_at: '2024-01-02T00:00:00Z',
    class: {
      id: 2,
      user_id: 'user-123',
      name: 'PHYS 101 - Physics I',
      created_at: '2024-01-02T00:00:00Z',
    },
  },
];

describe('AssignmentList', () => {
  it('renders list of assignments', () => {
    render(<AssignmentList assignments={mockAssignments} />);
    
    expect(screen.getByTestId('assignment-1')).toBeInTheDocument();
    expect(screen.getByTestId('assignment-2')).toBeInTheDocument();
    expect(screen.getByText('Math Homework Chapter 5')).toBeInTheDocument();
    expect(screen.getByText('Physics Lab Report')).toBeInTheDocument();
  });

  it('shows loading state with skeleton loaders', () => {
    render(<AssignmentList assignments={[]} isLoading={true} />);
    
    // Should show skeleton loaders
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.some(el => el.classList.contains('animate-pulse'))).toBe(true);
    
    // Should not show empty state message
    expect(screen.queryByText('No assignments yet')).not.toBeInTheDocument();
  });

  it('shows empty state when no assignments', () => {
    render(<AssignmentList assignments={[]} />);
    
    expect(screen.getByText('No assignments yet')).toBeInTheDocument();
    expect(screen.getByText(/When you add assignments to your classes/)).toBeInTheDocument();
  });

  it('shows empty state with helpful message', () => {
    render(<AssignmentList assignments={[]} />);
    
    expect(screen.getByText('No assignments yet')).toBeInTheDocument();
    expect(screen.getByText(/they'll appear here in chronological order/)).toBeInTheDocument();
    
    // Should show a document icon (SVG)
    expect(screen.getByText(/they'll appear here in chronological order/)).toBeInTheDocument();
  });

  it('does not show loading or empty state when assignments exist', () => {
    render(<AssignmentList assignments={mockAssignments} />);
    
    expect(screen.queryByText('No assignments yet')).not.toBeInTheDocument();
    expect(screen.queryByText('animate-pulse')).not.toBeInTheDocument();
  });
});