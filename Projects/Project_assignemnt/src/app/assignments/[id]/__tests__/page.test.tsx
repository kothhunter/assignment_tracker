import { render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import AssignmentDetailPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/lib/trpc', () => ({
  api: {
    assignment: {
      getById: {
        useQuery: jest.fn(),
      },
    },
  },
}));

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
const mockApi = require('@/lib/trpc').api;

describe('AssignmentDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
  });

  it('renders loading state initially', () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<AssignmentDetailPage />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders assignment details when data is loaded', async () => {
    const mockAssignment = {
      id: 1,
      title: 'Math Homework',
      due_date: '2024-12-25T23:59:00Z',
      status: 'incomplete',
      class: {
        id: 1,
        name: 'MATH 101 - Algebra',
        user_id: 'user1',
        created_at: '2024-01-01T00:00:00Z',
      },
      user_id: 'user1',
      class_id: 1,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);

    render(<AssignmentDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Math Homework')).toBeInTheDocument();
      expect(screen.getByText('MATH 101 - Algebra')).toBeInTheDocument();
      expect(screen.getByText(/Dec 25, 2024/)).toBeInTheDocument();
      expect(screen.getByText('Incomplete')).toBeInTheDocument();
    });
  });

  it('renders error state when assignment not found', async () => {
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Assignment not found'),
    } as any);

    render(<AssignmentDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Assignment Not Found')).toBeInTheDocument();
      expect(screen.getByText(/doesn't exist or you don't have permission/)).toBeInTheDocument();
    });
  });

  it('shows overdue badge for overdue assignments', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const mockAssignment = {
      id: 1,
      title: 'Overdue Assignment',
      due_date: yesterday.toISOString(),
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

    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);

    render(<AssignmentDetailPage />);
    
    await waitFor(() => {
      const badge = screen.getByText('Overdue');
      expect(badge).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when back button is clicked', async () => {
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

    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: mockAssignment,
      isLoading: false,
      error: null,
    } as any);

    render(<AssignmentDetailPage />);
    
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /back to dashboard/i });
      backButton.click();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles invalid assignment ID', () => {
    (useParams as jest.Mock).mockReturnValue({ id: 'invalid' });
    
    mockApi.assignment.getById.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Invalid ID'),
    } as any);

    render(<AssignmentDetailPage />);
    
    expect(screen.getByText('Assignment Not Found')).toBeInTheDocument();
  });
});