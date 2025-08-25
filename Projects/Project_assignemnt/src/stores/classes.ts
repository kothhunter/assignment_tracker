import { create } from 'zustand';
import type { Class } from '@/types';

interface ClassState {
  // State
  classes: Class[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  // Actions
  setClasses: (classes: Class[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addClass: (classData: Class) => void;
  updateClass: (id: number, classData: Partial<Class>) => void;
  removeClass: (id: number) => void;
  clearClasses: () => void;
  refreshData: () => void;
  
  // Computed getters
  getClassById: (id: number) => Class | undefined;
  getClassByName: (name: string) => Class | undefined;
  getClassCount: () => number;
  isClassNameTaken: (name: string, excludeId?: number) => boolean;
}

const initialState = {
  classes: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

export const useClassStore = create<ClassState>()((set, get) => ({
  ...initialState,

  setClasses: (classes) => 
    set({ 
      classes, 
      lastFetch: Date.now(),
      error: null 
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  addClass: (classData) => {
    const classes = [classData, ...get().classes]
      .sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
    set({ classes });
  },

  updateClass: (id, updates) => {
    const classes = get().classes.map(classData =>
      classData.id === id ? { ...classData, ...updates } : classData
    );
    set({ classes });
  },

  removeClass: (id) => {
    const classes = get().classes.filter(classData => classData.id !== id);
    set({ classes });
  },

  clearClasses: () => set({ classes: [], lastFetch: null }),

  refreshData: () => set({ lastFetch: null, error: null }),

  // Computed getters
  getClassById: (id) => 
    get().classes.find(classData => classData.id === id),

  getClassByName: (name) => 
    get().classes.find(classData => classData.name.toLowerCase() === name.toLowerCase()),

  getClassCount: () => get().classes.length,

  isClassNameTaken: (name, excludeId) => {
    const trimmedName = name.trim().toLowerCase();
    return get().classes.some(classData => 
      classData.name.toLowerCase() === trimmedName && classData.id !== excludeId
    );
  },
}));