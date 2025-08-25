import { renderHook, act } from '@testing-library/react';
import { useClassStore } from '../classes';
import type { Class } from '@/types';

const mockClasses: Class[] = [
  {
    id: 1,
    user_id: 'user-123',
    name: 'MATH 113 - Calculus I',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 'user-123',
    name: 'PHYS 101 - Physics I',
    created_at: '2024-01-02T00:00:00Z',
  },
];

describe('useClassStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useClassStore());
    act(() => {
      result.current.clearClasses();
    });
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useClassStore());
    
    expect(result.current.classes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastFetch).toBe(null);
  });

  it('sets classes correctly', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setClasses(mockClasses);
    });
    
    expect(result.current.classes).toEqual(mockClasses);
    expect(result.current.error).toBe(null);
    expect(result.current.lastFetch).toBeTruthy();
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error state', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setError('Test error');
    });
    
    expect(result.current.error).toBe('Test error');
    expect(result.current.isLoading).toBe(false);
  });

  it('adds a class correctly', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setClasses([mockClasses[0]]);
    });
    
    const newClass: Class = {
      id: 3,
      user_id: 'user-123',
      name: 'CHEM 101 - Chemistry I',
      created_at: '2024-01-03T00:00:00Z',
    };
    
    act(() => {
      result.current.addClass(newClass);
    });
    
    expect(result.current.classes).toHaveLength(2);
    expect(result.current.classes[0]).toEqual(newClass); // Newest first
    expect(result.current.classes[1]).toEqual(mockClasses[0]);
  });

  it('updates a class correctly', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setClasses(mockClasses);
    });
    
    act(() => {
      result.current.updateClass(1, { name: 'MATH 114 - Calculus II' });
    });
    
    expect(result.current.classes[0].name).toBe('MATH 114 - Calculus II');
    expect(result.current.classes[0].id).toBe(1);
  });

  it('removes a class correctly', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setClasses(mockClasses);
    });
    
    act(() => {
      result.current.removeClass(1);
    });
    
    expect(result.current.classes).toHaveLength(1);
    expect(result.current.classes[0].id).toBe(2);
  });

  it('clears classes correctly', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setClasses(mockClasses);
    });
    
    expect(result.current.classes).toHaveLength(2);
    
    act(() => {
      result.current.clearClasses();
    });
    
    expect(result.current.classes).toEqual([]);
    expect(result.current.lastFetch).toBe(null);
  });

  it('refreshes data correctly', () => {
    const { result } = renderHook(() => useClassStore());
    
    act(() => {
      result.current.setClasses(mockClasses);
      result.current.setError('Test error');
    });
    
    act(() => {
      result.current.refreshData();
    });
    
    expect(result.current.lastFetch).toBe(null);
    expect(result.current.error).toBe(null);
  });

  describe('computed getters', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useClassStore());
      act(() => {
        result.current.setClasses(mockClasses);
      });
    });

    it('getClassById returns correct class', () => {
      const { result } = renderHook(() => useClassStore());
      
      const foundClass = result.current.getClassById(1);
      expect(foundClass).toEqual(mockClasses[0]);
      
      const notFound = result.current.getClassById(999);
      expect(notFound).toBeUndefined();
    });

    it('getClassByName returns correct class', () => {
      const { result } = renderHook(() => useClassStore());
      
      const foundClass = result.current.getClassByName('MATH 113 - Calculus I');
      expect(foundClass).toEqual(mockClasses[0]);
      
      // Case insensitive
      const foundClassCaseInsensitive = result.current.getClassByName('math 113 - calculus i');
      expect(foundClassCaseInsensitive).toEqual(mockClasses[0]);
      
      const notFound = result.current.getClassByName('Nonexistent Class');
      expect(notFound).toBeUndefined();
    });

    it('getClassCount returns correct count', () => {
      const { result } = renderHook(() => useClassStore());
      
      expect(result.current.getClassCount()).toBe(2);
    });

    it('isClassNameTaken works correctly', () => {
      const { result } = renderHook(() => useClassStore());
      
      // Existing name should be taken
      expect(result.current.isClassNameTaken('MATH 113 - Calculus I')).toBe(true);
      
      // Case insensitive
      expect(result.current.isClassNameTaken('math 113 - calculus i')).toBe(true);
      
      // With whitespace
      expect(result.current.isClassNameTaken('  MATH 113 - Calculus I  ')).toBe(true);
      
      // Non-existing name should not be taken
      expect(result.current.isClassNameTaken('New Class')).toBe(false);
      
      // Excluding current class ID
      expect(result.current.isClassNameTaken('MATH 113 - Calculus I', 1)).toBe(false);
      expect(result.current.isClassNameTaken('MATH 113 - Calculus I', 2)).toBe(true);
    });
  });

  it('sorts classes by created_at descending when adding', () => {
    const { result } = renderHook(() => useClassStore());
    
    const olderClass: Class = {
      id: 1,
      user_id: 'user-123',
      name: 'Old Class',
      created_at: '2024-01-01T00:00:00Z',
    };
    
    const newerClass: Class = {
      id: 2,
      user_id: 'user-123',
      name: 'New Class',
      created_at: '2024-01-02T00:00:00Z',
    };
    
    act(() => {
      result.current.setClasses([olderClass]);
    });
    
    act(() => {
      result.current.addClass(newerClass);
    });
    
    expect(result.current.classes[0]).toEqual(newerClass);
    expect(result.current.classes[1]).toEqual(olderClass);
  });
});