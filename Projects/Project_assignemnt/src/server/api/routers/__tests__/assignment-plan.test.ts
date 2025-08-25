import { TRPCError } from '@trpc/server';
import { assignmentRouter } from '../assignment';
import { createTRPCContext } from '../../trpc';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(),
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    setAll: jest.fn(),
  })),
}));

describe('assignmentRouter.initiatePlan', () => {
  const mockSession = {
    user: { id: 'user123' },
    expires: new Date().toISOString(),
  };

  const mockContext = {
    session: mockSession,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new assignment plan successfully', async () => {
    const mockAssignment = {
      id: 1,
      user_id: 'user123',
      class_id: 1,
    };

    const mockPlan = {
      id: 1,
      assignment_id: 1,
      original_instructions: 'Test instructions',
      sub_tasks: [],
      created_at: '2024-01-01T00:00:00Z',
    };

    // Mock assignment verification
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAssignment,
              error: null,
            }),
          }),
        }),
      }),
    });

    // Mock existing plan check (no existing plan)
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    });

    // Mock plan creation
    mockSupabaseClient.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockPlan,
            error: null,
          }),
        }),
      }),
    });

    const caller = assignmentRouter.createCaller(mockContext);
    const result = await caller.initiatePlan({
      assignment_id: 1,
      instructions: 'Test instructions',
    });

    expect(result).toEqual({
      plan: mockPlan,
      message: 'Assignment plan created successfully',
    });
  });

  it('throws error when assignment not found', async () => {
    // Mock assignment verification failure
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    });

    const caller = assignmentRouter.createCaller(mockContext);

    await expect(
      caller.initiatePlan({
        assignment_id: 999,
        instructions: 'Test instructions',
      })
    ).rejects.toThrow('Assignment not found or access denied');
  });

  it('throws error when assignment belongs to different user', async () => {
    const mockAssignment = {
      id: 1,
      user_id: 'different-user',
      class_id: 1,
    };

    // Mock assignment verification with different user
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, // Will be null because user_id doesn't match
              error: null,
            }),
          }),
        }),
      }),
    });

    const caller = assignmentRouter.createCaller(mockContext);

    await expect(
      caller.initiatePlan({
        assignment_id: 1,
        instructions: 'Test instructions',
      })
    ).rejects.toThrow('Assignment not found or access denied');
  });

  it('throws error when plan already exists', async () => {
    const mockAssignment = {
      id: 1,
      user_id: 'user123',
      class_id: 1,
    };

    const mockExistingPlan = {
      id: 1,
    };

    // Mock assignment verification
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAssignment,
              error: null,
            }),
          }),
        }),
      }),
    });

    // Mock existing plan check (plan exists)
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockExistingPlan,
            error: null,
          }),
        }),
      }),
    });

    const caller = assignmentRouter.createCaller(mockContext);

    await expect(
      caller.initiatePlan({
        assignment_id: 1,
        instructions: 'Test instructions',
      })
    ).rejects.toThrow('A plan already exists for this assignment');
  });

  it('validates input schema', async () => {
    const caller = assignmentRouter.createCaller(mockContext);

    // Test invalid assignment_id
    await expect(
      caller.initiatePlan({
        assignment_id: -1,
        instructions: 'Test instructions',
      })
    ).rejects.toThrow();

    // Test empty instructions
    await expect(
      caller.initiatePlan({
        assignment_id: 1,
        instructions: '',
      })
    ).rejects.toThrow();

    // Test instructions too long
    await expect(
      caller.initiatePlan({
        assignment_id: 1,
        instructions: 'a'.repeat(5001),
      })
    ).rejects.toThrow();
  });

  it('handles database errors gracefully', async () => {
    const mockAssignment = {
      id: 1,
      user_id: 'user123',
      class_id: 1,
    };

    // Mock assignment verification
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAssignment,
              error: null,
            }),
          }),
        }),
      }),
    });

    // Mock existing plan check (no existing plan)
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    });

    // Mock plan creation failure
    mockSupabaseClient.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    const caller = assignmentRouter.createCaller(mockContext);

    await expect(
      caller.initiatePlan({
        assignment_id: 1,
        instructions: 'Test instructions',
      })
    ).rejects.toThrow('Failed to create assignment plan');
  });
});