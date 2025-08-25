import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { AssignmentReview } from '../assignment-review';
import type { AIParsingResult, ParsedAssignment } from '@/types';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock tRPC API
const mockCreateBatch = jest.fn();
const mockInvalidateAll = jest.fn();
const mockInvalidateByClass = jest.fn();
jest.mock('@/utils/api', () => ({
  api: {
    assignment: {
      createBatch: {
        useMutation: jest.fn(() => ({
          mutate: mockCreateBatch,
          isPending: false,
        })),
      },
    },
    useUtils: jest.fn(() => ({
      assignment: {
        getAll: {
          invalidate: mockInvalidateAll,
        },
        getByClass: {
          invalidate: mockInvalidateByClass,
        },
      },
    })),
  },
}));

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock data for testing
const mockAIResult: AIParsingResult = {
  assignments: [
    {
      title: 'Homework 1',
      due_date: '2025-12-01',
      description: 'Complete problems 1-10',
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
  ],
  confidence: 0.85,
  notes: 'Successfully parsed',
  className: 'MATH 113',
  message: 'Success',
};

const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();

describe('AssignmentReview Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset API mock implementations
    const { api } = require('@/utils/api');
    api.assignment.createBatch.useMutation.mockReturnValue({
      mutate: mockCreateBatch,
      isPending: false,
    });
  });

  it('renders correctly with initial data', () => {
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Check header
    expect(screen.getByText('Review Assignments')).toBeInTheDocument();
    expect(screen.getByText(/Review and edit the 2 assignments found/)).toBeInTheDocument();

    // Check assignments are displayed
    expect(screen.getByText('Homework 1')).toBeInTheDocument();
    expect(screen.getByText('Quiz 1')).toBeInTheDocument();

    // Check stats
    expect(screen.getByText('2')).toBeInTheDocument(); // Total count
  });

  it('displays assignment details correctly', () => {
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Check first assignment details
    expect(screen.getByText('Homework 1')).toBeInTheDocument();
    expect(screen.getAllByText(/Due:/)).toHaveLength(2); // Two assignments have due dates
    expect(screen.getByText('Type: homework')).toBeInTheDocument();
    expect(screen.getByText('Points: 50')).toBeInTheDocument();
    expect(screen.getByText('Complete problems 1-10')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Find the first assignment card and click its edit button
    const homework1 = screen.getByText('Homework 1');
    const assignmentCard = homework1.closest('[class*="rounded-lg border"]');
    expect(assignmentCard).toBeInTheDocument();
    
    const editButton = within(assignmentCard as HTMLElement).getAllByRole('button')[0];
    await user.click(editButton);

    // Should show form fields
    await waitFor(() => {
      expect(screen.getByLabelText('Assignment Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Points')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
  });

  it('saves edited assignment correctly', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Find the first assignment card and click its edit button
    const homework1 = screen.getByText('Homework 1');
    const assignmentCard = homework1.closest('[class*="rounded-lg border"]');
    expect(assignmentCard).toBeInTheDocument();
    
    const editButton = within(assignmentCard as HTMLElement).getAllByRole('button')[0];
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Assignment Title')).toBeInTheDocument();
    });

    // Edit the title
    const titleInput = screen.getByLabelText('Assignment Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Homework 1');

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    // Check that assignment was updated
    await waitFor(() => {
      expect(screen.getByText('Updated Homework 1')).toBeInTheDocument();
      expect(screen.getAllByText('Edited')).toHaveLength(2); // One in stats, one in badge
      expect(toast.success).toHaveBeenCalledWith('Assignment updated successfully');
    });
  });

  it('validates form fields correctly', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Find the first assignment card and click its edit button
    const homework1 = screen.getByText('Homework 1');
    const assignmentCard = homework1.closest('[class*="rounded-lg border"]');
    expect(assignmentCard).toBeInTheDocument();
    
    const editButton = within(assignmentCard as HTMLElement).getAllByRole('button')[0];
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Assignment Title')).toBeInTheDocument();
    });

    // Clear title (should cause validation error)
    const titleInput = screen.getByLabelText('Assignment Title');
    await user.clear(titleInput);

    // Try to save
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Assignment title is required')).toBeInTheDocument();
    });
  });

  it('adds new assignment correctly', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Click add assignment button
    const addButton = screen.getByText('Add Assignment');
    await user.click(addButton);

    // Should add new assignment and enter edit mode
    await waitFor(() => {
      // The new assignment immediately goes into edit mode, so check for the form input with the value
      expect(screen.getByDisplayValue('New Assignment')).toBeInTheDocument();
      expect(screen.getByLabelText('Assignment Title')).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('New assignment added. Please edit the details.');
    });

    // Stats should update - there should be a 3 in the Total count
    const totalElements = screen.getAllByText('3');
    expect(totalElements.length).toBeGreaterThanOrEqual(1); // At least one 3 for total count
  });

  it('deletes assignment with confirmation', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Find the first assignment card and click its delete button (second button)
    const homework1 = screen.getByText('Homework 1');
    const assignmentCard = homework1.closest('[class*="rounded-lg border"]');
    expect(assignmentCard).toBeInTheDocument();
    
    const cardButtons = within(assignmentCard as HTMLElement).getAllByRole('button');
    expect(cardButtons.length).toBeGreaterThanOrEqual(2);
    
    // Click delete button (second button)
    await user.click(cardButtons[1]);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Delete Assignment?')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to remove "Homework 1"/)).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    // Assignment should be removed
    await waitFor(() => {
      expect(screen.queryByText('Homework 1')).not.toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('Assignment removed');
    });

    // Stats should update - total count should be 1, but there might be other 1s in removed count
    const totalElements = screen.getAllByText('1');
    expect(totalElements.length).toBeGreaterThanOrEqual(1); // At least one 1 for total count
  });

  it('resets to original assignments', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Add a new assignment first
    const addButton = screen.getByText('Add Assignment');
    await user.click(addButton);

    await waitFor(() => {
      const totalElements = screen.getAllByText('3');
      expect(totalElements.length).toBeGreaterThanOrEqual(1); // Total should be 3
    });

    // Click reset button
    const resetButton = screen.getByText('Reset All');
    await user.click(resetButton);

    // Confirm reset
    await waitFor(() => {
      expect(screen.getByText('Reset to Original?')).toBeInTheDocument();
    });

    const confirmResetButton = screen.getByText('Reset All Changes');
    await user.click(confirmResetButton);

    // Should restore original assignments
    await waitFor(() => {
      const totalElements = screen.getAllByText('2');
      expect(totalElements.length).toBeGreaterThanOrEqual(1); // Back to 2 assignments
      expect(toast.success).toHaveBeenCalledWith('Reset to original assignments');
    });
  });

  it('confirms and calls onConfirm with final assignments', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Click confirm button
    const confirmButton = screen.getByText('Confirm & Save');
    await user.click(confirmButton);

    // Should call onConfirm with the assignments
    expect(mockOnConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Homework 1',
          class_id: 1,
        }),
        expect.objectContaining({
          title: 'Quiz 1',
          class_id: 1,
        }),
      ])
    );
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles empty assignment list', () => {
    const emptyResult: AIParsingResult = {
      ...mockAIResult,
      assignments: [],
    };

    render(
      <AssignmentReview
        aiResult={emptyResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('No Assignments')).toBeInTheDocument();
    expect(screen.getByText('Add First Assignment')).toBeInTheDocument();
  });

  it('shows confirming state correctly', () => {
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isConfirming={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('disables confirm button when no assignments', async () => {
    const user = userEvent.setup();
    render(
      <AssignmentReview
        aiResult={mockAIResult}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Delete first assignment
    const homework1 = screen.getByText('Homework 1');
    const homework1Card = homework1.closest('[class*="rounded-lg border"]');
    if (homework1Card) {
      const cardButtons = within(homework1Card as HTMLElement).getAllByRole('button');
      if (cardButtons.length >= 2) {
        await user.click(cardButtons[1]); // Delete button
        await waitFor(() => {
          expect(screen.getByText('Delete Assignment?')).toBeInTheDocument();
        });
        const confirmButton = screen.getByText('Delete');
        await user.click(confirmButton);
      }
    }

    // Delete second assignment
    await waitFor(async () => {
      const quiz1 = screen.queryByText('Quiz 1');
      if (quiz1) {
        const quiz1Card = quiz1.closest('[class*="rounded-lg border"]');
        if (quiz1Card) {
          const cardButtons = within(quiz1Card as HTMLElement).getAllByRole('button');
          if (cardButtons.length >= 2) {
            await user.click(cardButtons[1]); // Delete button
            await waitFor(() => {
              expect(screen.getByText('Delete Assignment?')).toBeInTheDocument();
            });
            const confirmButton = screen.getByText('Delete');
            await user.click(confirmButton);
          }
        }
      }
    });

    // Confirm button should be disabled
    await waitFor(() => {
      const confirmSaveButton = screen.getByText('Confirm & Save');
      expect(confirmSaveButton).toBeDisabled();
    });
  });

  describe('Save Integration', () => {
    it('saves assignments directly when no onConfirm provided', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      const mockSuccessResponse = {
        count: 2,
        message: 'Successfully saved 2 assignments',
        assignments: [],
      };
      
      // Setup API mock to call onSuccess callback
      const { api } = require('@/utils/api');
      const mockMutationFn = jest.fn((input, options) => {
        if (options && options.onSuccess) {
          options.onSuccess(mockSuccessResponse);
        }
      });
      api.assignment.createBatch.useMutation.mockReturnValue({
        mutate: mockMutationFn,
        isPending: false,
      });

      render(
        <AssignmentReview
          aiResult={mockAIResult}
          onCancel={mockOnCancel}
          // No onConfirm provided - should save directly
        />
      );

      const confirmButton = screen.getByText('Confirm & Save');
      await user.click(confirmButton);

      // Should call API with assignments
      expect(mockMutationFn).toHaveBeenCalledWith({
        assignments: expect.arrayContaining([
          expect.objectContaining({
            title: 'Homework 1',
            due_date: '2025-12-01',
            class_id: 1,
          }),
          expect.objectContaining({
            title: 'Quiz 1',
            due_date: '2025-12-15',
            class_id: 1,
          }),
        ]),
      });
    });

    it('calls legacy onConfirm when provided', async () => {
      const user = userEvent.setup();

      render(
        <AssignmentReview
          aiResult={mockAIResult}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm & Save');
      await user.click(confirmButton);

      // Should call legacy onConfirm, not API
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Homework 1',
            class_id: 1,
          }),
          expect.objectContaining({
            title: 'Quiz 1',
            class_id: 1,
          }),
        ])
      );
      expect(mockCreateBatch).not.toHaveBeenCalled();
    });

    it('shows loading state during save operation', async () => {
      const user = userEvent.setup();
      
      // Mock pending state
      const { api } = require('@/utils/api');
      api.assignment.createBatch.useMutation.mockReturnValue({
        mutate: mockCreateBatch,
        isPending: true,
      });

      render(
        <AssignmentReview
          aiResult={mockAIResult}
          onCancel={mockOnCancel}
        />
      );

      // Should show saving state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('handles successful save with success feedback', async () => {
      const user = userEvent.setup();
      
      const mockSuccessResponse = {
        count: 2,
        message: 'Successfully saved 2 assignments',
        assignments: [],
      };

      // Mock API to simulate successful save
      const { api } = require('@/utils/api');
      const mockUseMutation = jest.fn(() => ({
        mutate: (input: any) => {
          // Simulate successful API call
          setTimeout(() => {
            // This would normally be handled by tRPC
            toast.success(`Successfully saved ${mockSuccessResponse.count} assignments!`);
            mockPush('/dashboard');
          }, 0);
        },
        isPending: false,
      }));
      api.assignment.createBatch.useMutation = mockUseMutation;

      render(
        <AssignmentReview
          aiResult={mockAIResult}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm & Save');
      await user.click(confirmButton);

      // Should have attempted to save
      const mutationCall = mockUseMutation.mock.calls[0][0];
      expect(mutationCall.onSuccess).toBeDefined();
      
      // Simulate onSuccess callback
      mutationCall.onSuccess(mockSuccessResponse);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Successfully saved 2 assignments!');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockInvalidateAll).toHaveBeenCalled();
        expect(mockInvalidateByClass).toHaveBeenCalled();
      });
    });

    it('handles save errors with error feedback', async () => {
      const user = userEvent.setup();
      
      const mockError = new Error('Network error occurred');

      // Mock API to simulate error
      const { api } = require('@/utils/api');
      const mockUseMutation = jest.fn(() => ({
        mutate: (input: any) => {
          // Simulate error
          setTimeout(() => {
            toast.error(mockError.message || 'Failed to save assignments. Please try again.');
          }, 0);
        },
        isPending: false,
      }));
      api.assignment.createBatch.useMutation = mockUseMutation;

      render(
        <AssignmentReview
          aiResult={mockAIResult}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm & Save');
      await user.click(confirmButton);

      // Should have attempted to save
      const mutationCall = mockUseMutation.mock.calls[0][0];
      expect(mutationCall.onError).toBeDefined();
      
      // Simulate onError callback
      mutationCall.onError(mockError);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error occurred');
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('formats assignment data correctly for API', async () => {
      const user = userEvent.setup();
      
      // Mock API
      const { api } = require('@/utils/api');
      const mockMutationFn = jest.fn();
      api.assignment.createBatch.useMutation.mockReturnValue({
        mutate: mockMutationFn,
        isPending: false,
      });

      render(
        <AssignmentReview
          aiResult={mockAIResult}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm & Save');
      await user.click(confirmButton);

      // Should call API with properly formatted data
      expect(mockMutationFn).toHaveBeenCalledWith({
        assignments: [
          {
            title: 'Homework 1',
            due_date: '2025-12-01',
            description: 'Complete problems 1-10',
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
        ],
      });
    });

    it('includes edited assignments in save data', async () => {
      const user = userEvent.setup();
      
      // Mock API
      const { api } = require('@/utils/api');
      const mockMutationFn = jest.fn();
      api.assignment.createBatch.useMutation.mockReturnValue({
        mutate: mockMutationFn,
        isPending: false,
      });

      render(
        <AssignmentReview
          aiResult={mockAIResult}
          onCancel={mockOnCancel}
        />
      );

      // Edit first assignment
      const homework1 = screen.getByText('Homework 1');
      const assignmentCard = homework1.closest('[class*="rounded-lg border"]');
      const editButton = within(assignmentCard as HTMLElement).getAllByRole('button')[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Assignment Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Assignment Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Homework 1');

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Homework 1')).toBeInTheDocument();
      });

      // Now confirm save
      const confirmButton = screen.getByText('Confirm & Save');
      await user.click(confirmButton);

      // Should include edited assignment
      expect(mockMutationFn).toHaveBeenCalledWith({
        assignments: expect.arrayContaining([
          expect.objectContaining({
            title: 'Updated Homework 1',
            class_id: 1,
          }),
          expect.objectContaining({
            title: 'Quiz 1',
            class_id: 1,
          }),
        ]),
      });
    });
  });
});