import { useAssignmentStore } from '../assignments';
import type { AssignmentWithClass } from '@/types';

describe('Assignment Store - Filter Functionality', () => {
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
    {
      id: 3,
      user_id: 'user1',
      class_id: 1,
      title: 'Math Assignment 2',
      due_date: '2024-12-20T23:59:59Z',
      status: 'incomplete',
      created_at: '2024-01-01T00:00:00Z',
      class: {
        id: 1,
        user_id: 'user1',
        name: 'MATH 113 - Calculus I',
        created_at: '2024-01-01T00:00:00Z',
      },
    },
  ];

  beforeEach(() => {
    useAssignmentStore.setState({
      assignments: [],
      selectedClassId: null,
      isLoading: false,
      error: null,
      lastFetch: null,
    });
  });

  it('initializes with no filter selected', () => {
    const state = useAssignmentStore.getState();
    expect(state.selectedClassId).toBeNull();
  });

  it('sets selected class ID correctly', () => {
    const { setSelectedClassId } = useAssignmentStore.getState();
    
    setSelectedClassId(1);
    
    expect(useAssignmentStore.getState().selectedClassId).toBe(1);
  });

  it('resets filter correctly', () => {
    const { setSelectedClassId, resetFilter } = useAssignmentStore.getState();
    
    setSelectedClassId(1);
    expect(useAssignmentStore.getState().selectedClassId).toBe(1);
    
    resetFilter();
    expect(useAssignmentStore.getState().selectedClassId).toBeNull();
  });

  it('returns all assignments when no filter is applied', () => {
    const { setAssignments, getFilteredAssignments } = useAssignmentStore.getState();
    
    setAssignments(mockAssignments);
    const filtered = getFilteredAssignments();
    
    expect(filtered).toHaveLength(3);
    expect(filtered).toEqual(mockAssignments);
  });

  it('filters assignments by selected class ID', () => {
    const { setAssignments, setSelectedClassId, getFilteredAssignments } = useAssignmentStore.getState();
    
    setAssignments(mockAssignments);
    setSelectedClassId(1);
    
    const filtered = getFilteredAssignments();
    
    expect(filtered).toHaveLength(2);
    expect(filtered.every(a => a.class_id === 1)).toBe(true);
    expect(filtered.map(a => a.title)).toEqual(['Math Assignment 1', 'Math Assignment 2']);
  });

  it('returns empty array when no assignments match filter', () => {
    const { setAssignments, setSelectedClassId, getFilteredAssignments } = useAssignmentStore.getState();
    
    setAssignments(mockAssignments);
    setSelectedClassId(999); // Non-existent class ID
    
    const filtered = getFilteredAssignments();
    
    expect(filtered).toHaveLength(0);
  });

  it('extracts unique classes correctly', () => {
    const { setAssignments, getUniqueClasses } = useAssignmentStore.getState();
    
    setAssignments(mockAssignments);
    const classes = getUniqueClasses();
    
    expect(classes).toHaveLength(2);
    expect(classes).toEqual([
      { id: 1, name: 'MATH 113 - Calculus I' },
      { id: 2, name: 'PHYS 101 - Physics I' },
    ]);
  });

  it('sorts unique classes alphabetically by name', () => {
    const alphabeticalMockAssignments: AssignmentWithClass[] = [
      {
        ...mockAssignments[0],
        class: { ...mockAssignments[0].class, name: 'ZOOL 101 - Zoology' },
      },
      {
        ...mockAssignments[1],
        class: { ...mockAssignments[1].class, name: 'ARTS 100 - Art History' },
      },
    ];
    
    const { setAssignments, getUniqueClasses } = useAssignmentStore.getState();
    
    setAssignments(alphabeticalMockAssignments);
    const classes = getUniqueClasses();
    
    expect(classes).toEqual([
      { id: 2, name: 'ARTS 100 - Art History' },
      { id: 1, name: 'ZOOL 101 - Zoology' },
    ]);
  });

  it('handles empty assignments array in getUniqueClasses', () => {
    const { setAssignments, getUniqueClasses } = useAssignmentStore.getState();
    
    setAssignments([]);
    const classes = getUniqueClasses();
    
    expect(classes).toHaveLength(0);
  });

  it('handles duplicate class IDs correctly in getUniqueClasses', () => {
    const { setAssignments, getUniqueClasses } = useAssignmentStore.getState();
    
    setAssignments(mockAssignments); // Contains multiple assignments with class_id: 1
    const classes = getUniqueClasses();
    
    expect(classes).toHaveLength(2);
    expect(classes.filter(c => c.id === 1)).toHaveLength(1);
  });
});