import { render, screen, fireEvent } from '@testing-library/react';
import { AssignmentFilter } from '../assignment-filter';
import { useAssignmentStore } from '@/stores/assignments';
import type { AssignmentWithClass } from '@/types';

// Mock the assignment store
jest.mock('@/stores/assignments');

const mockUseAssignmentStore = useAssignmentStore as jest.MockedFunction<typeof useAssignmentStore>;

describe('AssignmentFilter', () => {
  const mockSetSelectedClassId = jest.fn();
  const mockGetUniqueClasses = jest.fn();

  const mockAssignments: AssignmentWithClass[] = [
    {
      id: 1,
      user_id: 'user1',
      class_id: 1,
      title: 'Math Assignment 1',
      due_date: '2024-12-31T23:59:59Z',
      status: 'incomplete',
      created_at: '2024-01-01T00:00:00Z',
      class: {
        id: 1,
        user_id: 'user1',
        name: 'MATH 113 - Calculus I',
        created_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 2,
      user_id: 'user1',
      class_id: 2,
      title: 'Physics Assignment 1',
      due_date: '2024-12-25T23:59:59Z',
      status: 'complete',
      created_at: '2024-01-01T00:00:00Z',
      class: {
        id: 2,
        user_id: 'user1',
        name: 'PHYS 101 - Physics I',
        created_at: '2024-01-01T00:00:00Z',
      },
    },
  ];

  const mockClasses = [
    { id: 1, name: 'MATH 113 - Calculus I' },
    { id: 2, name: 'PHYS 101 - Physics I' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUniqueClasses.mockReturnValue(mockClasses);
    
    mockUseAssignmentStore.mockReturnValue({
      selectedClassId: null,
      setSelectedClassId: mockSetSelectedClassId,
      getUniqueClasses: mockGetUniqueClasses,
      assignments: mockAssignments,
      isLoading: false,
      error: null,
      lastFetch: null,
      setAssignments: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      updateAssignmentStatus: jest.fn(),
      addAssignment: jest.fn(),
      removeAssignment: jest.fn(),
      clearAssignments: jest.fn(),
      refreshData: jest.fn(),
      resetFilter: jest.fn(),
      getAssignmentById: jest.fn(),
      getCompletedAssignments: jest.fn(),
      getIncompleteAssignments: jest.fn(),
      getOverdueAssignments: jest.fn(),
      getAssignmentsByClass: jest.fn(),
      getFilteredAssignments: jest.fn(),
    });
  });

  it('renders filter dropdown with "All Classes" option', () => {
    render(<AssignmentFilter />);
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    
    fireEvent.click(trigger);
    
    expect(screen.getByText('All Classes')).toBeInTheDocument();
  });

  it('renders all available classes in dropdown', () => {
    render(<AssignmentFilter />);
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    expect(screen.getByText('MATH 113 - Calculus I')).toBeInTheDocument();
    expect(screen.getByText('PHYS 101 - Physics I')).toBeInTheDocument();
  });

  it('calls setSelectedClassId with null when "All Classes" is selected', () => {
    render(<AssignmentFilter />);
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    const allClassesOption = screen.getByText('All Classes');
    fireEvent.click(allClassesOption);
    
    expect(mockSetSelectedClassId).toHaveBeenCalledWith(null);
  });

  it('calls setSelectedClassId with correct class ID when class is selected', () => {
    render(<AssignmentFilter />);
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    const mathOption = screen.getByText('MATH 113 - Calculus I');
    fireEvent.click(mathOption);
    
    expect(mockSetSelectedClassId).toHaveBeenCalledWith(1);
  });

  it('shows current selection when a class is selected', () => {
    mockUseAssignmentStore.mockReturnValue({
      selectedClassId: 1,
      setSelectedClassId: mockSetSelectedClassId,
      getUniqueClasses: mockGetUniqueClasses,
      assignments: mockAssignments,
      isLoading: false,
      error: null,
      lastFetch: null,
      setAssignments: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      updateAssignmentStatus: jest.fn(),
      addAssignment: jest.fn(),
      removeAssignment: jest.fn(),
      clearAssignments: jest.fn(),
      refreshData: jest.fn(),
      resetFilter: jest.fn(),
      getAssignmentById: jest.fn(),
      getCompletedAssignments: jest.fn(),
      getIncompleteAssignments: jest.fn(),
      getOverdueAssignments: jest.fn(),
      getAssignmentsByClass: jest.fn(),
      getFilteredAssignments: jest.fn(),
    });

    render(<AssignmentFilter />);
    
    expect(screen.getByDisplayValue('MATH 113 - Calculus I')).toBeInTheDocument();
  });

  it('handles empty class list gracefully', () => {
    mockGetUniqueClasses.mockReturnValue([]);
    
    render(<AssignmentFilter />);
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    expect(screen.getByText('All Classes')).toBeInTheDocument();
    expect(screen.queryByText('MATH 113 - Calculus I')).not.toBeInTheDocument();
  });

  it('applies custom className prop', () => {
    const { container } = render(<AssignmentFilter className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});