import { create } from 'zustand';
import type { AssignmentWithClass } from '@/types';

interface AssignmentState {
  // State
  assignments: AssignmentWithClass[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  selectedClassId: number | null; // null means "All Classes"

  // Actions
  setAssignments: (assignments: AssignmentWithClass[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateAssignmentStatus: (id: number, status: 'complete' | 'incomplete') => void;
  addAssignment: (assignment: AssignmentWithClass) => void;
  removeAssignment: (id: number) => void;
  clearAssignments: () => void;
  refreshData: () => void;
  setSelectedClassId: (classId: number | null) => void;
  resetFilter: () => void;
  
  // Computed getters
  getAssignmentById: (id: number) => AssignmentWithClass | undefined;
  getCompletedAssignments: () => AssignmentWithClass[];
  getIncompleteAssignments: () => AssignmentWithClass[];
  getOverdueAssignments: () => AssignmentWithClass[];
  getAssignmentsByClass: (classId: number) => AssignmentWithClass[];
  getFilteredAssignments: () => AssignmentWithClass[];
  getUniqueClasses: () => { id: number; name: string }[];
}

const initialState = {
  assignments: [],
  isLoading: false,
  error: null,
  lastFetch: null,
  selectedClassId: null,
};

export const useAssignmentStore = create<AssignmentState>()((set, get) => ({
  ...initialState,

  setAssignments: (assignments) => 
    set({ 
      assignments, 
      lastFetch: Date.now(),
      error: null 
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  updateAssignmentStatus: (id, status) => {
    const assignments = get().assignments.map(assignment =>
      assignment.id === id ? { ...assignment, status } : assignment
    );
    set({ assignments });
  },

  addAssignment: (assignment) => {
    const assignments = [...get().assignments, assignment]
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    set({ assignments });
  },

  removeAssignment: (id) => {
    const assignments = get().assignments.filter(assignment => assignment.id !== id);
    set({ assignments });
  },

  clearAssignments: () => set({ assignments: [], lastFetch: null }),

  refreshData: () => set({ lastFetch: null, error: null }),

  // Computed getters
  getAssignmentById: (id) => 
    get().assignments.find(assignment => assignment.id === id),

  getCompletedAssignments: () => 
    get().assignments.filter(assignment => assignment.status === 'complete'),

  getIncompleteAssignments: () => 
    get().assignments.filter(assignment => assignment.status === 'incomplete'),

  getOverdueAssignments: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return get().assignments.filter(assignment => {
      const dueDate = new Date(assignment.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && assignment.status === 'incomplete';
    });
  },

  getAssignmentsByClass: (classId) => 
    get().assignments.filter(assignment => assignment.class_id === classId),

  setSelectedClassId: (classId) => set({ selectedClassId: classId }),

  resetFilter: () => set({ selectedClassId: null }),

  getFilteredAssignments: () => {
    const { assignments, selectedClassId } = get();
    if (selectedClassId === null) {
      return assignments;
    }
    return assignments.filter(assignment => assignment.class_id === selectedClassId);
  },

  getUniqueClasses: () => {
    const assignments = get().assignments;
    const classMap = new Map<number, string>();
    
    assignments.forEach(assignment => {
      if (!classMap.has(assignment.class_id)) {
        classMap.set(assignment.class_id, assignment.class.name);
      }
    });

    return Array.from(classMap.entries()).map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
}));