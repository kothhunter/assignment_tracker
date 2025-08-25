import { generateSubTasksWithAI, validateOpenAIConfig } from '../openai';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('Sub-task Generation with OpenAI', () => {
  const mockCompletion = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            sub_tasks: [
              {
                step_number: 1,
                title: 'Research renewable energy sources',
                generated_prompt: 'Conduct comprehensive research on different types of renewable energy sources including solar, wind, and hydroelectric power.',
                description: 'Initial research phase',
                estimated_hours: 3.0,
              },
              {
                step_number: 2,
                title: 'Create detailed outline',
                generated_prompt: 'Develop a structured outline for your research paper based on the information gathered during your research phase.',
                description: 'Structure the paper',
                estimated_hours: 1.5,
              },
            ],
            total_estimated_hours: 4.5,
            notes: 'Start early and allocate extra time for revisions',
          }),
        },
      },
    ],
  };

  const mockOpenAIInstance = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance as any);
    mockOpenAIInstance.chat.completions.create.mockResolvedValue(mockCompletion);
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('validateOpenAIConfig', () => {
    it('returns true when API key is configured', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      expect(validateOpenAIConfig()).toBe(true);
    });

    it('returns false when API key is not configured', () => {
      delete process.env.OPENAI_API_KEY;
      expect(validateOpenAIConfig()).toBe(false);
    });
  });

  describe('generateSubTasksWithAI', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    it('throws error when API key is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      
      await expect(
        generateSubTasksWithAI('Write a research paper on renewable energy')
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('successfully generates sub-tasks with valid input', async () => {
      const result = await generateSubTasksWithAI(
        'Write a comprehensive research paper on renewable energy sources, including at least 5 peer-reviewed sources and APA formatting.',
        'Renewable Energy Research Paper'
      );

      expect(result).toEqual({
        sub_tasks: [
          {
            step_number: 1,
            title: 'Research renewable energy sources',
            generated_prompt: 'Conduct comprehensive research on different types of renewable energy sources including solar, wind, and hydroelectric power.',
            description: 'Initial research phase',
            estimated_hours: 3.0,
          },
          {
            step_number: 2,
            title: 'Create detailed outline',
            generated_prompt: 'Develop a structured outline for your research paper based on the information gathered during your research phase.',
            description: 'Structure the paper',
            estimated_hours: 1.5,
          },
        ],
        total_estimated_hours: 4.5,
        notes: 'Start early and allocate extra time for revisions',
      });
    });

    it('calls OpenAI API with correct parameters', async () => {
      await generateSubTasksWithAI(
        'Write a research paper on renewable energy',
        'Renewable Energy Paper'
      );

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful academic planning assistant that breaks down assignments into manageable sub-tasks. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: expect.stringContaining('Assignment Title: Renewable Energy Paper'),
          },
        ],
        temperature: 0.2,
        max_tokens: 2500,
      });
    });

    it('includes assignment instructions in the prompt', async () => {
      const instructions = 'Write a comprehensive research paper on renewable energy sources';
      await generateSubTasksWithAI(instructions);

      const callArgs = mockOpenAIInstance.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain(instructions);
    });

    it('handles missing assignment title gracefully', async () => {
      await generateSubTasksWithAI('Write a research paper on renewable energy');

      const callArgs = mockOpenAIInstance.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[1].content).not.toContain('Assignment Title:');
    });

    it('throws error when OpenAI returns empty response', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('No response from OpenAI API');
    });

    it('throws error when OpenAI returns invalid JSON', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'invalid json response' } }],
      });

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('AI returned invalid response format');
    });

    it('validates response structure and throws error for invalid data', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                sub_tasks: [
                  {
                    // Missing required fields
                    title: 'Research paper',
                  },
                ],
              }),
            },
          },
        ],
      });

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow(/AI response validation failed/);
    });

    it('handles OpenAI API errors correctly', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('API key invalid')
      );

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('OpenAI API authentication failed: Please check your API key configuration');
    });

    it('handles rate limit errors correctly', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('rate limit exceeded')
      );

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('OpenAI API rate limit exceeded. Please try again in a few minutes.');
    });

    it('handles timeout errors correctly', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('timeout occurred')
      );

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('OpenAI API request timed out. Please try again with shorter instructions.');
    });

    it('handles quota exceeded errors correctly', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('quota exceeded')
      );

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('OpenAI API quota exceeded. Please check your account billing.');
    });

    it('handles unexpected errors correctly', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('Unexpected error')
      );

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('Unexpected error');
    });

    it('handles non-Error exceptions correctly', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        'String error'
      );

      await expect(
        generateSubTasksWithAI('Write a research paper')
      ).rejects.toThrow('Failed to generate sub-tasks with AI: Unexpected error occurred');
    });

    it('generates appropriate prompt structure', async () => {
      await generateSubTasksWithAI(
        'Write a research paper on renewable energy',
        'Renewable Energy Paper'
      );

      const callArgs = mockOpenAIInstance.chat.completions.create.mock.calls[0][0];
      const prompt = callArgs.messages[1].content;

      expect(prompt).toContain('Break down the assignment into 3-8 logical, sequential sub-tasks');
      expect(prompt).toContain('step_number: Sequential number starting from 1');
      expect(prompt).toContain('title: Concise, action-oriented title');
      expect(prompt).toContain('generated_prompt: Detailed description/prompt');
      expect(prompt).toContain('estimated_hours: Realistic time estimate');
      expect(prompt).toContain('Only return valid JSON');
    });
  });
});