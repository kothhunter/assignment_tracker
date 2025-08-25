import { aiRouter } from '../ai';
import type { ParsedAssignment } from '@/types';

// Mock Supabase client
const mockSupabaseSelect = jest.fn();
const mockSupabaseFrom = jest.fn().mockReturnValue({
  select: mockSupabaseSelect,
});

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// Mock OpenAI validation
jest.mock('@/lib/openai', () => ({
  validateOpenAIConfig: jest.fn(() => true),
  parseSyllabusWithAI: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('AI Router - Assignment Review Validation', () => {
  const mockSession = {
    user: { id: 'user123' },
    expires: '2025-12-31',
  };

  const mockContext = {
    session: mockSession,
  };

  const validAssignments: ParsedAssignment[] = [
    {
      title: 'Homework 1',
      due_date: '2025-12-01',
      description: 'Complete problems',
      type: 'homework',
      points: 50,
      class_id: 1,
    },
    {
      title: 'Quiz 1',
      due_date: '2025-12-15',
      description: 'Online quiz',
      type: 'quiz',
      points: 25,
      class_id: 1,
    },
  ];

  const mockClassData = {
    id: 1,
    name: 'MATH 113',
    user_id: 'user123',
    created_at: '2025-01-01',
  };

  beforeEach(() => {
    // Mock successful class lookup
    mockSupabaseSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockClassData,
            error: null,
          }),
        }),
      }),
    });
  });

  describe('validateReviewedAssignments', () => {
    it('successfully validates valid assignments', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const result = await caller.validateReviewedAssignments({
        assignments: validAssignments,
        classId: 1,
      });

      expect(result).toEqual({
        valid: true,
        assignments: validAssignments,
        message: 'Successfully validated 2 assignments',
        className: 'MATH 113',
      });
    });

    it('rejects assignments with invalid titles', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const invalidAssignments = [
        {
          ...validAssignments[0],
          title: '', // Empty title
        },
      ];

      await expect(
        caller.validateReviewedAssignments({
          assignments: invalidAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Assignment title is required');
    });

    it('rejects assignments with past due dates', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const invalidAssignments = [
        {
          ...validAssignments[0],
          due_date: '2020-01-01', // Past date
        },
      ];

      await expect(
        caller.validateReviewedAssignments({
          assignments: invalidAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Due date must be a valid future date');
    });

    it('rejects assignments with invalid due date format', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const invalidAssignments = [
        {
          ...validAssignments[0],
          due_date: 'invalid-date',
        },
      ];

      await expect(
        caller.validateReviewedAssignments({
          assignments: invalidAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Due date must be a valid future date');
    });

    it('rejects assignments with negative points', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const invalidAssignments = [
        {
          ...validAssignments[0],
          points: -10, // Negative points
        },
      ];

      await expect(
        caller.validateReviewedAssignments({
          assignments: invalidAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Points must be non-negative');
    });

    it('rejects assignments with too long title', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const invalidAssignments = [
        {
          ...validAssignments[0],
          title: 'a'.repeat(201), // Too long title
        },
      ];

      await expect(
        caller.validateReviewedAssignments({
          assignments: invalidAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Title is too long');
    });

    it('rejects assignments with too long description', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const invalidAssignments = [
        {
          ...validAssignments[0],
          description: 'a'.repeat(1001), // Too long description
        },
      ];

      await expect(
        caller.validateReviewedAssignments({
          assignments: invalidAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Description is too long');
    });

    it('rejects empty assignment list', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      await expect(
        caller.validateReviewedAssignments({
          assignments: [],
          classId: 1,
        })
      ).rejects.toThrow('At least one assignment is required');
    });

    it('rejects assignments with mismatched class_id', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      const invalidAssignments = [
        {
          ...validAssignments[0],
          class_id: 2, // Different class ID
        },
      ];

      await expect(
        caller.validateReviewedAssignments({
          assignments: invalidAssignments,
          classId: 1,
        })
      ).rejects.toThrow('All assignments must belong to the specified class');
    });

    it('rejects request when class is not found', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      // Mock class not found
      mockSupabaseSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      await expect(
        caller.validateReviewedAssignments({
          assignments: validAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Class not found or access denied');
    });

    it('rejects request when class belongs to different user', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      // Mock class belonging to different user
      mockSupabaseSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockClassData,
                user_id: 'different-user',
              },
              error: null,
            }),
          }),
        }),
      });

      await expect(
        caller.validateReviewedAssignments({
          assignments: validAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Class not found or access denied');
    });

    it('warns about duplicate assignment titles but allows them', async () => {
      const caller = aiRouter.createCaller(mockContext as any);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const duplicateAssignments = [
        validAssignments[0],
        {
          ...validAssignments[0],
          due_date: '2025-12-20', // Different due date but same title
        },
      ];

      const result = await caller.validateReviewedAssignments({
        assignments: duplicateAssignments,
        classId: 1,
      });

      expect(result.valid).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Duplicate assignment titles detected:',
        ['homework 1']
      );

      consoleSpy.mockRestore();
    });

    it('logs validation success', async () => {
      const caller = aiRouter.createCaller(mockContext as any);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await caller.validateReviewedAssignments({
        assignments: validAssignments,
        classId: 1,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Assignment review validation successful for user user123, class 1: 2 assignments validated'
      );

      consoleSpy.mockRestore();
    });

    it('handles database errors gracefully', async () => {
      const caller = aiRouter.createCaller(mockContext as any);

      // Mock database error
      mockSupabaseSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      await expect(
        caller.validateReviewedAssignments({
          assignments: validAssignments,
          classId: 1,
        })
      ).rejects.toThrow('Failed to validate reviewed assignments');
    });
  });
});