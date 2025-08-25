import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { aiRouter } from '../ai';

// Mock the OpenAI library
jest.mock('@/lib/openai');

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
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

// Mock console methods to avoid noise in tests
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('AI Router - parseSyllabus', () => {
  const mockContext = {
    session: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
  };

  const mockClass = {
    id: 1,
    user_id: 'test-user-id',
    name: 'CS 101 - Introduction to Computer Science',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
    
    // Mock OpenAI functions
    const { validateOpenAIConfig } = require('@/lib/openai');
    validateOpenAIConfig.mockReturnValue(true);
  });

  it('should successfully parse syllabus with valid input', async () => {
    // Mock successful class lookup
    mockSupabase.single.mockResolvedValue({
      data: mockClass,
      error: null,
    });

    // Mock successful AI parsing
    const mockAIResponse = {
      assignments: [
        {
          title: 'Homework 1: Variables and Data Types',
          due_date: '2024-02-01T23:59:00.000Z',
          description: 'Introduction to programming concepts',
          type: 'homework',
          points: 100,
        },
      ],
      confidence: 0.9,
      notes: 'High confidence parsing of structured syllabus',
    };
    
    const { parseSyllabusWithAI } = require('@/lib/openai');
    parseSyllabusWithAI.mockResolvedValue(mockAIResponse);

    const result = await aiRouter.createCaller(mockContext).parseSyllabus({
      content: 'Sample syllabus with assignments...',
      classId: 1,
    });

    expect(result).toEqual({
      assignments: [
        {
          title: 'Homework 1: Variables and Data Types',
          due_date: '2024-02-01T23:59:00.000Z',
          description: 'Introduction to programming concepts',
          type: 'homework',
          points: 100,
          class_id: 1,
        },
      ],
      confidence: 0.9,
      notes: 'High confidence parsing of structured syllabus',
      className: 'CS 101 - Introduction to Computer Science',
      message: 'Successfully extracted 1 assignments from syllabus',
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('classes');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('should validate input schema', async () => {
    // Test empty content
    await expect(
      aiRouter.createCaller(mockContext).parseSyllabus({
        content: '',
        classId: 1,
      })
    ).rejects.toThrow();

    // Test invalid class ID
    await expect(
      aiRouter.createCaller(mockContext).parseSyllabus({
        content: 'Valid content',
        classId: -1,
      })
    ).rejects.toThrow();
  });

  it('should handle OpenAI configuration errors', async () => {
    const { validateOpenAIConfig } = require('@/lib/openai');
    validateOpenAIConfig.mockReturnValue(false);

    await expect(
      aiRouter.createCaller(mockContext).parseSyllabus({
        content: 'Sample syllabus',
        classId: 1,
      })
    ).rejects.toThrow('AI parsing service is not properly configured');
  });

  it('should handle class authorization errors', async () => {
    // Mock class not found
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Class not found' },
    });

    await expect(
      aiRouter.createCaller(mockContext).parseSyllabus({
        content: 'Sample syllabus',
        classId: 999,
      })
    ).rejects.toThrow('Class not found or access denied');
  });

  it('should handle OpenAI API errors', async () => {
    // Mock successful class lookup
    mockSupabase.single.mockResolvedValue({
      data: mockClass,
      error: null,
    });

    // Mock OpenAI API failure
    const { parseSyllabusWithAI } = require('@/lib/openai');
    parseSyllabusWithAI.mockRejectedValue(new Error('OpenAI API rate limit exceeded. Please try again later.'));

    await expect(
      aiRouter.createCaller(mockContext).parseSyllabus({
        content: 'Sample syllabus',
        classId: 1,
      })
    ).rejects.toThrow('OpenAI API rate limit exceeded. Please try again later.');
  });

  it('should handle empty assignments response', async () => {
    // Mock successful class lookup
    mockSupabase.single.mockResolvedValue({
      data: mockClass,
      error: null,
    });

    // Mock AI response with no assignments
    const mockAIResponse = {
      assignments: [],
      confidence: 0.5,
      notes: 'No clear assignments found in syllabus',
    };
    
    const { parseSyllabusWithAI } = require('@/lib/openai');
    parseSyllabusWithAI.mockResolvedValue(mockAIResponse);

    const result = await aiRouter.createCaller(mockContext).parseSyllabus({
      content: 'General course information without specific assignments',
      classId: 1,
    });

    expect(result.assignments).toEqual([]);
    expect(result.message).toBe('Successfully extracted 0 assignments from syllabus');
  });

  it('should handle assignments with missing optional fields', async () => {
    // Mock successful class lookup
    mockSupabase.single.mockResolvedValue({
      data: mockClass,
      error: null,
    });

    // Mock AI response with minimal assignment data
    const mockAIResponse = {
      assignments: [
        {
          title: 'Basic Assignment',
          due_date: '2024-02-01T23:59:00.000Z',
        },
      ],
      confidence: 0.7,
    };
    
    const { parseSyllabusWithAI } = require('@/lib/openai');
    parseSyllabusWithAI.mockResolvedValue(mockAIResponse);

    const result = await aiRouter.createCaller(mockContext).parseSyllabus({
      content: 'Assignment due February 1st',
      classId: 1,
    });

    expect(result.assignments[0]).toEqual({
      title: 'Basic Assignment',
      due_date: '2024-02-01T23:59:00.000Z',
      description: '',
      type: 'assignment',
      points: undefined,
      class_id: 1,
    });
  });
});

describe('AI Router - generateFinalPrompts', () => {
  const mockContext = {
    session: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
  };

  const mockPlan = {
    id: 1,
    assignment_id: 1,
    original_instructions: 'Write a comprehensive research paper on machine learning',
    assignments: {
      id: 1,
      user_id: 'test-user-id',
      title: 'ML Research Paper',
    },
  };

  const mockSubTasks = [
    {
      id: 1,
      plan_id: 1,
      step_number: 1,
      title: 'Research topic',
      generated_prompt: 'Basic research prompt',
      description: 'Research the topic',
      estimated_hours: 2,
      status: 'pending',
      order_index: 0,
      created_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      plan_id: 1,
      step_number: 2,
      title: 'Write draft',
      generated_prompt: 'Basic writing prompt',
      description: 'Write the first draft',
      estimated_hours: 4,
      status: 'pending',
      order_index: 1,
      created_at: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
    
    // Mock OpenAI functions
    const { validateOpenAIConfig } = require('@/lib/openai');
    validateOpenAIConfig.mockReturnValue(true);
  });

  it('should successfully generate final prompts with valid input', async () => {
    // Mock successful plan lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: mockPlan,
      error: null,
    });

    // Mock successful sub-tasks lookup
    mockSupabase.select.mockImplementationOnce(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          data: mockSubTasks,
          error: null,
        })),
      })),
    }));

    // Mock successful AI final prompt generation
    const mockAIResponse = {
      final_prompts: [
        {
          step_number: 1,
          title: 'Research topic',
          generated_prompt: 'Conduct comprehensive research on machine learning by exploring academic databases like IEEE Xplore, ACM Digital Library, and Google Scholar. Focus on recent papers from the last 3-5 years and gather at least 8-10 high-quality sources. Create an annotated bibliography with summaries of each source and note how they relate to your research question.',
        },
        {
          step_number: 2,
          title: 'Write draft',
          generated_prompt: 'Using your research from step 1, write a comprehensive first draft of your machine learning research paper. Structure it with an introduction, literature review, methodology section, and conclusion. Aim for 2000-3000 words and ensure each paragraph supports your main thesis. Use proper academic writing style and cite your sources using the required citation format.',
        },
      ],
      completion_notes: 'All prompts generated successfully with detailed guidance',
      message: 'Final prompts generated successfully',
    };
    
    const { generateFinalPromptsWithAI } = require('@/lib/openai');
    generateFinalPromptsWithAI.mockResolvedValue(mockAIResponse);

    // Mock database updates
    const mockUpdate = jest.fn(() => ({
      eq: jest.fn(() => ({
        error: null,
      })),
    }));
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'sub_tasks') {
        return {
          update: mockUpdate,
        };
      }
      if (table === 'assignment_plans') {
        return {
          update: mockUpdate,
        };
      }
      return mockSupabase;
    });

    const result = await aiRouter.createCaller(mockContext).generateFinalPrompts({
      planId: 1,
    });

    expect(result.success).toBe(true);
    expect(result.total_prompts_generated).toBe(2);
    expect(result.completion_notes).toBe('All prompts generated successfully with detailed guidance');

    expect(generateFinalPromptsWithAI).toHaveBeenCalledWith(
      mockSubTasks,
      'Write a comprehensive research paper on machine learning',
      'ML Research Paper'
    );
  });

  it('should validate input schema for generateFinalPrompts', async () => {
    // Test invalid plan ID
    await expect(
      aiRouter.createCaller(mockContext).generateFinalPrompts({
        planId: -1,
      })
    ).rejects.toThrow();

    await expect(
      aiRouter.createCaller(mockContext).generateFinalPrompts({
        planId: 0,
      })
    ).rejects.toThrow();
  });

  it('should handle OpenAI configuration errors in generateFinalPrompts', async () => {
    const { validateOpenAIConfig } = require('@/lib/openai');
    validateOpenAIConfig.mockReturnValue(false);

    await expect(
      aiRouter.createCaller(mockContext).generateFinalPrompts({
        planId: 1,
      })
    ).rejects.toThrow('AI final prompt generation service is not properly configured');
  });

  it('should handle plan authorization errors in generateFinalPrompts', async () => {
    // Mock plan not found
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Plan not found' },
    });

    await expect(
      aiRouter.createCaller(mockContext).generateFinalPrompts({
        planId: 999,
      })
    ).rejects.toThrow('Plan not found or access denied');
  });

  it('should handle missing sub-tasks in generateFinalPrompts', async () => {
    // Mock successful plan lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: mockPlan,
      error: null,
    });

    // Mock empty sub-tasks lookup
    mockSupabase.select.mockImplementationOnce(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    }));

    await expect(
      aiRouter.createCaller(mockContext).generateFinalPrompts({
        planId: 1,
      })
    ).rejects.toThrow('No sub-tasks found to generate prompts for');
  });
});