import { renderHook, act } from '@testing-library/react';
import { useAssignmentStore } from '../assignments';
import type { AssignmentWithClass } from '@/types';

const mockAssignments: AssignmentWithClass[] = [
  {
    id: 1,
    user_id: 'user-123',
    class_id: 1,
    title: 'Math Homework Chapter 5',
    due_date: '2030-01-15T09:00:00Z', // Future date to not be overdue
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
    due_date: '2020-01-01T09:00:00Z',
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

describe('useAssignmentStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAssignmentStore());
    act(() => {
      result.current.clearAssignments();
    });
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    expect(result.current.assignments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastFetch).toBe(null);
  });

  it('sets assignments correctly', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    expect(result.current.assignments).toEqual(mockAssignments);
    expect(result.current.lastFetch).toBeTruthy();
    expect(result.current.error).toBe(null);
  });

  it('sets loading state correctly', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error state correctly', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setError('Test error');
    });
    
    expect(result.current.error).toBe('Test error');
    expect(result.current.isLoading).toBe(false);
  });

  it('updates assignment status', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    act(() => {
      result.current.updateAssignmentStatus(1, 'complete');
    });
    
    const updatedAssignment = result.current.assignments.find(a => a.id === 1);
    expect(updatedAssignment?.status).toBe('complete');
  });

  it('adds assignment correctly', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    const newAssignment: AssignmentWithClass = {
      id: 4,
      user_id: 'user-123',
      class_id: 1,
      title: 'New Assignment',
      due_date: '2024-02-01T09:00:00Z',
      status: 'incomplete',
      created_at: '2024-01-04T00:00:00Z',
      class: mockAssignments[0].class,
    };
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    act(() => {
      result.current.addAssignment(newAssignment);
    });
    
    expect(result.current.assignments).toHaveLength(4);
    expect(result.current.assignments.find(a => a.id === 4)).toEqual(newAssignment);
  });

  it('removes assignment correctly', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    act(() => {
      result.current.removeAssignment(1);
    });
    
    expect(result.current.assignments).toHaveLength(2);
    expect(result.current.assignments.find(a => a.id === 1)).toBeUndefined();
  });

  it('gets assignment by id', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    const assignment = result.current.getAssignmentById(1);
    expect(assignment).toEqual(mockAssignments[0]);
    
    const nonExistentAssignment = result.current.getAssignmentById(999);
    expect(nonExistentAssignment).toBeUndefined();
  });

  it('gets completed assignments', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    const completedAssignments = result.current.getCompletedAssignments();
    expect(completedAssignments).toHaveLength(1);
    expect(completedAssignments[0].status).toBe('complete');
  });

  it('gets incomplete assignments', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    const incompleteAssignments = result.current.getIncompleteAssignments();
    expect(incompleteAssignments).toHaveLength(2);
    expect(incompleteAssignments.every(a => a.status === 'incomplete')).toBe(true);
  });

  it('gets overdue assignments', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    const overdueAssignments = result.current.getOverdueAssignments();
    expect(overdueAssignments).toHaveLength(1);
    expect(overdueAssignments[0].id).toBe(3); // The overdue assignment
  });

  it('gets assignments by class', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    const mathAssignments = result.current.getAssignmentsByClass(1);
    expect(mathAssignments).toHaveLength(2);
    expect(mathAssignments.every(a => a.class_id === 1)).toBe(true);
    
    const physicsAssignments = result.current.getAssignmentsByClass(2);
    expect(physicsAssignments).toHaveLength(1);
    expect(physicsAssignments[0].class_id).toBe(2);
  });

  it('clears assignments', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
    });
    
    expect(result.current.assignments).toHaveLength(3);
    
    act(() => {
      result.current.clearAssignments();
    });
    
    expect(result.current.assignments).toEqual([]);
    expect(result.current.lastFetch).toBe(null);
  });

  it('refreshes data', () => {
    const { result } = renderHook(() => useAssignmentStore());
    
    act(() => {
      result.current.setAssignments(mockAssignments);
      result.current.setError('Some error');
    });
    
    expect(result.current.lastFetch).toBeTruthy();
    expect(result.current.error).toBe('Some error');
    
    act(() => {
      result.current.refreshData();
    });
    
    expect(result.current.lastFetch).toBe(null);
    expect(result.current.error).toBe(null);
  });
});