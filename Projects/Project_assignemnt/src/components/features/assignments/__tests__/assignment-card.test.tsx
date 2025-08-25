import { render, screen } from '@testing-library/react';
import { AssignmentCard } from '../assignment-card';
import type { AssignmentWithClass } from '@/types';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }),
  isAfter: jest.fn((date1: Date, date2: Date) => date1.getTime() > date2.getTime()),
  startOfDay: jest.fn((date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }),
}));

const mockAssignment: AssignmentWithClass = {
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
};

describe('AssignmentCard', () => {
  it('renders assignment details correctly', () => {
    render(<AssignmentCard assignment={mockAssignment} />);
    
    expect(screen.getByText('Math Homework Chapter 5')).toBeInTheDocument();
    expect(screen.getByText('MATH 113 - Calculus I')).toBeInTheDocument();
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });

  it('shows incomplete status with circle icon', () => {
    render(<AssignmentCard assignment={mockAssignment} />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
    // The circle icon should be present for incomplete assignments
    const circleIcon = screen.getByRole('img', { hidden: true });
    expect(circleIcon).toBeInTheDocument();
  });

  it('shows complete status with check icon', () => {
    const completedAssignment = {
      ...mockAssignment,
      status: 'complete' as const,
    };
    
    render(<AssignmentCard assignment={completedAssignment} />);
    
    expect(screen.getByText('Complete')).toBeInTheDocument();
    // Title should have line-through styling for completed assignments
    const title = screen.getByText('Math Homework Chapter 5');
    expect(title).toHaveClass('line-through');
  });

  it('shows overdue status for past due incomplete assignments', () => {
    // Mock a past date
    const overdueAssignment = {
      ...mockAssignment,
      due_date: '2020-01-01T09:00:00Z', // Past date
    };
    
    render(<AssignmentCard assignment={overdueAssignment} />);
    
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('applies correct styling for overdue assignments', () => {
    const overdueAssignment = {
      ...mockAssignment,
      due_date: '2020-01-01T09:00:00Z', // Past date
    };
    
    render(<AssignmentCard assignment={overdueAssignment} />);
    
    // Should have overdue badge
    const overdueBadge = screen.getByText('Overdue');
    expect(overdueBadge).toBeInTheDocument();
    
    // Should have overdue text in the due date
    const overdueInDate = screen.getByText(/\(Overdue\)/);
    expect(overdueInDate).toBeInTheDocument();
  });

  it('does not show overdue for completed assignments in the past', () => {
    const completedPastAssignment = {
      ...mockAssignment,
      due_date: '2020-01-01T09:00:00Z', // Past date
      status: 'complete' as const,
    };
    
    render(<AssignmentCard assignment={completedPastAssignment} />);
    
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });
});