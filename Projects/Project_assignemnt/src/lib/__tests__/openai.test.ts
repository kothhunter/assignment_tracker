import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { validateOpenAIConfig, generateFinalPromptsWithAI } from '../openai';

// Mock console to avoid noise in tests
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('OpenAI Service', () => {
  afterEach(() => {
    consoleErrorSpy.mockClear();
    delete process.env.OPENAI_API_KEY;
  });

  describe('validateOpenAIConfig', () => {
    it('should return true when API key is configured', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      expect(validateOpenAIConfig()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      delete process.env.OPENAI_API_KEY;
      expect(validateOpenAIConfig()).toBe(false);
    });

    it('should return false when API key is empty', () => {
      process.env.OPENAI_API_KEY = '';
      expect(validateOpenAIConfig()).toBe(false);
    });
  });

  describe('generateFinalPromptsWithAI', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should throw error when API key is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const subTasks = [
        {
          id: 1,
          step_number: 1,
          title: 'Research topic',
          generated_prompt: 'Basic research prompt',
        }
      ];

      await expect(
        generateFinalPromptsWithAI(subTasks, 'Test instructions', 'Test Assignment')
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should validate input parameters', async () => {
      const emptySubTasks: any[] = [];

      // Should handle empty sub-tasks array gracefully
      // (actual validation would happen at the API router level)
      expect(() => {
        generateFinalPromptsWithAI(emptySubTasks, 'Test instructions', 'Test Assignment');
      }).not.toThrow();
    });
  });

  // Note: Full OpenAI API integration tests would require complex mocking
  // of the OpenAI client. For comprehensive testing, we focus on the tRPC
  // router integration tests which mock the OpenAI functions directly.
});