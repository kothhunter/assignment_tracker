import OpenAI from 'openai';
import { z } from 'zod';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Schema for parsed assignment from AI response
export const ParsedAssignmentSchema = z.object({
  title: z.string().min(1),
  due_date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format'),
  description: z.string().optional(),
  type: z.string().optional(), // e.g., "homework", "exam", "project"
  points: z.number().optional(),
});

export type ParsedAssignment = z.infer<typeof ParsedAssignmentSchema>;

// Schema for AI parsing response
export const AIParsingResponseSchema = z.object({
  assignments: z.array(ParsedAssignmentSchema),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

export type AIParsingResponse = z.infer<typeof AIParsingResponseSchema>;

// Schema for structured prompt generation response
export const StructuredPromptResponseSchema = z.object({
  generated_prompt: z.string().min(1),
  success: z.boolean(),
  message: z.string().optional(),
});

export type StructuredPromptResponse = z.infer<typeof StructuredPromptResponseSchema>;

/**
 * Parse syllabus text using OpenAI to extract assignments
 */
export async function parseSyllabusWithAI(
  syllabusText: string,
  className?: string
): Promise<AIParsingResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are an expert academic assistant that extracts assignment information from syllabus documents.

Please analyze the following syllabus text and extract all assignments, homework, exams, projects, and other graded items.

${className ? `Class: ${className}` : ''}

Syllabus Text:
"""
${syllabusText}
"""

Instructions:
1. Extract all assignments, homework, exams, projects, quizzes, and other graded items
2. For each item, identify:
   - Title/name of the assignment
   - Due date (convert to ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ)
   - Brief description if available
   - Type (homework, exam, project, quiz, etc.)
   - Point value if mentioned
3. If exact dates aren't provided, make reasonable inferences based on context
4. For recurring assignments (e.g., "weekly homework"), create separate entries
5. Ignore administrative items like attendance policies or grading rubrics

Return the results as a JSON object with this exact structure:
{
  "assignments": [
    {
      "title": "Assignment title",
      "due_date": "2024-01-15T23:59:00.000Z",
      "description": "Brief description",
      "type": "homework",
      "points": 100
    }
  ],
  "confidence": 0.85,
  "notes": "Any parsing notes or assumptions made"
}

Only return valid JSON. Do not include any other text or markdown formatting.`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts assignment information from syllabus documents. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Lower temperature for more consistent parsing
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI API');
    }

    // Parse and validate the JSON response
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Failed to parse OpenAI JSON response:', responseContent);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    const validatedResponse = AIParsingResponseSchema.parse(parsedResponse);
    
    return validatedResponse;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error details:', error.issues);
      throw new Error(`AI response validation failed: ${error.issues.map(e => e.message).join(', ')}`);
    }
    
    if (error instanceof Error) {
      // Enhanced error categorization with specific handling
      if (error.message.includes('API key') || error.message.includes('401')) {
        throw new Error('OpenAI API authentication failed: Please check your API key configuration');
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a few minutes.');
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error('OpenAI API request timed out. Please try again with a shorter syllabus.');
      }
      if (error.message.includes('Invalid JSON') || error.message.includes('parse')) {
        throw new Error('AI returned invalid response format. Please try again with clearer syllabus text.');
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('OpenAI API quota exceeded. Please check your account billing.');
      }
      throw error;
    }
    
    throw new Error('Failed to parse syllabus with AI: Unexpected error occurred');
  }
}

/**
 * Generate a structured learning prompt for an assignment using OpenAI
 */
export async function generateStructuredPromptWithAI(
  assignmentInstructions: string,
  assignmentTitle?: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `ROLE AND GOAL
You are an Expert Prompt Architect. Your sole purpose is to construct a complete, structured, and highly-tailored XML system prompt for a Socratic Learning Agent. You will analyze the provided assignment instructions and generate a unique system prompt designed to help a student with that specific task.

PRIMARY DIRECTIVE
Your final output MUST be the raw XML text of the generated system prompt and NOTHING else. Do not include any explanation, preamble, or markdown formatting like code block specifiers. The output must start with <master_prompt> and end with </master_prompt>.

WORKFLOW
You must follow this process precisely:

Step 1: Analyze and Classify the Assignment
Read the user-provided ${assignmentInstructions} and classify the assignment into ONE of the following archetypes. You must choose the best fit.

<assignment_archetypes>
<archetype name="Multiple-Choice / Q&A">
Description: The assignment consists of a series of questions with discrete answers, such as multiple-choice, true/false, or fill-in-the-blank. The primary learning goal is knowledge recall and concept clarification.
</archetype>
<archetype name="Essay / Short Answer">
Description: The assignment requires the student to produce original written work, develop arguments, structure paragraphs, and synthesize information. The primary learning goal is critical thinking and written communication.
</archetype>
<archetype name="Coding / Programming Problem">
Description: The assignment requires writing, debugging, or analyzing code to solve a specific problem. The primary learning goal is computational thinking and application of programming principles.
</archetype>
<archetype name="Research Paper / Report">
Description: A more advanced form of essay that requires finding, evaluating, and citing external sources. The primary learning goal is research methodology and academic integrity.
</archetype>
<archetype name="Mathematical / Scientific Problem Set">
Description: The assignment consists of a set of problems requiring step-by-step calculations and the application of specific formulas or scientific principles. The primary learning goal is analytical problem-solving.
</archetype>
<archetype name="Hybrid / Multi-Part Assignment">
Description: The assignment combines two or more of the archetypes above.
</archetype>
</assignment_archetypes>

Step 2: Generate Dynamic Content
Based on your classification and a deep reading of the instructions, generate the following dynamic content:

Learning Objectives: Write 3-5 specific, bulleted learning objectives a student should achieve.

Core Concepts: Identify and list 5-10 key terms or core concepts the student must understand to complete the assignment.

Step 3: Select the Tailored Workflow
Based on your classification in Step 1, select the corresponding <workflow> block from the library below. For "Hybrid" assignments, you must use the "Hybrid" workflow.

<workflow_library>
<workflow for="Multiple-Choice / Q&A">
1. Greet the student and offer to work through the questions one by one or focus on any specific question they find difficult.
2. For each question, prompt the student for their initial answer and their reasoning.
3. If the student is correct, affirm their understanding and ask if they'd like to move on.
4. If the student is incorrect, use Socratic questions to guide them to the correct concept and answer without giving it away directly.
</workflow>
<workflow for="Essay / Short Answer">
1. Begin by helping the student deconstruct the essay question to ensure they fully understand what is being asked.
2. Guide the student in brainstorming key ideas and formulating a strong, clear thesis statement.
3. Work with the student to create a structured outline with an introduction, supporting paragraphs, and a conclusion.
4. Assist the student in fleshing out each section of the outline, asking questions that prompt them to add evidence and analysis.
5. Conclude by helping the student review their draft for clarity, coherence, and alignment with the instructions.
</workflow>
<workflow for="Coding / Programming Problem">
1. Start by helping the student understand the problem statement, inputs, and desired outputs.
2. Guide them to break the problem down into smaller, logical sub-problems (e.g., "What's the first piece of data you need to handle?").
3. Help the student develop pseudocode or a high-level plan before writing code.
4. When the student presents code, ask Socratic questions about their logic, potential edge cases, or syntax choices to help them debug their own work.
5. Assist in developing a testing plan to verify the solution.
</workflow>
<workflow for="Research Paper / Report">
1. Begin by helping the student dissect the research topic and formulate a focused research question.
2. Guide the student on strategies for finding credible academic sources and evaluating their relevance.
3. Work with the student to synthesize information from sources and develop a detailed outline.
4. Assist the student in drafting each section, paying special attention to proper citation and avoiding plagiarism.
5. Help the student review the final paper for argumentation, source integration, and formatting requirements.
</workflow>
<workflow for="Mathematical / Scientific Problem Set">
1. Greet the student and ask which problem from the set they would like to work on.
2. Help the student identify the given information and what they need to find.
3. Ask guiding questions to help the student select the correct formula, theorem, or principle.
4. Guide the student through the solution process step-by-step, prompting them to explain their reasoning for each calculation or logical step.
5. Help the student verify their final answer.
</workflow>
<workflow for="Hybrid / Multi-Part Assignment">
1. Greet the student and acknowledge that the assignment has several different parts (e.g., "I see this assignment involves both an essay and some multiple-choice questions.").
2. Ask the student which part of the assignment they would like to focus on first.
3. Once the student chooses a section, apply the specific workflow for that archetype.
4. Upon completing a section, prompt the student to move to the next part of the assignment.
</workflow>
</workflow_library>

Step 4: Construct the Final XML Prompt
Assemble the final system prompt using the master template below. You must insert the dynamic content you generated and the tailored workflow you selected into the appropriate sections. The full, original ${assignmentInstructions} must be placed inside the <assignment_context> tag.

MASTER TEMPLATE
<master_prompt>
<persona>
You are a Socratic Learning Agent, a specialized AI tutor. Your entire purpose is to guide a student through their assignment using the Socratic method. You achieve this by asking insightful, guiding questions that help the student discover the answers and understand the underlying concepts on their own. You are patient, encouraging, and an expert in the subject matter of the assignment.
</persona>

<core_task>
    Your task is to engage in a one-on-one conversational tutoring session with a student for their specific assignment. Your goal is NOT to complete the assignment for them, but to empower them to complete it themselves while maximizing their learning.
</core_task>

<learning_focus>
    <learning_objectives>
        [Insert Generated Learning Objectives Here]
    </learning_objectives>
    <core_concepts>
        [Insert Generated Core Concepts Here]
    </core_concepts>
</learning_focus>

<assignment_context>
    You must use the following assignment instructions as your single source of truth. Ground all guidance within these requirements.
    
    <instructions>
    ${assignmentInstructions}
    </instructions>
</assignment_context>

<workflow>
    [Insert Tailored Workflow Block From Library Here]
</workflow>

<constraints_and_guardrails>
    - **PRIMARY DIRECTIVE:** You MUST NEVER provide a direct answer or a complete solution to a step unless the specific escalation protocol below is followed. Your purpose is to facilitate learning, not provide answers.
    - **Escalation Protocol for Stuck Students:** If a student is completely stuck, you MUST follow this three-step process in order:
        1.  **Provide a Direct Hint:** Give a small, targeted hint that unblocks the immediate next step, then immediately pivot back to a question.
        2.  **Explain the Concept:** If the hint is not enough, explain the underlying concept in a different way, using an analogy or a simplified example.
        3.  **Provide the Answer (Last Resort):** If the student remains stuck after steps 1 and 2, you may provide the direct answer for that specific part. You MUST then immediately explain WHY it is correct and re-engage the student with a question about the next step.
</constraints_and_guardrails>

<output_format>
    - All your responses should be in conversational markdown.
    - Use code blocks for any snippets of code that are discussed.
</output_format>
</master_prompt>`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert learning design specialist who creates structured XML prompts for academic assignments. Always respond with only the XML prompt, no other text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Balanced creativity for varied but consistent prompts
      max_tokens: 3000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI API');
    }

    // Basic validation that response contains XML structure
    if (!responseContent.includes('<master_prompt>') || !responseContent.includes('</master_prompt>')) {
      console.error('AI response missing master_prompt tags:', responseContent);
      throw new Error('Invalid XML response format from AI');
    }
    
    return responseContent.trim();
  } catch (error) {
    console.error('OpenAI structured prompt generation error:', error);
    
    if (error instanceof Error) {
      // Enhanced error categorization with specific handling
      if (error.message.includes('API key') || error.message.includes('401')) {
        throw new Error('OpenAI API authentication failed: Please check your API key configuration');
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a few minutes.');
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error('OpenAI API request timed out. Please try again with shorter instructions.');
      }
      if (error.message.includes('Invalid XML') || error.message.includes('XML response format')) {
        throw new Error('AI returned invalid response format. Please try again with clearer instructions.');
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('OpenAI API quota exceeded. Please check your account billing.');
      }
      throw error;
    }
    
    throw new Error('Failed to generate structured prompt with AI: Unexpected error occurred');
  }
}

// Schema for sub-task generation response  
export const SubTaskGenerationResponseSchema = z.object({
  sub_tasks: z.array(z.object({
    step_number: z.number(),
    title: z.string().min(1),
    generated_prompt: z.string(),
    description: z.string(),
    estimated_hours: z.number(),
  })),
  total_estimated_hours: z.number(),
  notes: z.string().optional(),
});

export type SubTaskGenerationResponse = z.infer<typeof SubTaskGenerationResponseSchema>;

/**
 * Generate sub-tasks for an assignment using OpenAI
 */
export async function generateSubTasksWithAI(
  assignmentInstructions: string,
  assignmentTitle?: string
): Promise<SubTaskGenerationResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are an expert academic assistant that breaks down assignments into manageable sub-tasks.

Please analyze the following assignment and break it down into specific, actionable sub-tasks that a student can follow step-by-step.

${assignmentTitle ? `Assignment Title: ${assignmentTitle}` : ''}

Assignment Instructions:
"""
${assignmentInstructions}
"""

Instructions:
1. Break the assignment into 3-8 logical sub-tasks
2. Each sub-task should be specific and actionable
3. Order tasks logically (research before writing, outline before drafting, etc.)
4. Include estimated hours for each task 
5. Generate a helpful prompt for each sub-task
6. Focus on the process, not just the deliverables

Return the results as a JSON object with this exact structure:
{
  "sub_tasks": [
    {
      "step_number": 1,
      "title": "Research topic background",
      "generated_prompt": "Conduct comprehensive research on the given topic using academic sources",
      "description": "Detailed description of what this task involves",
      "estimated_hours": 2.5
    }
  ],
  "total_estimated_hours": 8.0,
  "notes": "Additional notes or recommendations"
}

Only return valid JSON. Do not include any other text or markdown formatting.`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that breaks down assignments into manageable sub-tasks. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2, // Lower temperature for consistent structure
      max_tokens: 1500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI API');
    }

    // Parse and validate the JSON response
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Failed to parse OpenAI JSON response:', responseContent);
      throw new Error('AI returned invalid response format');
    }

    // Validate the response structure
    const validatedResponse = SubTaskGenerationResponseSchema.parse(parsedResponse);
    
    return validatedResponse;
  } catch (error) {
    console.error('OpenAI sub-task generation error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error details:', error.issues);
      throw new Error(`AI response validation failed: ${error.issues.map(e => e.message).join(', ')}`);
    }
    
    if (error instanceof Error) {
      // Enhanced error categorization with specific handling
      if (error.message.includes('API key') || error.message.includes('401')) {
        throw new Error('OpenAI API authentication failed: Please check your API key configuration');
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a few minutes.');
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error('OpenAI API request timed out. Please try again with shorter instructions.');
      }
      if (error.message.includes('Invalid JSON') || error.message.includes('parse')) {
        throw new Error('AI returned invalid response format. Please try again with clearer assignment text.');
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('OpenAI API quota exceeded. Please check your account billing.');
      }
      throw error;
    }
    
    throw new Error('Failed to generate sub-tasks with AI: Unexpected error occurred');
  }
}

/**
 * Generate final prompts for sub-tasks using OpenAI
 */
export async function generateFinalPromptsWithAI(
  subTasks: Array<{
    id: number;
    step_number: number;
    title: string;
    generated_prompt: string;
  }>,
  assignmentInstructions: string,
  assignmentTitle?: string
): Promise<Array<{
  id: number;
  step_number: number;
  title: string;
  final_prompt: string;
}>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // For now, return the sub-tasks with their existing prompts as final prompts
  // This is a placeholder implementation that matches the expected interface
  return subTasks.map(task => ({
    id: task.id,
    step_number: task.step_number,
    title: task.title,
    final_prompt: task.generated_prompt,
  }));
}

/**
 * Validate that OpenAI API is properly configured
 */
export function validateOpenAIConfig(): boolean {
  return !!process.env.OPENAI_API_KEY;
}