import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { assignmentRouter } from '../assignment';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(),
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabase),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// Mock context
const mockContext = {
  session: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  },
};

describe('Assignment Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all assignments for authenticated user', async () => {
      const mockAssignments = [
        {
          id: 1,
          user_id: 'test-user-id',
          class_id: 1,
          title: 'Math Homework',
          due_date: '2024-12-25T23:59:00Z',
          status: 'incomplete',
          created_at: '2024-01-01T00:00:00Z',
          class: {
            id: 1,
            user_id: 'test-user-id',
            name: 'Math 101',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      ];

      mockSupabase.single.mockResolvedValue({
        data: mockAssignments,
        error: null,
      });

      const result = await assignmentRouter
        .createCaller(mockContext)
        .getAll();

      expect(result).toEqual(mockAssignments);
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockSupabase.order).toHaveBeenCalledWith('due_date', { ascending: true });
    });

    it('should handle database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        assignmentRouter.createCaller(mockContext).getAll()
      ).rejects.toThrow('Failed to fetch assignments');
    });
  });

  describe('createManual', () => {
    const validInput = {
      title: 'New Assignment',
      class_id: 1,
      due_date: '2024-12-25T23:59:00Z',
    };

    it('should create assignment after validating class ownership', async () => {
      const mockClass = { id: 1 };
      const mockAssignment = {
        id: 1,
        user_id: 'test-user-id',
        class_id: 1,
        title: 'New Assignment',
        due_date: '2024-12-25T23:59:00Z',
        status: 'incomplete',
        created_at: '2024-01-01T00:00:00Z',
        class: {
          id: 1,
          user_id: 'test-user-id',
          name: 'Math 101',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      // Mock class validation
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockClass,
          error: null,
        })
        // Mock assignment creation
        .mockResolvedValueOnce({
          data: mockAssignment,
          error: null,
        });

      const result = await assignmentRouter
        .createCaller(mockContext)
        .createManual(validInput);

      expect(result).toEqual(mockAssignment);
      
      // Verify class ownership check
      expect(mockSupabase.from).toHaveBeenCalledWith('classes');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      
      // Verify assignment creation
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        class_id: 1,
        title: 'New Assignment',
        due_date: '2024-12-25T23:59:00Z',
        status: 'incomplete',
      });
    });

    it('should reject if class does not belong to user', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        assignmentRouter.createCaller(mockContext).createManual(validInput)
      ).rejects.toThrow('Class not found or does not belong to user');
    });

    it('should validate input schema', async () => {
      const invalidInput = {
        title: '', // Empty title
        class_id: 1,
        due_date: 'invalid-date',
      };

      await expect(
        assignmentRouter.createCaller(mockContext).createManual(invalidInput as any)
      ).rejects.toThrow();
    });

    it('should handle assignment creation errors', async () => {
      const mockClass = { id: 1 };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockClass,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Creation failed' },
        });

      await expect(
        assignmentRouter.createCaller(mockContext).createManual(validInput)
      ).rejects.toThrow('Failed to create assignment');
    });
  });

  describe('updateStatus', () => {
    const validInput = {
      id: 1,
      status: 'complete' as const,
    };

    it('should update assignment status for user-owned assignment', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await assignmentRouter
        .createCaller(mockContext)
        .updateStatus(validInput);

      expect(result).toEqual({ message: 'Assignment status updated successfully' });
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'complete' });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should handle update errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        assignmentRouter.createCaller(mockContext).updateStatus(validInput)
      ).rejects.toThrow('Failed to update assignment status');
    });
  });

  describe('delete', () => {
    const validInput = { id: 1 };

    it('should delete user-owned assignment', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await assignmentRouter
        .createCaller(mockContext)
        .delete(validInput);

      expect(result).toEqual({ message: 'Assignment deleted successfully' });
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should handle deletion errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Deletion failed' },
      });

      await expect(
        assignmentRouter.createCaller(mockContext).delete(validInput)
      ).rejects.toThrow('Failed to delete assignment');
    });
  });

  describe('createBatch', () => {
    const validInput = {
      assignments: [
        {
          title: 'Math Homework 1',
          due_date: '2024-12-25T23:59:00Z',
          description: 'Chapter 1 exercises',
          type: 'homework',
          points: 100,
          class_id: 1,
        },
        {
          title: 'Science Project',
          due_date: '2024-12-30T23:59:00Z',
          description: 'Solar system model',
          type: 'project',
          points: 200,
          class_id: 2,
        },
      ],
    };

    it('should create multiple assignments successfully', async () => {
      const mockClass1 = { id: 1 };
      const mockClass2 = { id: 2 };
      const mockCreatedAssignments = [
        {
          id: 1,
          user_id: 'test-user-id',
          class_id: 1,
          title: 'Math Homework 1',
          due_date: '2024-12-25T23:59:00Z',
          status: 'incomplete',
          created_at: '2024-01-01T00:00:00Z',
          class: {
            id: 1,
            user_id: 'test-user-id',
            name: 'Math 101',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          id: 2,
          user_id: 'test-user-id',
          class_id: 2,
          title: 'Science Project',
          due_date: '2024-12-30T23:59:00Z',
          status: 'incomplete',
          created_at: '2024-01-01T00:00:00Z',
          class: {
            id: 2,
            user_id: 'test-user-id',
            name: 'Science 101',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      ];

      // Mock class ownership validation for both classes
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockClass1, error: null })
        .mockResolvedValueOnce({ data: mockClass2, error: null })
        // Mock duplicate checks (no duplicates found)
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        // Mock batch insert
        .mockResolvedValueOnce({ data: mockCreatedAssignments, error: null });

      const result = await assignmentRouter
        .createCaller(mockContext)
        .createBatch(validInput);

      expect(result.assignments).toEqual(mockCreatedAssignments);
      expect(result.count).toBe(2);
      expect(result.message).toBe('Successfully saved 2 assignments');
      
      // Verify class ownership checks were called for both classes
      expect(mockSupabase.from).toHaveBeenCalledWith('classes');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 2);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      
      // Verify duplicate checks
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.eq).toHaveBeenCalledWith('title', 'Math Homework 1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('title', 'Science Project');
      
      // Verify batch insert
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          user_id: 'test-user-id',
          class_id: 1,
          title: 'Math Homework 1',
          due_date: '2024-12-25T23:59:00Z',
          status: 'incomplete',
          description: 'Chapter 1 exercises',
          type: 'homework',
          points: 100,
        },
        {
          user_id: 'test-user-id',
          class_id: 2,
          title: 'Science Project',
          due_date: '2024-12-30T23:59:00Z',
          status: 'incomplete',
          description: 'Solar system model',
          type: 'project',
          points: 200,
        },
      ]);
    });

    it('should handle assignments with only required fields', async () => {
      const minimalInput = {
        assignments: [
          {
            title: 'Simple Assignment',
            due_date: '2024-12-25T23:59:00Z',
            class_id: 1,
          },
        ],
      };

      const mockClass = { id: 1 };
      const mockCreatedAssignment = [{
        id: 1,
        user_id: 'test-user-id',
        class_id: 1,
        title: 'Simple Assignment',
        due_date: '2024-12-25T23:59:00Z',
        status: 'incomplete',
        created_at: '2024-01-01T00:00:00Z',
        class: {
          id: 1,
          user_id: 'test-user-id',
          name: 'Math 101',
          created_at: '2024-01-01T00:00:00Z',
        },
      }];

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: mockCreatedAssignment, error: null });

      const result = await assignmentRouter
        .createCaller(mockContext)
        .createBatch(minimalInput);

      expect(result.count).toBe(1);
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          user_id: 'test-user-id',
          class_id: 1,
          title: 'Simple Assignment',
          due_date: '2024-12-25T23:59:00Z',
          status: 'incomplete',
        },
      ]);
    });

    it('should reject if class does not belong to user', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(validInput)
      ).rejects.toThrow('Class not found or does not belong to user');
    });

    it('should reject duplicate assignments', async () => {
      const mockClass = { id: 1 };
      const duplicateAssignment = {
        id: 5,
        title: 'Math Homework 1',
        due_date: '2024-12-25T23:59:00Z',
        class_id: 1,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: [duplicateAssignment], error: null });

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(validInput)
      ).rejects.toThrow('Duplicate assignment found: "Math Homework 1" is already scheduled for 2024-12-25T23:59:00Z');
    });

    it('should validate input schema - empty assignments array', async () => {
      const invalidInput = { assignments: [] };

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(invalidInput)
      ).rejects.toThrow();
    });

    it('should validate input schema - invalid assignment fields', async () => {
      const invalidInput = {
        assignments: [
          {
            title: '', // Empty title
            due_date: 'invalid-date',
            class_id: -1, // Invalid class ID
            points: -10, // Negative points
          },
        ],
      };

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(invalidInput as any)
      ).rejects.toThrow();
    });

    it('should validate input schema - too many assignments', async () => {
      const tooManyAssignments = {
        assignments: Array(101).fill({
          title: 'Assignment',
          due_date: '2024-12-25T23:59:00Z',
          class_id: 1,
        }),
      };

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(tooManyAssignments)
      ).rejects.toThrow();
    });

    it('should validate field length constraints', async () => {
      const invalidLengthInput = {
        assignments: [
          {
            title: 'a'.repeat(201), // Too long title
            due_date: '2024-12-25T23:59:00Z',
            description: 'a'.repeat(1001), // Too long description
            type: 'a'.repeat(51), // Too long type
            points: 10001, // Too high points
            class_id: 1,
          },
        ],
      };

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(invalidLengthInput)
      ).rejects.toThrow();
    });

    it('should handle database insertion errors', async () => {
      const mockClass = { id: 1 };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(validInput)
      ).rejects.toThrow('Failed to save assignments. Please try again.');
    });

    it('should handle partial insertion failures', async () => {
      const mockClass = { id: 1 };
      const partialResult = [
        {
          id: 1,
          user_id: 'test-user-id',
          class_id: 1,
          title: 'Math Homework 1',
          due_date: '2024-12-25T23:59:00Z',
          status: 'incomplete',
          created_at: '2024-01-01T00:00:00Z',
          class: {
            id: 1,
            user_id: 'test-user-id',
            name: 'Math 101',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        // Missing second assignment - partial insert
      ];

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: partialResult, error: null });

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(validInput)
      ).rejects.toThrow('Not all assignments were saved successfully');
    });

    it('should handle duplicate validation errors', async () => {
      const mockClass = { id: 1 };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: mockClass, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Query failed' } });

      await expect(
        assignmentRouter.createCaller(mockContext).createBatch(validInput)
      ).rejects.toThrow('Failed to validate assignment uniqueness');
    });
  });
});